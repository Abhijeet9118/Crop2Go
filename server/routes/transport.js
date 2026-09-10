const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const {
  recommendVehicleTier,
  aggregateBookingsByDateAndVillage
} = require('../services/transportAggregator');

function ensureTransportTables(db) {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS transport_slots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slot_code TEXT UNIQUE NOT NULL,
        farmer_id INTEGER NOT NULL,
        fpo_id INTEGER,
        produce_type TEXT NOT NULL,
        quantity_kg REAL NOT NULL,
        pickup_village TEXT NOT NULL,
        preferred_date DATE NOT NULL,
        harvest_date DATE,
        contact_phone TEXT NOT NULL,
        notes TEXT,
        schedule_id INTEGER,
        status TEXT DEFAULT 'confirmed',
        estimated_cost REAL,
        pickup_window TEXT DEFAULT '09:00 AM - 12:00 PM',
        assigned_vehicle_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (farmer_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS transport_schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        schedule_code TEXT UNIQUE NOT NULL,
        fpo_id INTEGER NOT NULL,
        scheduled_date DATE NOT NULL,
        village_cluster TEXT NOT NULL,
        total_quantity_kg REAL DEFAULT 0,
        booking_count INTEGER DEFAULT 0,
        recommended_vehicle_tier TEXT,
        assigned_vehicle_id INTEGER,
        status TEXT DEFAULT 'scheduled',
        pickup_window TEXT DEFAULT '08:00 AM - 12:00 PM',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (e) {}
}

// -------------------------------------------------------------
// FARMER TRANSPORT SLOTS (SHARED DEMAND AGGREGATION)
// -------------------------------------------------------------

// POST /api/transport/slots — Farmer reserves transport slot
router.post('/slots', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    ensureTransportTables(db);
    const farmerId = req.user.id;

    const {
      produce_type,
      quantity_kg,
      pickup_village,
      preferred_date,
      harvest_date,
      contact_phone,
      notes
    } = req.body;

    const qty = parseFloat(quantity_kg) || 100;
    const date = preferred_date || new Date().toISOString().split('T')[0];
    const village = pickup_village || req.user.village || 'Baramati';

    // Generate unique Slot Code
    const countRow = db.prepare(`SELECT COUNT(*) as c FROM transport_slots`).get();
    const seq = (countRow ? countRow.c : 0) + 1;
    const dateCode = date.replace(/-/g, '').slice(2);
    const slotCode = `SLOT-${dateCode}-${String(seq).padStart(3, '0')}`;

    // Estimated shared rate per kg (e.g. ₹0.85/kg)
    const estCost = Math.round(qty * 0.85);

    const stmt = db.prepare(`
      INSERT INTO transport_slots (
        slot_code, farmer_id, fpo_id, produce_type, quantity_kg,
        pickup_village, preferred_date, harvest_date, contact_phone,
        notes, status, estimated_cost
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)
    `);

    const info = stmt.run(
      slotCode,
      farmerId,
      req.user.fpo_id || 1,
      produce_type || 'Tomato',
      qty,
      village,
      date,
      harvest_date || date,
      contact_phone || req.user.phone || '9999900010',
      notes || null,
      estCost
    );

    // Save DB
    db.save();

    res.status(201).json({
      success: true,
      id: info.lastInsertRowid,
      slot_code: slotCode,
      message: `Transport slot reserved for ${qty} kg ${produce_type} on ${date}. The FPO will consolidate with other village farmers to dispatch the optimal vehicle!`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/transport/my-slots — Farmer views their booked slots
router.get('/my-slots', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    ensureTransportTables(db);
    const farmerId = req.user.id;

    const slots = db.prepare(`
      SELECT s.*, v.vehicle_number, v.vehicle_type, v.driver_name, v.driver_phone
      FROM transport_slots s
      LEFT JOIN transport_schedules sch ON s.schedule_id = sch.id
      LEFT JOIN vehicles v ON sch.assigned_vehicle_id = v.id
      WHERE s.farmer_id = ?
      ORDER BY s.preferred_date ASC, s.created_at DESC
    `).all(farmerId);

    res.json({ slots, count: slots.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// FPO ADMIN AGGREGATION DASHBOARD & LOGISTICS SCHEDULING
// -------------------------------------------------------------

// GET /api/transport/aggregated — Grouped Demand by Date & Village
router.get('/aggregated', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    ensureTransportTables(db);

    const activeSlots = db.prepare(`
      SELECT s.*, u.name as farmer_name, u.phone as farmer_phone
      FROM transport_slots s
      LEFT JOIN users u ON s.farmer_id = u.id
      WHERE s.status IN ('confirmed', 'aggregated', 'assigned', 'in_transit')
      ORDER BY s.preferred_date ASC, s.pickup_village ASC
    `).all();

    const clusters = aggregateBookingsByDateAndVillage(activeSlots);

    // Also get all available fleet vehicles for quick assignment dropdown
    const availableVehicles = db.prepare(`SELECT * FROM vehicles WHERE status = 'available'`).all();

    res.json({
      clusters,
      total_active_bookings: activeSlots.length,
      available_vehicles: availableVehicles
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/transport/schedules/assign — Approve schedule & assign vehicle
router.post('/schedules/assign', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    ensureTransportTables(db);

    const { date, village, vehicle_id, pickup_window } = req.body;

    const vehicle = db.prepare(`SELECT * FROM vehicles WHERE id = ?`).get(vehicle_id);
    const vehicleName = vehicle ? `${vehicle.vehicle_type?.replace(/_/g, ' ')} (${vehicle.vehicle_number})` : 'Assigned Truck';

    // Update slots for that date and village
    db.prepare(`
      UPDATE transport_slots
      SET status = 'assigned', pickup_window = ?, assigned_vehicle_name = ?
      WHERE preferred_date = ? AND pickup_village = ? AND status IN ('confirmed', 'aggregated')
    `).run(pickup_window || '09:00 AM - 12:00 PM', vehicleName, date, village);

    if (vehicle_id) {
      db.prepare(`UPDATE vehicles SET status = 'booked' WHERE id = ?`).run(vehicle_id);
    }

    db.save();
    res.json({ success: true, message: `Vehicle ${vehicleName} successfully assigned for ${village} on ${date}!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/transport/slots/:id/status — Update slot lifecycle status
router.put('/slots/:id/status', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    ensureTransportTables(db);
    const { status } = req.body;

    db.prepare(`UPDATE transport_slots SET status = ? WHERE id = ?`).run(status, req.params.id);
    db.save();

    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/transport/report — Generate Logistics Plan
router.get('/report', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    ensureTransportTables(db);

    const targetDate = req.query.date || new Date().toISOString().split('T')[0];

    const slots = db.prepare(`
      SELECT s.*, u.name as farmer_name
      FROM transport_slots s
      LEFT JOIN users u ON s.farmer_id = u.id
      WHERE s.preferred_date = ?
      ORDER BY s.pickup_village ASC
    `).all(targetDate);

    const clusters = aggregateBookingsByDateAndVillage(slots);

    res.json({
      target_date: targetDate,
      clusters,
      total_farmers: slots.length,
      total_tonnage_kg: slots.reduce((s, x) => s + x.quantity_kg, 0)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// FLEET VEHICLE REGISTRY (LEGACY + COMPATIBILITY)
// -------------------------------------------------------------

router.get('/vehicles', (req, res) => {
  try {
    const db = getDb();
    let query = `SELECT * FROM vehicles WHERE 1=1`;
    const params = [];
    if (req.query.fpo_id) { query += ` AND (fpo_id = ? OR fpo_id IS NULL)`; params.push(req.query.fpo_id); }
    if (req.query.vehicle_type) { query += ` AND vehicle_type = ?`; params.push(req.query.vehicle_type); }
    if (req.query.status) { query += ` AND status = ?`; params.push(req.query.status); }
    query += ` ORDER BY rating DESC`;
    const vehicles = db.prepare(query).all(...params);
    res.json({ vehicles, count: vehicles.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/vehicles', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const { fpo_id, vehicle_number, vehicle_type, capacity_kg, has_cold_chain, operator_name, driver_name, driver_phone, rate } = req.body;
    const isCold = has_cold_chain || vehicle_type === 'cold_truck' ? 1 : 0;
    const stmt = db.prepare(`
      INSERT INTO vehicles (fpo_id, vehicle_number, vehicle_type, capacity_kg, has_cold_chain, operator_name, driver_name, driver_phone, rate, rating, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 4.5, 'available')
    `);
    const info = stmt.run(fpo_id || 1, vehicle_number, vehicle_type || 'mini_truck', capacity_kg || 1500, isCold, operator_name || 'Agri Transport', driver_name || 'Driver', driver_phone || '9876543210', rate || 2500);
    db.save();
    res.status(201).json({ id: info.lastInsertRowid, message: 'Vehicle registered' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
