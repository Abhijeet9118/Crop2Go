const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

router.get('/', (req, res) => {
  try {
    const db = getDb();
    const buyers = db.prepare(`
      SELECT b.*, u.name, u.phone, u.village, u.district, u.state
      FROM buyers b
      JOIN users u ON b.user_id = u.id
    `).all();
    res.json({ buyers, count: buyers.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const buyer = db.prepare(`
      SELECT b.*, u.name, u.phone, u.village, u.district, u.state
      FROM buyers b
      JOIN users u ON b.user_id = u.id
      WHERE b.id = ? OR b.user_id = ?
    `).get(req.params.id, req.params.id);

    if (!buyer) return res.status(404).json({ error: 'Buyer not found' });
    const orders = db.prepare(`SELECT * FROM orders WHERE buyer_id = ? ORDER BY ordered_at DESC`).all(buyer.id);
    res.json({ buyer: { ...buyer, orders }, ...buyer, orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const { business_name, business_type, reliability_score, location } = req.body;
    db.prepare(`UPDATE buyers SET business_name = ?, business_type = ?, reliability_score = ?, location = ? WHERE id = ?`)
      .run(business_name, business_type, reliability_score, location, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
