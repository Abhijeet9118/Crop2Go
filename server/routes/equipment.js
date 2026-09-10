const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

router.get('/', (req, res) => {
  try {
    const db = getDb();
    let query = `SELECT * FROM equipment WHERE 1=1`;
    const params = [];
    if (req.query.fpo_id) { query += ` AND fpo_id = ?`; params.push(req.query.fpo_id); }
    if (req.query.status) { query += ` AND status = ?`; params.push(req.query.status); }
    query += ` ORDER BY created_at DESC`;
    const equipment = db.prepare(query).all(...params);
    res.json({ equipment, count: equipment.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const { fpo_id, name, type, owner_type, owner_name, rate_per_hour } = req.body;
    const rate = parseFloat(rate_per_hour) || 800;
    const info = db.prepare(`
      INSERT INTO equipment (fpo_id, name, type, owner_type, owner_name, rate_per_hour, status)
      VALUES (?, ?, ?, ?, ?, ?, 'available')
    `).run(fpo_id || 1, name, type || 'tractor', owner_type || 'fpo_fleet', owner_name || 'FPO Fleet', rate);
    res.status(201).json({ id: info.lastInsertRowid, message: 'Equipment added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/bookings', (req, res) => {
  try {
    const db = getDb();
    let query = `
      SELECT b.*, e.name as equipment_name, e.rate_per_hour, u.name as farmer_name, u.phone as farmer_phone
      FROM equipment_bookings b
      LEFT JOIN equipment e ON b.equipment_id = e.id
      LEFT JOIN users u ON b.farmer_id = u.id
      WHERE 1=1
    `;
    const params = [];
    if (req.query.farmer_id) { query += ` AND b.farmer_id = ?`; params.push(req.query.farmer_id); }
    if (req.query.fpo_id) { query += ` AND b.fpo_id = ?`; params.push(req.query.fpo_id); }
    if (req.query.status) { query += ` AND b.status = ?`; params.push(req.query.status); }
    query += ` ORDER BY b.created_at DESC`;
    const bookings = db.prepare(query).all(...params);
    res.json({ bookings, count: bookings.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Equipment Recommendations based on Farmer's Active Crops
const { generateEquipmentPredictions } = require('../services/equipmentPredictionService');

router.get('/recommendations', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const farmerId = req.query.farmer_id || req.user.id;

    // Fetch farmer's active crops
    const crops = db.prepare(`
      SELECT * FROM crop_cycles
      WHERE farmer_id = ? AND status = 'active'
      ORDER BY created_at DESC
    `).all(farmerId);

    const recommendations = generateEquipmentPredictions(crops);

    // Save/update recommendations and persistent notifications
    for (const rec of recommendations) {
      if (rec.crop_id) {
        // Create persistent advance reminder in crop_notifications if not exists
        const existingNote = db.prepare(`
          SELECT id FROM crop_notifications
          WHERE farmer_id = ? AND title LIKE ? AND is_read = 0
        `).get(farmerId, `%${rec.equipment_name}%`);

        if (!existingNote) {
          db.prepare(`
            INSERT INTO crop_notifications (farmer_id, crop_cycle_id, type, title, message)
            VALUES (?, ?, 'equipment', ?, ?)
          `).run(
            farmerId,
            rec.crop_id,
            `🔔 Equipment Reminder: ${rec.equipment_name}`,
            `Your ${rec.crop_name} crop is expected to need a ${rec.equipment_name} around ${rec.expected_window}. Recommended booking window: ${rec.recommended_booking_window}.`
          );
        }
      }
    }

    res.json({ count: recommendations.length, recommendations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/book', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const { equipment_id, farmer_id, fpo_id, booking_date, start_time, duration_hours, crop_id } = req.body;

    const bDate = booking_date || new Date().toISOString().split('T')[0];

    // DOUBLE BOOKING PREVENTION
    const existing = db.prepare(`
      SELECT * FROM equipment_bookings
      WHERE equipment_id = ? AND booking_date = ? AND status IN ('confirmed', 'pending')
    `).get(equipment_id, bDate);

    if (existing) {
      return res.status(400).json({
        error: `This equipment is already reserved for ${bDate}. Please choose an alternative date or similar machine.`
      });
    }

    const eq = db.prepare(`SELECT * FROM equipment WHERE id = ?`).get(equipment_id);
    const rate = eq ? eq.rate_per_hour : 800;
    const hours = parseFloat(duration_hours) || 4;
    const est_cost = rate * hours;

    const info = db.prepare(`
      INSERT INTO equipment_bookings (equipment_id, farmer_id, fpo_id, booking_date, start_time, hours_used, total_cost, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')
    `).run(equipment_id, farmer_id || req.user.id, fpo_id || 1, bDate, start_time || '08:00', hours, est_cost);

    // If a notification existed for this equipment, mark as read
    if (eq) {
      db.prepare(`
        UPDATE crop_notifications
        SET is_read = 1
        WHERE farmer_id = ? AND title LIKE ?
      `).run(farmer_id || req.user.id, `%${eq.name}%`);
    }

    res.status(201).json({
      id: info.lastInsertRowid,
      message: `Equipment ${eq ? eq.name : ''} booked successfully for ${bDate}!`,
      booking_date: bDate,
      total_cost: est_cost
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/bookings/:id/confirm', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    db.prepare(`UPDATE equipment_bookings SET status = 'confirmed' WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/bookings/:id/complete', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const { hours_used, total_cost } = req.body;
    db.prepare(`UPDATE equipment_bookings SET status = 'completed', hours_used = ?, total_cost = ? WHERE id = ?`).run(hours_used || 4, total_cost || 3200, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
