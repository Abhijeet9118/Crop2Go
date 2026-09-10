const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

// Known city coordinates in India for realistic routing
const CITY_COORDS = {
  'mumbai': [19.0760, 72.8777],
  'pune': [18.5204, 73.8567],
  'delhi': [28.7041, 77.1025],
  'lucknow': [26.8467, 80.9462],
  'gorakhpur': [26.7606, 83.3732],
  'kanpur': [26.4499, 80.3319],
  'jaipur': [26.9124, 75.7873],
  'nashik': [19.9975, 73.7898],
  'nagpur': [21.1458, 79.0882],
  'bangalore': [12.9716, 77.5946],
  'hyderabad': [17.3850, 78.4867],
  'ahmedabad': [23.0225, 72.5714],
  'surat': [21.1702, 72.8311]
};

function getCoordsForDestination(destName) {
  if (!destName) return [19.0760, 72.8777];
  const lower = destName.toLowerCase();
  for (const city in CITY_COORDS) {
    if (lower.includes(city)) return CITY_COORDS[city];
  }
  return [19.0760, 72.8777]; // Default to Mumbai
}

// Haversine formula for distance in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// 1. Create a new dispatch linked to a Buyer Order with strict quantity validation
router.post('/', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const {
      fpo_id,
      order_id,
      vehicle_number,
      vehicle_type,
      driver_name,
      driver_phone,
      cold_chain,
      quantity_kg,
      destination_custom
    } = req.body;

    const requestedQty = parseFloat(quantity_kg) || 5000;

    let qty = requestedQty;
    let destination = destination_custom || 'Mumbai Central APMC';
    let buyerName = 'Registered Buyer';
    let masterLotId = null;
    let orderRow = null;

    if (order_id) {
      orderRow = db.prepare(`
        SELECT o.*, b.business_name, u.name as user_name
        FROM orders o
        LEFT JOIN buyers b ON o.buyer_id = b.id
        LEFT JOIN users u ON b.user_id = u.id
        WHERE o.id = ?
      `).get(order_id);

      if (orderRow) {
        // Calculate already dispatched quantity for this order
        const dispSum = db.prepare(`
          SELECT COALESCE(SUM(quantity_kg), 0) as total_disp
          FROM dispatches
          WHERE order_id = ? AND status != 'cancelled'
        `).get(order_id);

        const alreadyDispatched = dispSum ? dispSum.total_disp : 0;
        const remainingToDispatch = Math.max(0, orderRow.quantity_kg - alreadyDispatched);

        // PREVENT DISPATCH OVERFLOW
        if (requestedQty > remainingToDispatch) {
          return res.status(400).json({
            error: `Cannot dispatch ${requestedQty.toLocaleString()} KG. Only ${remainingToDispatch.toLocaleString()} KG remaining for Order ${orderRow.order_id}.`
          });
        }

        qty = requestedQty;
        buyerName = orderRow.business_name || orderRow.user_name || 'Buyer';
        destination = destination_custom || `${buyerName} Hub (${orderRow.destination || 'Commercial Terminal'})`;
        masterLotId = orderRow.master_lot_id;
      }
    }

    const date = new Date();
    const dateStr = `${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const countRow = db.prepare(`SELECT COUNT(*) as c FROM dispatches`).get();
    const seq = (countRow ? countRow.c : 0) + 1;
    const dispatch_id = `DISP-${dateStr}-${String(seq).padStart(3, '0')}`;

    const expected = new Date(Date.now() + 6 * 3600 * 1000).toISOString();

    // Default origin: FPO warehouse location (Baramati/Pune)
    const originLat = 18.5204;
    const originLng = 73.8567;

    const stmt = db.prepare(`
      INSERT INTO dispatches (
        dispatch_id, fpo_id, order_id, master_lot_id, quantity_kg, destination, buyer_name,
        vehicle_number, vehicle_type, driver_name, driver_phone, cold_chain, expected_arrival,
        status, current_lat, current_lng, speed, heading, is_live_tracking, last_location_update
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'loading', ?, ?, 0, 0, 1, CURRENT_TIMESTAMP)
    `);

    const info = stmt.run(
      dispatch_id,
      fpo_id || req.user.fpo_id || 1,
      order_id || null,
      masterLotId,
      qty,
      destination,
      buyerName,
      vehicle_number || 'MH-12-TR-9021',
      vehicle_type || 'standard_truck',
      driver_name || 'Vikram Yadav',
      driver_phone || '9822019283',
      cold_chain ? 1 : 0,
      expected,
      originLat,
      originLng
    );

    // If whole order is fulfilled, update order status
    if (orderRow) {
      const newTotalDispatched = (orderRow.quantity_kg - qty <= 0);
      db.prepare(`UPDATE orders SET status = 'dispatched' WHERE id = ?`).run(order_id);
    }

    res.status(201).json({
      id: info.lastInsertRowid,
      dispatch_id,
      quantity_kg: qty,
      destination,
      message: 'Dispatch created successfully'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Active dispatches for live multi-truck map
router.get('/active-map', (req, res) => {
  try {
    const db = getDb();
    const fpoId = (req.user && req.user.fpo_id) || req.query.fpo_id || 1;

    const active = db.prepare(`
      SELECT 
        d.*,
        o.order_id as order_code,
        o.crop_type,
        o.quantity_kg as order_total_kg,
        f.name as fpo_name,
        COALESCE(f.lat, 18.5204) as origin_lat,
        COALESCE(f.lng, 73.8567) as origin_lng
      FROM dispatches d
      LEFT JOIN orders o ON d.order_id = o.id
      LEFT JOIN fpos f ON d.fpo_id = f.id
      WHERE d.fpo_id = ? AND d.status IN ('loading', 'in_transit', 'delayed')
      ORDER BY d.created_at DESC
    `).all(fpoId);

    const warehouse = {
      name: 'Kisaan Sahyog FPO Central Hub',
      lat: 18.5204,
      lng: 73.8567,
      address: 'Central Aggregation Warehouse, Pune'
    };

    // Enrich each truck with destination coordinates and distance calculations
    const enriched = active.map(truck => {
      const destCoords = getCoordsForDestination(truck.destination);
      const curLat = truck.current_lat || truck.origin_lat || 18.5204;
      const curLng = truck.current_lng || truck.origin_lng || 73.8567;
      const distRemaining = calculateDistance(curLat, curLng, destCoords[0], destCoords[1]);

      // Calculate realistic ETA based on remaining km at ~50km/h
      const hoursRemaining = (distRemaining / 48).toFixed(1);
      const etaTime = new Date(Date.now() + Math.round(parseFloat(hoursRemaining) * 3600 * 1000));
      const etaFormatted = etaTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return {
        ...truck,
        origin_lat: truck.origin_lat || 18.5204,
        origin_lng: truck.origin_lng || 73.8567,
        current_lat: curLat,
        current_lng: curLng,
        dest_lat: destCoords[0],
        dest_lng: destCoords[1],
        destination_address: truck.destination || 'APMC Market Vashi, Navi Mumbai',
        buyer_name: truck.buyer_name || 'APMC Wholesaler',
        originCoords: [truck.origin_lat || 18.5204, truck.origin_lng || 73.8567],
        currentCoords: [curLat, curLng],
        destinationCoords: destCoords,
        distanceRemainingKm: distRemaining,
        eta: etaFormatted,
        estimatedArrivalTime: etaFormatted,
        isGpsActive: Boolean(truck.is_live_tracking && truck.current_lat)
      };
    });

    // Summary counters
    const summary = {
      totalActive: enriched.length,
      inTransit: enriched.filter(t => t.status === 'in_transit').length,
      loading: enriched.filter(t => t.status === 'loading').length,
      delayed: enriched.filter(t => t.status === 'delayed').length,
      totalQuantityInTransit: enriched.reduce((acc, t) => acc + (t.quantity_kg || 0), 0)
    };

    res.json({ warehouse, summary, trucks: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Buyer order quantity progress tracking
router.get('/order-progress/:orderId', (req, res) => {
  try {
    const db = getDb();
    const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const dispatches = db.prepare(`SELECT * FROM dispatches WHERE order_id = ?`).all(req.params.orderId);
    const totalOrderKg = order.quantity_kg;
    const dispatchedKg = dispatches.reduce((acc, d) => acc + d.quantity_kg, 0);
    const inTransitKg = dispatches.filter(d => d.status === 'in_transit').reduce((acc, d) => acc + d.quantity_kg, 0);
    const deliveredKg = dispatches.filter(d => d.status === 'delivered').reduce((acc, d) => acc + d.quantity_kg, 0);
    const remainingToDispatch = Math.max(0, totalOrderKg - dispatchedKg);

    res.json({
      order_id: order.id,
      order_code: order.order_id,
      total_quantity_kg: totalOrderKg,
      order_total_kg: totalOrderKg,
      dispatched_kg: dispatchedKg,
      in_transit_kg: inTransitKg,
      delivered_kg: deliveredKg,
      remaining_to_dispatch_kg: remainingToDispatch,
      buyer_name: order.buyer_name || 'Buyer',
      dispatches_count: dispatches.length,
      dispatches
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Update live GPS coordinates from driver device or tracking API
router.put('/:id/location', (req, res) => {
  try {
    const db = getDb();
    const { lat, lng, speed, heading, current_location } = req.body;

    const numLat = parseFloat(lat);
    const numLng = parseFloat(lng);
    const numSpeed = parseFloat(speed) || 0;
    const numHeading = parseFloat(heading) || 0;

    if (isNaN(numLat) || isNaN(numLng)) {
      return res.status(400).json({ error: 'Valid latitude and longitude numbers are required' });
    }

    db.prepare(`
      UPDATE dispatches
      SET
        current_lat = ?,
        current_lng = ?,
        speed = ?,
        heading = ?,
        is_live_tracking = 1,
        current_location = COALESCE(?, current_location),
        last_location_update = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(numLat, numLng, numSpeed, numHeading, current_location || null, req.params.id);

    // Save history point
    db.prepare(`
      INSERT INTO dispatch_location_history (dispatch_id, lat, lng, speed, heading)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.params.id, numLat, numLng, numSpeed, numHeading);

    res.json({
      success: true,
      message: 'Live GPS location updated',
      lat: numLat,
      lng: numLng,
      speed: numSpeed
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Update dispatch status (Loading -> In Transit -> Reached Destination -> Delivered -> Cancelled)
router.put('/:id/status', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const { status } = req.body;
    db.prepare(`UPDATE dispatches SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(status, req.params.id);

    if (status === 'delivered') {
      const d = db.prepare(`SELECT order_id FROM dispatches WHERE id = ?`).get(req.params.id);
      if (d && d.order_id) {
        db.prepare(`UPDATE orders SET status = 'delivered' WHERE id = ?`).run(d.order_id);
      }
    }
    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. List dispatches with filters
router.get('/', (req, res) => {
  try {
    const db = getDb();
    let query = `
      SELECT d.*, o.crop_type, o.price_per_kg, o.total_amount, o.order_id as order_code
      FROM dispatches d
      LEFT JOIN orders o ON d.order_id = o.id
      LEFT JOIN buyers b ON o.buyer_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (req.query.fpo_id) { query += ` AND d.fpo_id = ?`; params.push(req.query.fpo_id); }
    if (req.query.status) { query += ` AND d.status = ?`; params.push(req.query.status); }
    if (req.query.buyer_id) {
      query += ` AND (o.buyer_id = ? OR b.user_id = ?)`;
      params.push(req.query.buyer_id, req.query.buyer_id);
    }
    query += ` ORDER BY d.created_at DESC`;

    const dispatches = db.prepare(query).all(...params);
    res.json({ dispatches, count: dispatches.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Get single dispatch details
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const dispatch = db.prepare(`
      SELECT d.*, o.order_id as order_code, o.crop_type, o.price_per_kg, o.total_amount
      FROM dispatches d
      LEFT JOIN orders o ON d.order_id = o.id
      WHERE d.id = ?
    `).get(req.params.id);

    if (!dispatch) return res.status(404).json({ error: 'Dispatch not found' });
    res.json(dispatch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
