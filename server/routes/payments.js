const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

router.post('/buyer', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const { order_id, fpo_id } = req.body;
    const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(order_id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    db.prepare(`UPDATE orders SET status = 'paid' WHERE id = ?`).run(order_id);

    const date = new Date();
    const dateStr = `${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const countRow = db.prepare(`SELECT COUNT(*) as c FROM payments`).get();
    const seq = (countRow ? countRow.c : 0) + 1;
    const payment_id = `PAY-BUY-${dateStr}-${String(seq).padStart(3, '0')}`;

    db.prepare(`
      INSERT INTO payments (payment_id, order_id, fpo_id, amount, payment_type, status, paid_at)
      VALUES (?, ?, ?, ?, 'buyer_to_fpo', 'completed', CURRENT_TIMESTAMP)
    `).run(payment_id, order_id, fpo_id || order.fpo_id, order.total_amount);

    res.json({ success: true, payment_id, message: 'Buyer payment recorded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/distribute/:orderId', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    let lots = [];
    if (order.master_lot_id) {
      lots = db.prepare(`
        SELECT l.*, g.grade_a_kg, g.grade_b_kg, g.grade_c_kg,
               COALESCE(l.weight_kg, (COALESCE(g.grade_a_kg, 0) + COALESCE(g.grade_b_kg, 0) + COALESCE(g.grade_c_kg, 0)), 500) as eff_weight
        FROM lots l
        LEFT JOIN grading_records g ON l.id = g.lot_id
        WHERE l.master_lot_id = ?
      `).all(order.master_lot_id);
    }

    // Fallback to all graded lots of this FPO if no master lot linked
    if (lots.length === 0) {
      lots = db.prepare(`
        SELECT l.*, g.grade_a_kg, g.grade_b_kg, g.grade_c_kg,
               COALESCE(l.weight_kg, 500) as eff_weight
        FROM lots l
        LEFT JOIN grading_records g ON l.id = g.lot_id
        WHERE l.fpo_id = ? LIMIT 5
      `).all(order.fpo_id);
    }

    const totalWeight = lots.reduce((acc, l) => acc + (l.eff_weight || 500), 0) || 1;
    const distributions = [];

    lots.forEach((lot, i) => {
      const share = ((lot.eff_weight || 500) / totalWeight) * order.total_amount;
      const date = new Date();
      const dateStr = `${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
      const countRow = db.prepare(`SELECT COUNT(*) as c FROM payments`).get();
      const seq = (countRow ? countRow.c : 0) + i + 1;
      const payment_id = `PAY-FAR-${dateStr}-${String(seq).padStart(3, '0')}`;

      const breakdown = JSON.stringify({
        A: lot.grade_a_kg || 280,
        B: lot.grade_b_kg || 160,
        C: lot.grade_c_kg || 45
      });

      db.prepare(`
        INSERT INTO payments (payment_id, order_id, farmer_id, fpo_id, amount, payment_type, lot_id, grade_breakdown, status)
        VALUES (?, ?, ?, ?, ?, 'fpo_to_farmer', ?, ?, 'pending')
      `).run(payment_id, order.id, lot.farmer_id, order.fpo_id, Math.round(share), lot.id, breakdown);

      distributions.push({ payment_id, farmer_id: lot.farmer_id, amount: Math.round(share) });
    });

    res.json({ success: true, distributed_count: distributions.length, distributions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/farmer/:farmerId', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const payments = db.prepare(`
      SELECT p.*, l.crop_type, l.lot_id as lot_code, o.order_id as order_code
      FROM payments p
      LEFT JOIN lots l ON p.lot_id = l.id
      LEFT JOIN orders o ON p.order_id = o.id
      WHERE p.farmer_id = ?
      ORDER BY p.created_at DESC
    `).all(req.params.farmerId);
    res.json({ payments, count: payments.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/fpo/:fpoId', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const payments = db.prepare(`
      SELECT p.*, u.name as farmer_name, u.phone as farmer_phone
      FROM payments p
      LEFT JOIN users u ON p.farmer_id = u.id
      WHERE p.fpo_id = ?
      ORDER BY p.created_at DESC
    `).all(req.params.fpoId);
    res.json({ payments, count: payments.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/complete', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    db.prepare(`UPDATE payments SET status = 'completed', paid_at = CURRENT_TIMESTAMP WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
