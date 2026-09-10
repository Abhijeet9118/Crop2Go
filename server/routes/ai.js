const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

router.get('/recommendations/:fpoId', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const fpoId = req.params.fpoId;

    // Check existing stored alerts from DB first
    let alerts = [];
    try {
      alerts = db.prepare(`SELECT * FROM ai_alerts WHERE fpo_id = ? ORDER BY created_at DESC LIMIT 10`).all(fpoId);
    } catch (e) {
      alerts = [];
    }

    if (alerts.length === 0) {
      alerts = [
        {
          type: 'aging',
          severity: 'warning',
          title: 'Inventory Aging: 2,000 kg Tomato',
          message: 'Lot TOM-0609-23 has been stored for 3 days. Recommend dispatching to Mumbai Trader within 24h to avoid spoilage.'
        },
        {
          type: 'rejection',
          severity: 'warning',
          title: 'Unusual Rejection Spike in Centre B',
          message: 'Collection Centre B recorded 15% rejection vs 5% average. Field inspection advised for blight.'
        },
        {
          type: 'buyer_reliability',
          severity: 'info',
          title: 'High Reliability Buyer Available',
          message: 'Mumbai Trader has 95% on-time payment track record (avg 4 days). Prioritize fulfilling their 8,000 kg order.'
        },
        {
          type: 'processing',
          severity: 'info',
          title: '3,000 kg C-Grade Tomato Flagged for Processing',
          message: 'Meets criteria for tomato paste/sauce processing unit. Direct sale would recover ₹18/kg vs dump.'
        },
        {
          type: 'demand',
          severity: 'info',
          title: 'Seasonal Demand Spike: A-Grade Tomatoes',
          message: 'Historical mandi trends show festival price rise of ~18% in next 10 days. Consider holding A-grade stock.'
        },
        {
          type: 'wastage',
          severity: 'critical',
          title: 'Wastage Risk Alert: Temperature + Humidity',
          message: 'Local temperature forecast is 36°C with 80% humidity. Non-refrigerated batches should move today.'
        }
      ];
    }

    res.json({ recommendations: alerts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/grade', authenticateToken, (req, res) => {
  try {
    const { crop_type, weight } = req.body;
    const w = parseFloat(weight) || 500;
    const crop = (crop_type || 'Tomato').toLowerCase();

    let dist = { a: 0.56, b: 0.32, c: 0.09, rej: 0.03, dominant: 'A', confidence: 0.94 };

    if (crop.includes('onion')) {
      dist = { a: 0.60, b: 0.25, c: 0.10, rej: 0.05, dominant: 'A', confidence: 0.91 };
    } else if (crop.includes('potato')) {
      dist = { a: 0.50, b: 0.35, c: 0.10, rej: 0.05, dominant: 'A', confidence: 0.89 };
    }

    const grade_a_kg = parseFloat((w * dist.a).toFixed(1));
    const grade_b_kg = parseFloat((w * dist.b).toFixed(1));
    const grade_c_kg = parseFloat((w * dist.c).toFixed(1));
    const rejected_kg = parseFloat((w - grade_a_kg - grade_b_kg - grade_c_kg).toFixed(1));

    res.json({
      grade_a_kg,
      grade_b_kg,
      grade_c_kg,
      rejected_kg,
      dominant_grade: dist.dominant,
      confidence: dist.confidence,
      suggested: { grade_a_kg, grade_b_kg, grade_c_kg, rejected_kg }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Visual Produce Quality Analysis
// AI Visual Produce Quality Analysis
const { analyzeProduceQuality } = require('../services/aiGradingService');

router.post('/grade-image', async (req, res) => {
  try {
    const image = req.body.imageBase64 || req.body.image_url || req.body.image;
    const produce = req.body.produceType || req.body.produce_type || 'Potato';
    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const result = await analyzeProduceQuality(image, produce);
    res.json(result);
  } catch (err) {
    console.error('Image grading error:', err);
    res.status(500).json({ error: err.message || 'AI image grading failed' });
  }
});

// Save verified produce grading record
router.post('/grade-record', (req, res) => {
  try {
    const db = getDb();
    const {
      fpo_id,
      produce_type,
      lot_id,
      image_url,
      ai_grade,
      final_grade,
      confidence_score,
      ai_confidence,
      observations,
      ai_observations,
      graded_by,
      is_override,
      override_reason,
      notes
    } = req.body;

    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const countRow = db.prepare(`SELECT COUNT(*) as c FROM ai_grading_records`).get();
    const seq = (countRow ? countRow.c : 0) + 1;
    const grading_id = `GRD-${dateStr}-${String(seq).padStart(3, '0')}`;

    const obsText = typeof observations === 'string' ? observations : (Array.isArray(ai_observations) ? ai_observations.join('. ') : (ai_observations || 'Visual inspection complete'));
    const conf = parseFloat(confidence_score || ai_confidence || 0.92);
    const verStatus = is_override ? 'manual_override' : 'ai_confirmed';

    const stmt = db.prepare(`
      INSERT INTO ai_grading_records (
        grading_id, fpo_id, produce_type, lot_id, image_url,
        ai_grade, ai_confidence, ai_observations, final_grade,
        verification_status, verified_by, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const info = stmt.run(
      grading_id,
      fpo_id || (req.user && req.user.fpo_id) || 1,
      produce_type || 'Potato',
      lot_id || null,
      image_url ? image_url.slice(0, 1000) : null,
      ai_grade || 'A',
      conf,
      obsText,
      final_grade || ai_grade || 'A',
      verStatus,
      (req.user && req.user.id) || null,
      notes || override_reason || null
    );

    res.status(201).json({
      message: 'Grading record saved successfully',
      id: info.lastInsertRowid,
      record_id: grading_id,
      grading_id,
      final_grade,
      verification_status: verStatus
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Retrieve grading history
router.get('/grading-history', (req, res) => {
  try {
    const db = getDb();
    const records = db.prepare(`
      SELECT 
        g.id,
        g.grading_id,
        g.produce_type,
        g.lot_id,
        g.image_url,
        g.ai_grade,
        g.final_grade,
        g.ai_confidence as confidence_score,
        g.ai_observations as observations,
        g.verification_status,
        CASE WHEN g.verification_status = 'manual_override' THEN 1 ELSE 0 END as is_override,
        g.notes as override_reason,
        COALESCE(u.name, 'FPO Officer') as graded_by,
        COALESCE(g.created_at, CURRENT_TIMESTAMP) as timestamp
      FROM ai_grading_records g
      LEFT JOIN users u ON g.verified_by = u.id
      ORDER BY g.id DESC
      LIMIT 50
    `).all();

    res.json({ count: records.length, records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
