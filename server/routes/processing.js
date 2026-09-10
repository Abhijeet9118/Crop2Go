const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

// Ensure demo batches exist for FPO
function ensureBatches(db, fpoId = 1) {
  let batches = db.prepare(`SELECT * FROM processing_batches WHERE fpo_id = ? ORDER BY created_at DESC`).all(fpoId);
  if (batches.length === 0) {
    const demoBatches = [
      { id: 'POT-1024', crop: 'Potato', total: 2000, proc: 1200, rem: 800, cold: 600, unit: 400, pack: 200, stat: 'In Progress' },
      { id: 'TOM-0609', crop: 'Tomato', total: 1500, proc: 1100, rem: 400, cold: 300, unit: 650, pack: 150, stat: 'In Progress' },
      { id: 'ON-2026-05', crop: 'Onion', total: 1800, proc: 1800, rem: 0, cold: 900, unit: 600, pack: 300, stat: 'Completed' }
    ];

    for (const b of demoBatches) {
      db.prepare(`
        INSERT INTO processing_batches (
          batch_id, fpo_id, crop_type, total_quantity_kg, processed_kg, remaining_kg,
          cold_storage_kg, processing_unit_kg, packaging_kg, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(b.id, fpoId, b.crop, b.total, b.proc, b.rem, b.cold, b.unit, b.pack, b.stat);
    }

    batches = db.prepare(`SELECT * FROM processing_batches WHERE fpo_id = ? ORDER BY created_at DESC`).all(fpoId);
  }
  return batches;
}

// 1. Processing Summary (KPIs, utilization breakdown, batch list)
router.get('/summary', (req, res) => {
  try {
    const db = getDb();
    const fpoId = parseInt(req.query.fpo_id || 1);
    const batches = ensureBatches(db, fpoId);

    const totalProduce = batches.reduce((s, b) => s + (b.total_quantity_kg || 0), 0);
    const totalProcessed = batches.reduce((s, b) => s + (b.processed_kg || 0), 0);
    const totalRemaining = Math.max(0, totalProduce - totalProcessed);
    const coldStorage = batches.reduce((s, b) => s + (b.cold_storage_kg || 0), 0);
    const procUnit = batches.reduce((s, b) => s + (b.processing_unit_kg || 0), 0);
    const packaging = batches.reduce((s, b) => s + (b.packaging_kg || 0), 0);

    res.json({
      total_produce_kg: totalProduce,
      total_processed_kg: totalProcessed,
      total_remaining_kg: totalRemaining,
      cold_storage_kg: coldStorage,
      processing_unit_kg: procUnit,
      packaging_kg: packaging,
      batches
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Batches list
router.get('/batches', (req, res) => {
  try {
    const db = getDb();
    const fpoId = parseInt(req.query.fpo_id || 1);
    const batches = ensureBatches(db, fpoId);
    res.json({ count: batches.length, batches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Allocations history
router.get('/allocations', (req, res) => {
  try {
    const db = getDb();
    const allocations = db.prepare(`
      SELECT 
        a.id,
        a.batch_id as raw_batch_id,
        COALESCE(b.batch_id, CAST(a.batch_id AS TEXT)) as batch_id,
        COALESCE(a.allocation_type, 'processing_unit') as destination,
        a.quantity_kg,
        a.notes,
        COALESCE(u.name, a.allocated_by, 'FPO Officer') as allocated_by,
        COALESCE(a.allocated_at, a.created_at, CURRENT_TIMESTAMP) as created_at
      FROM processing_allocations a
      LEFT JOIN processing_batches b ON a.batch_id = b.id OR a.batch_id = b.batch_id
      LEFT JOIN users u ON a.allocated_by = u.id
      ORDER BY a.id DESC
      LIMIT 50
    `).all();

    res.json({ allocations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Perform Allocation with Strict Overflow Check
router.post('/allocate', (req, res) => {
  try {
    const db = getDb();
    const { batch_id, destination, allocation_type, quantity_kg, notes, allocated_by } = req.body;
    const dest = destination || allocation_type || 'processing_unit';
    const qty = parseFloat(quantity_kg);

    if (!batch_id || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Valid batch ID and positive quantity (KG) required' });
    }

    // Find batch by string batch_id or integer id
    let batch = db.prepare(`SELECT * FROM processing_batches WHERE batch_id = ?`).get(batch_id);
    if (!batch) {
      batch = db.prepare(`SELECT * FROM processing_batches WHERE id = ?`).get(batch_id);
    }

    if (!batch) {
      return res.status(404).json({ error: `Batch ${batch_id} not found` });
    }

    // STRICT OVERFLOW CHECK: allocation must not exceed remaining produce
    if (qty > batch.remaining_kg) {
      return res.status(400).json({
        error: `Cannot allocate more than remaining produce (${batch.remaining_kg.toLocaleString()} kg remaining)`
      });
    }

    // Record allocation
    db.prepare(`
      INSERT INTO processing_allocations (
        batch_id, allocation_type, quantity_kg, status, notes, allocated_by
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      batch.id,
      dest,
      qty,
      'Allocated',
      notes || null,
      allocated_by || 'FPO Officer'
    );

    // Update batch stats
    const newProcessed = batch.processed_kg + qty;
    const newRemaining = Math.max(0, batch.total_quantity_kg - newProcessed);
    const newStatus = newRemaining === 0 ? 'Completed' : 'In Progress';

    let coldStorageUpdate = batch.cold_storage_kg;
    let processingUnitUpdate = batch.processing_unit_kg;
    let packagingUpdate = batch.packaging_kg;

    if (dest === 'cold_storage' || dest === 'Cold Storage') coldStorageUpdate += qty;
    else if (dest === 'packaging' || dest === 'Packaging') packagingUpdate += qty;
    else processingUnitUpdate += qty;

    db.prepare(`
      UPDATE processing_batches
      SET
        processed_kg = ?,
        remaining_kg = ?,
        cold_storage_kg = ?,
        processing_unit_kg = ?,
        packaging_kg = ?,
        status = ?
      WHERE id = ?
    `).run(
      newProcessed,
      newRemaining,
      coldStorageUpdate,
      processingUnitUpdate,
      packagingUpdate,
      newStatus,
      batch.id
    );

    const updatedBatch = db.prepare(`SELECT * FROM processing_batches WHERE id = ?`).get(batch.id);

    res.status(201).json({
      message: `Successfully allocated ${qty} kg to ${dest}`,
      batch: updatedBatch
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
