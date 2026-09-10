const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const { farmer_id, fpo_id, crop_type, variety, estimated_quantity, harvest_date, collection_centre, recorded_by } = req.body;
    const date = new Date();
    const dateStr = `${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const prefix = (crop_type || 'CRP').substring(0, 3).toUpperCase();
    
    const countRow = db.prepare(`SELECT COUNT(*) as c FROM lots`).get();
    const seq = (countRow ? countRow.c : 0) + 1;
    const lot_id = `${prefix}-${dateStr}-${seq}`;
    
    const stmt = db.prepare(`
      INSERT INTO lots (lot_id, farmer_id, fpo_id, crop_type, variety, estimated_quantity, harvest_date, collection_centre, recorded_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'collected')
    `);
    const info = stmt.run(lot_id, farmer_id, fpo_id || 1, crop_type, variety || null, estimated_quantity || 0, harvest_date || null, collection_centre || 'Main Centre', recorded_by || req.user.id);
    
    const lot = { id: info.lastInsertRowid, lot_id, crop_type, variety, estimated_quantity, harvest_date, collection_centre };
    res.status(201).json({ lot, message: 'Lot created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    let query = `
      SELECT l.*, u.name as farmer_name, u.phone as farmer_phone,
             g.grade_a_kg, g.grade_b_kg, g.grade_c_kg, g.rejected_kg
      FROM lots l
      LEFT JOIN users u ON l.farmer_id = u.id
      LEFT JOIN grading_records g ON l.id = g.lot_id
      WHERE 1=1
    `;
    const params = [];
    if (req.query.fpo_id) { query += ` AND l.fpo_id = ?`; params.push(req.query.fpo_id); }
    if (req.query.status) { query += ` AND l.status = ?`; params.push(req.query.status); }
    if (req.query.farmer_id) { query += ` AND l.farmer_id = ?`; params.push(req.query.farmer_id); }
    query += ` ORDER BY l.created_at DESC`;
    
    const lots = db.prepare(query).all(...params);
    res.json({ lots, count: lots.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const lot = db.prepare(`
      SELECT l.*, u.name as farmer_name 
      FROM lots l
      LEFT JOIN users u ON l.farmer_id = u.id
      WHERE l.id = ?
    `).get(req.params.id);
    if (!lot) return res.status(404).json({ error: 'Lot not found' });
    const weighing = db.prepare(`SELECT * FROM weighing_records WHERE lot_id = ?`).all(req.params.id);
    const grading = db.prepare(`SELECT * FROM grading_records WHERE lot_id = ?`).all(req.params.id);
    res.json({ lot: { ...lot, weighing, grading }, ...lot, weighing, grading });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/weigh', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const { weight_kg, weighed_by } = req.body;
    db.prepare(`INSERT INTO weighing_records (lot_id, weight_kg, weighed_by) VALUES (?, ?, ?)`).run(req.params.id, weight_kg, weighed_by || req.user.id);
    db.prepare(`UPDATE lots SET weight_kg = ?, status = 'weighed' WHERE id = ?`).run(weight_kg, req.params.id);
    res.status(201).json({ success: true, message: 'Weight recorded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/grade', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const { grade_a_kg, grade_b_kg, grade_c_kg, rejected_kg, ai_suggested_grade, ai_confidence, graded_by } = req.body;
    
    // Determine dominant grade
    const a = parseFloat(grade_a_kg) || 0;
    const b = parseFloat(grade_b_kg) || 0;
    const c = parseFloat(grade_c_kg) || 0;
    let final_grade = 'A';
    if (b > a && b > c) final_grade = 'B';
    if (c > a && c > b) final_grade = 'C';
    
    db.prepare(`
      INSERT INTO grading_records (lot_id, grade_a_kg, grade_b_kg, grade_c_kg, rejected_kg, ai_suggested_grade, ai_confidence, final_grade, graded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.params.id, a, b, c, parseFloat(rejected_kg) || 0, ai_suggested_grade || null, ai_confidence || null, final_grade, graded_by || req.user.id);
    
    db.prepare(`UPDATE lots SET status = 'graded', final_grade = ? WHERE id = ?`).run(final_grade, req.params.id);
    res.status(201).json({ success: true, final_grade, message: 'Grading completed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
