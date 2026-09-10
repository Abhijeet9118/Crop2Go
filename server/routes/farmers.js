const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const { fpo_id, search } = req.query;
    let query = `SELECT id, name, phone, village, district, state, fpo_id FROM users WHERE role = 'farmer'`;
    const params = [];
    if (fpo_id) {
      query += ` AND (fpo_id = ? OR fpo_id IS NULL)`;
      params.push(fpo_id);
    }
    if (search) {
      query += ` AND (name LIKE ? OR phone LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    const farmers = db.prepare(query).all(...params);
    res.json({ farmers, count: farmers.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const farmer = db.prepare(`SELECT id, name, phone, village, district, state, fpo_id FROM users WHERE id = ?`).get(req.params.id);
    if (!farmer) return res.status(404).json({ error: 'Farmer not found' });
    const cropLogs = db.prepare(`SELECT * FROM crop_logs WHERE farmer_id = ? ORDER BY created_at DESC`).all(req.params.id);
    const expenses = db.prepare(`SELECT * FROM expenses WHERE farmer_id = ? ORDER BY date DESC`).all(req.params.id);
    res.json({ ...farmer, cropLogs, expenses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/crops', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const crops = db.prepare(`SELECT * FROM crop_logs WHERE farmer_id = ? ORDER BY created_at DESC`).all(req.params.id);
    res.json({ crops });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/crops', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const { crop_name, variety, area_acres, sowing_date, expected_harvest, status, notes } = req.body;
    const stmt = db.prepare(`INSERT INTO crop_logs (farmer_id, crop_name, variety, area_acres, sowing_date, expected_harvest, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    const info = stmt.run(req.params.id, crop_name, variety || null, area_acres, sowing_date || null, expected_harvest || null, status || 'growing', notes || null);
    res.status(201).json({ id: info.lastInsertRowid, message: 'Crop logged' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/expenses', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const expenses = db.prepare(`SELECT * FROM expenses WHERE farmer_id = ? ORDER BY date DESC`).all(req.params.id);
    res.json({ expenses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/expenses', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const { category, amount, description, date } = req.body;
    const stmt = db.prepare(`INSERT INTO expenses (farmer_id, category, amount, description, date) VALUES (?, ?, ?, ?, ?)`);
    const info = stmt.run(req.params.id, category || 'Other', amount, description || null, date || new Date().toISOString().split('T')[0]);
    res.status(201).json({ id: info.lastInsertRowid, message: 'Expense recorded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/produce', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const lots = db.prepare(`
      SELECT l.*, g.final_grade, g.grade_a_kg, g.grade_b_kg, g.grade_c_kg, g.rejected_kg
      FROM lots l
      LEFT JOIN grading_records g ON l.id = g.lot_id
      WHERE l.farmer_id = ?
      ORDER BY l.created_at DESC
    `).all(req.params.id);
    res.json({ lots });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
