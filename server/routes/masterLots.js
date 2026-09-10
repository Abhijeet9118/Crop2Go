const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const { fpo_id, crop_type, lot_ids } = req.body;
    
    if (!lot_ids || lot_ids.length === 0) {
      return res.status(400).json({ error: 'No lots selected' });
    }
    
    const date = new Date();
    const dateStr = `${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const prefix = (crop_type || 'CRP').substring(0, 3).toUpperCase();
    const countRow = db.prepare(`SELECT COUNT(*) as c FROM master_lots`).get();
    const seq = (countRow ? countRow.c : 0) + 1;
    const master_lot_id = `MASTER-${prefix}-${dateStr}-${seq}`;
    
    let total_a = 0, total_b = 0, total_c = 0, total_rej = 0;
    const placeholders = lot_ids.map(() => '?').join(',');
    const gradingRecords = db.prepare(`SELECT * FROM grading_records WHERE lot_id IN (${placeholders})`).all(...lot_ids);
    
    gradingRecords.forEach(r => {
      total_a += r.grade_a_kg || 0;
      total_b += r.grade_b_kg || 0;
      total_c += r.grade_c_kg || 0;
      total_rej += r.rejected_kg || 0;
    });

    const total_quantity = total_a + total_b + total_c;
    const contributing_farmers_count = db.prepare(`SELECT COUNT(DISTINCT farmer_id) as c FROM lots WHERE id IN (${placeholders})`).get(...lot_ids).c;
    
    const stmt = db.prepare(`
      INSERT INTO master_lots (master_lot_id, fpo_id, crop_type, total_quantity_kg, grade_a_kg, grade_b_kg, grade_c_kg, rejected_kg, contributing_farmers, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
    `);
    const info = stmt.run(master_lot_id, fpo_id || 1, crop_type, total_quantity, total_a, total_b, total_c, total_rej, contributing_farmers_count);
    const mlId = info.lastInsertRowid;
    
    db.prepare(`UPDATE lots SET master_lot_id = ?, status = 'aggregated' WHERE id IN (${placeholders})`).run(mlId, ...lot_ids);
    
    res.status(201).json({ id: mlId, master_lot_id, message: 'Master lot created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', (req, res) => {
  try {
    const db = getDb();
    let query = `SELECT * FROM master_lots WHERE 1=1`;
    const params = [];
    if (req.query.fpo_id) { query += ` AND fpo_id = ?`; params.push(req.query.fpo_id); }
    if (req.query.status) { query += ` AND status = ?`; params.push(req.query.status); }
    if (req.query.crop_type) { query += ` AND crop_type = ?`; params.push(req.query.crop_type); }
    query += ` ORDER BY created_at DESC`;
    const masterLots = db.prepare(query).all(...params);
    res.json({ masterLots, count: masterLots.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const masterLot = db.prepare(`SELECT * FROM master_lots WHERE id = ?`).get(req.params.id);
    if (!masterLot) return res.status(404).json({ error: 'Master lot not found' });
    
    const lots = db.prepare(`
      SELECT l.*, u.name as farmer_name 
      FROM lots l 
      JOIN users u ON l.farmer_id = u.id 
      WHERE l.master_lot_id = ?
    `).all(req.params.id);
    
    res.json({ masterLot: { ...masterLot, contributing_lots: lots }, ...masterLot, contributing_lots: lots });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/close', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    db.prepare(`UPDATE master_lots SET status = 'closed' WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
