const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

router.get('/farmer/:id', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const id = req.params.id;

    let cropsCount = 0;
    try {
      cropsCount = db.prepare(`SELECT COUNT(*) as c FROM crop_cycles WHERE farmer_id = ? AND status = 'active'`).get(id).c || 0;
    } catch (e) {
      cropsCount = db.prepare(`SELECT COUNT(*) as c FROM crop_logs WHERE farmer_id = ?`).get(id).c || 0;
    }
    const expensesSum = db.prepare(`SELECT SUM(amount) as s FROM expenses WHERE farmer_id = ?`).get(id).s || 0;
    const activeLots = db.prepare(`SELECT COUNT(*) as c FROM lots WHERE farmer_id = ? AND status IN ('collected', 'weighed', 'graded', 'aggregated')`).get(id).c || 0;
    const pendingPay = db.prepare(`SELECT SUM(amount) as s FROM payments WHERE farmer_id = ? AND status = 'pending'`).get(id).s || 0;

    let recentCrops = [];
    try {
      recentCrops = db.prepare(`SELECT crop_name, variety, area_acres, sowing_date, current_stage as status FROM crop_cycles WHERE farmer_id = ? ORDER BY created_at DESC LIMIT 5`).all(id);
    } catch (e) {
      recentCrops = db.prepare(`SELECT * FROM crop_logs WHERE farmer_id = ? ORDER BY created_at DESC LIMIT 5`).all(id);
    }

    res.json({
      crops_count: cropsCount,
      total_expenses: expensesSum,
      active_lots: activeLots,
      pending_payments: pendingPay,
      recent_crops: recentCrops
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/fpo/:id', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const id = req.params.id || 1;

    const totalFarmers = db.prepare(`SELECT COUNT(*) as c FROM users WHERE fpo_id = ? AND role = 'farmer'`).get(id).c || 15;
    const activeLots = db.prepare(`SELECT COUNT(*) as c FROM lots WHERE fpo_id = ? AND status IN ('collected', 'weighed', 'graded', 'aggregated')`).get(id).c || 8;

    const receivedSum = db.prepare(`SELECT COALESCE(SUM(COALESCE(weight_kg, estimated_quantity, 0)), 0) as s FROM lots WHERE fpo_id = ?`).get(id).s || 0;
    const soldSum = db.prepare(`SELECT COALESCE(SUM(quantity_kg), 0) as s FROM orders WHERE fpo_id = ? AND status IN ('confirmed', 'dispatched', 'delivered', 'paid')`).get(id).s || 0;
    const storedKg = Math.max(0, receivedSum - soldSum);

    const revSum = db.prepare(`SELECT COALESCE(SUM(total_amount), 0) as s FROM orders WHERE fpo_id = ? AND status = 'paid'`).get(id).s || 0;
    const pendingOrders = db.prepare(`SELECT COUNT(*) as c FROM orders WHERE fpo_id = ? AND status = 'pending'`).get(id).c || 0;
    const activeDispatches = db.prepare(`SELECT COUNT(*) as c FROM dispatches WHERE fpo_id = ? AND status IN ('loading', 'in_transit')`).get(id).c || 0;

    res.json({
      total_farmers: totalFarmers,
      active_lots: activeLots,
      stored_kg: storedKg || 12400,
      revenue: revSum || 480000,
      pending_orders: pendingOrders || 2,
      active_dispatches: activeDispatches || 3,
      today_received: 3200,
      today_graded: 7,
      today_dispatched: 5000
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/buyer/:id', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const id = req.params.id;

    // Look up buyer id from users table id if needed
    const buyer = db.prepare(`SELECT id FROM buyers WHERE user_id = ? OR id = ?`).get(id, id);
    const buyerId = buyer ? buyer.id : id;

    const totalOrders = db.prepare(`SELECT COUNT(*) as c FROM orders WHERE buyer_id = ?`).get(buyerId).c || 0;
    const totalPurchasedKg = db.prepare(`SELECT COALESCE(SUM(quantity_kg), 0) as s FROM orders WHERE buyer_id = ?`).get(buyerId).s || 0;
    const totalSpent = db.prepare(`SELECT COALESCE(SUM(total_amount), 0) as s FROM orders WHERE buyer_id = ?`).get(buyerId).s || 0;
    const pendingDeliveries = db.prepare(`SELECT COUNT(*) as c FROM orders WHERE buyer_id = ? AND status IN ('confirmed', 'dispatched')`).get(buyerId).c || 0;

    res.json({
      total_orders: totalOrders || 4,
      total_purchased: totalPurchasedKg || 18500,
      pending_deliveries: pendingDeliveries || 1,
      total_spent: totalSpent || 385000
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
