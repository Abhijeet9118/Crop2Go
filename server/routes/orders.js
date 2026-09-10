const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const { buyer_id, master_lot_id, grade, quantity_kg, price_per_kg, crop_type } = req.body;
    const fpo_id = req.body.fpo_id || req.user.fpo_id || 1;

    let crop = crop_type;
    if (!crop && master_lot_id) {
      const ml = db.prepare(`SELECT crop_type FROM master_lots WHERE id = ?`).get(master_lot_id);
      if (ml) crop = ml.crop_type;
    }

    const date = new Date();
    const dateStr = `${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const countRow = db.prepare(`SELECT COUNT(*) as c FROM orders`).get();
    const seq = (countRow ? countRow.c : 0) + 1;
    const order_id = `ORD-${dateStr}-${String(seq).padStart(3, '0')}`;
    const qty = parseFloat(quantity_kg) || 0;
    const price = parseFloat(price_per_kg) || 0;
    const total_amount = qty * price;

    // Resolve buyer_id if passed as user_id
    let actualBuyerId = buyer_id;
    const bCheck = db.prepare(`SELECT id FROM buyers WHERE user_id = ?`).get(buyer_id);
    if (bCheck) actualBuyerId = bCheck.id;

    const stmt = db.prepare(`
      INSERT INTO orders (order_id, fpo_id, buyer_id, master_lot_id, crop_type, grade, quantity_kg, price_per_kg, total_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
    `);
    const info = stmt.run(order_id, fpo_id, actualBuyerId, master_lot_id || null, crop || 'Tomato', grade || 'A', qty, price, total_amount);

    res.status(201).json({ id: info.lastInsertRowid, order_id, message: 'Order created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', (req, res) => {
  try {
    const db = getDb();
    let query = `
      SELECT o.*, b.business_name, u.name as buyer_name, m.master_lot_id as master_lot_code
      FROM orders o
      LEFT JOIN buyers b ON o.buyer_id = b.id
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN master_lots m ON o.master_lot_id = m.id
      WHERE 1=1
    `;
    const params = [];

    if (req.query.fpo_id) { query += ` AND o.fpo_id = ?`; params.push(req.query.fpo_id); }
    if (req.query.buyer_id) {
      query += ` AND (o.buyer_id = ? OR b.user_id = ?)`;
      params.push(req.query.buyer_id, req.query.buyer_id);
    }
    if (req.query.status) { query += ` AND o.status = ?`; params.push(req.query.status); }
    query += ` ORDER BY o.ordered_at DESC`;

    const orders = db.prepare(query).all(...params);
    res.json({ orders, count: orders.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const order = db.prepare(`
      SELECT o.*, b.business_name, u.name as buyer_name
      FROM orders o
      LEFT JOIN buyers b ON o.buyer_id = b.id
      LEFT JOIN users u ON b.user_id = u.id
      WHERE o.id = ?
    `).get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order, ...order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/confirm', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    db.prepare(`UPDATE orders SET status = 'confirmed' WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/status', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const { status } = req.body;
    db.prepare(`UPDATE orders SET status = ? WHERE id = ?`).run(status, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
