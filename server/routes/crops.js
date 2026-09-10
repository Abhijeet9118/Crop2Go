const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const {
  getCropModel,
  calculateCropProgress,
  getCurrentStage,
  generateInitialHarvestPrediction,
  evaluateDynamicPrediction,
  analyzeCropPhoto
} = require('../services/cropKnowledge');

// Ensure required tables exist in database on route load
function ensureTables(db) {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS fields (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        farmer_id INTEGER NOT NULL,
        field_name TEXT NOT NULL,
        total_area_acres REAL NOT NULL,
        cultivated_area_acres REAL NOT NULL,
        location_state TEXT,
        location_district TEXT,
        location_village TEXT,
        gps_lat REAL,
        gps_lng REAL,
        soil_type TEXT,
        irrigation_type TEXT,
        water_availability TEXT,
        previous_crop TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS crop_cycles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        crop_id TEXT UNIQUE NOT NULL,
        farmer_id INTEGER NOT NULL,
        field_id INTEGER,
        crop_name TEXT NOT NULL,
        variety TEXT,
        sowing_date DATE NOT NULL,
        area_acres REAL NOT NULL,
        seed_quantity REAL,
        expected_yield REAL,
        yield_unit TEXT DEFAULT 'quintal',
        farming_method TEXT DEFAULT 'Conventional',
        seed_source TEXT,
        irrigation_method TEXT,
        soil_type TEXT,
        fertilizer_info TEXT,
        previous_crop TEXT,
        notes TEXT,
        current_stage TEXT,
        current_day INTEGER DEFAULT 1,
        total_duration_days INTEGER DEFAULT 120,
        estimated_harvest_start DATE,
        estimated_harvest_end DATE,
        most_likely_harvest_date DATE,
        prediction_confidence REAL DEFAULT 0.85,
        prediction_reason TEXT,
        progress_pct INTEGER DEFAULT 0,
        health_status TEXT DEFAULT 'Good',
        status TEXT DEFAULT 'active',
        actual_harvest_date DATE,
        actual_yield REAL,
        harvest_quality TEXT,
        harvest_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS daily_crop_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        crop_cycle_id INTEGER NOT NULL,
        day_number INTEGER NOT NULL,
        log_date DATE NOT NULL,
        stage TEXT,
        tasks_json TEXT,
        health_status TEXT DEFAULT 'Good',
        irrigation_status TEXT DEFAULT 'Not Required',
        fertilizer_activity TEXT,
        pest_observation TEXT DEFAULT 'None',
        pest_details TEXT,
        disease_observation TEXT DEFAULT 'None',
        disease_details TEXT,
        notes TEXT,
        photo_url TEXT,
        is_completed INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS crop_ai_observations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        crop_cycle_id INTEGER NOT NULL,
        image_url TEXT,
        observation TEXT,
        possible_issue TEXT,
        severity TEXT,
        confidence REAL,
        recommendation TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS prediction_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        crop_cycle_id INTEGER NOT NULL,
        previous_window TEXT,
        new_window TEXT,
        most_likely_date DATE,
        reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS harvest_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        crop_cycle_id INTEGER NOT NULL,
        actual_harvest_date DATE NOT NULL,
        actual_yield REAL NOT NULL,
        yield_unit TEXT DEFAULT 'quintal',
        quality_grade TEXT,
        duration_days INTEGER,
        yield_difference REAL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (e) {
    // Tables already exist
  }
}

// GET /api/crops — List farmer's crops
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    ensureTables(db);
    const farmerId = req.user.id;

    const crops = db.prepare(`
      SELECT c.*, f.field_name, f.location_village, f.location_district, f.location_state
      FROM crop_cycles c
      LEFT JOIN fields f ON c.field_id = f.id
      WHERE c.farmer_id = ?
      ORDER BY c.created_at DESC
    `).all(farmerId);

    // Compute live progress for active crops
    const enriched = crops.map(c => {
      const model = getCropModel(c.crop_name);
      if (c.status === 'active') {
        const { currentDay, progressPct } = calculateCropProgress(c.sowing_date, c.total_duration_days || model.total_days);
        const stage = getCurrentStage(model, currentDay);
        return {
          ...c,
          current_day: currentDay,
          progress_pct: progressPct,
          current_stage: stage ? stage.name : c.current_stage
        };
      }
      return c;
    });

    res.json({ crops: enriched, count: enriched.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/crops/:id — Complete Crop Dashboard rollup
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    ensureTables(db);
    const farmerId = req.user.id;

    const crop = db.prepare(`
      SELECT c.*, f.field_name, f.total_area_acres, f.location_village, f.location_district, f.location_state, f.soil_type as field_soil, f.irrigation_type as field_irrigation
      FROM crop_cycles c
      LEFT JOIN fields f ON c.field_id = f.id
      WHERE c.id = ? AND c.farmer_id = ?
    `).get(req.params.id, farmerId);

    if (!crop) return res.status(404).json({ error: 'Crop cycle not found or unauthorized' });

    const model = getCropModel(crop.crop_name);
    const { currentDay, progressPct } = calculateCropProgress(crop.sowing_date, crop.total_duration_days || model.total_days);
    const currentStage = getCurrentStage(model, currentDay);

    // Visual Timeline stages with status indicator
    const timeline = model.stages.map(s => {
      let status = 'upcoming'; // upcoming, current, completed
      if (currentDay > s.end_day) status = 'completed';
      else if (currentDay >= s.start_day && currentDay <= s.end_day) status = 'current';
      return {
        name: s.name,
        start_day: s.start_day,
        end_day: s.end_day,
        status,
        tasks: s.tasks,
        irrigation: s.irrigation,
        harvest_indicators: s.harvest_indicators
      };
    });

    // Today's log / default tasks
    const todayStr = new Date().toISOString().split('T')[0];
    let todayLog = db.prepare(`SELECT * FROM daily_crop_logs WHERE crop_cycle_id = ? AND (log_date = ? OR day_number = ?)`).get(crop.id, todayStr, currentDay);

    if (!todayLog) {
      todayLog = {
        day_number: currentDay,
        log_date: todayStr,
        stage: currentStage ? currentStage.name : 'Active Growth',
        tasks: currentStage ? currentStage.tasks.map(t => ({ task: t, completed: false })) : [],
        health_status: crop.health_status || 'Good',
        irrigation_status: 'Not Required',
        pest_observation: 'None',
        disease_observation: 'None',
        notes: '',
        is_completed: 0
      };
    } else if (typeof todayLog.tasks_json === 'string') {
      try {
        todayLog.tasks = JSON.parse(todayLog.tasks_json);
      } catch (e) {
        todayLog.tasks = currentStage ? currentStage.tasks.map(t => ({ task: t, completed: false })) : [];
      }
    }

    // Prediction history
    const predHistory = db.prepare(`SELECT * FROM prediction_history WHERE crop_cycle_id = ? ORDER BY created_at DESC`).all(crop.id);

    // AI Observations
    const aiObservations = db.prepare(`SELECT * FROM crop_ai_observations WHERE crop_cycle_id = ? ORDER BY created_at DESC`).all(crop.id);

    // Daily Logs History (last 14 days)
    const logsHistory = db.prepare(`SELECT * FROM daily_crop_logs WHERE crop_cycle_id = ? ORDER BY day_number DESC LIMIT 14`).all(crop.id);

    // Harvest record if completed
    let harvestRecord = null;
    if (crop.status === 'harvested') {
      harvestRecord = db.prepare(`SELECT * FROM harvest_records WHERE crop_cycle_id = ?`).get(crop.id);
    }

    // Field-specific weather advisory
    const weatherAdvisory = {
      temp: 29,
      condition: "Partly Cloudy",
      rain_forecast: "Light rain expected in 24 hours (60% probability)",
      humidity: 68,
      advisory: "Rain forecast tomorrow. Delay scheduled surface irrigation to prevent waterlogging."
    };

    res.json({
      crop: {
        ...crop,
        current_day: currentDay,
        progress_pct: progressPct,
        current_stage: currentStage ? currentStage.name : crop.current_stage,
        stages_count: model.stages.length
      },
      timeline,
      today: todayLog,
      prediction_history: predHistory,
      ai_observations: aiObservations,
      logs_history: logsHistory,
      harvest_record: harvestRecord,
      weather: weatherAdvisory
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/crops — Multi-step Add Crop wizard submission
router.post('/', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    ensureTables(db);
    const farmerId = req.user.id;

    const {
      // Step 1: Land / Field
      field_name,
      total_area_acres,
      cultivated_area_acres,
      location_state,
      location_district,
      location_village,
      gps_lat,
      gps_lng,
      soil_type,
      irrigation_type,
      water_availability,
      previous_crop_field,

      // Step 2: Crop Details
      crop_name,
      custom_crop_name,
      variety,
      sowing_date,
      seed_quantity,
      expected_yield,
      yield_unit,
      farming_method,
      seed_source,

      // Step 3: Farming conditions
      irrigation_method,
      fertilizer_info,
      notes
    } = req.body;

    const finalCropName = crop_name === 'Other' ? (custom_crop_name || 'Custom Crop') : (crop_name || 'Wheat');

    // 1. Create or link field
    const fieldArea = parseFloat(cultivated_area_acres || total_area_acres) || 2.0;
    const fieldStmt = db.prepare(`
      INSERT INTO fields (farmer_id, field_name, total_area_acres, cultivated_area_acres, location_state, location_district, location_village, gps_lat, gps_lng, soil_type, irrigation_type, water_availability, previous_crop)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const fieldInfo = fieldStmt.run(
      farmerId,
      field_name || `Field #${Math.floor(Math.random() * 900 + 100)}`,
      parseFloat(total_area_acres) || fieldArea,
      fieldArea,
      location_state || 'Maharashtra',
      location_district || 'Pune',
      location_village || 'Baramati',
      gps_lat || 18.5204,
      gps_lng || 73.8567,
      soil_type || 'Loamy',
      irrigation_type || 'Drip',
      water_availability || 'Adequate',
      previous_crop_field || null
    );
    const fieldId = fieldInfo.lastInsertRowid;

    // 2. Generate unique Crop Cycle ID
    const countRow = db.prepare(`SELECT COUNT(*) as c FROM crop_cycles`).get();
    const seq = (countRow ? countRow.c : 0) + 1;
    const year = new Date().getFullYear();
    const cropIdCode = `CRP-${year}-${String(seq).padStart(3, '0')}`;

    // 3. Compute initial AI Harvest Prediction
    const pred = generateInitialHarvestPrediction(
      finalCropName,
      variety,
      sowing_date || new Date().toISOString().split('T')[0],
      soil_type,
      irrigation_method || irrigation_type
    );

    const model = getCropModel(finalCropName);
    const sowDate = sowing_date || new Date().toISOString().split('T')[0];
    const { currentDay, progressPct } = calculateCropProgress(sowDate, pred.total_duration_days);
    const stage = getCurrentStage(model, currentDay);

    // 4. Insert Crop Cycle
    const cycleStmt = db.prepare(`
      INSERT INTO crop_cycles (
        crop_id, farmer_id, field_id, crop_name, variety, sowing_date, area_acres,
        seed_quantity, expected_yield, yield_unit, farming_method, seed_source,
        irrigation_method, soil_type, fertilizer_info, previous_crop, notes,
        current_stage, current_day, total_duration_days, estimated_harvest_start,
        estimated_harvest_end, most_likely_harvest_date, prediction_confidence,
        prediction_reason, progress_pct, health_status, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Good', 'active')
    `);

    const cycleInfo = cycleStmt.run(
      cropIdCode,
      farmerId,
      fieldId,
      finalCropName,
      variety || 'Standard Hybrid',
      sowDate,
      fieldArea,
      parseFloat(seed_quantity) || null,
      parseFloat(expected_yield) || 35.0,
      yield_unit || 'quintal',
      farming_method || 'Conventional',
      seed_source || 'Certified Seed Agency',
      irrigation_method || irrigation_type || 'Drip',
      soil_type || 'Loamy',
      fertilizer_info || 'NPK basal application',
      previous_crop_field || null,
      notes || null,
      stage ? stage.name : 'Sowing',
      currentDay,
      pred.total_duration_days,
      pred.estimated_harvest_start,
      pred.estimated_harvest_end,
      pred.most_likely_harvest_date,
      pred.prediction_confidence,
      pred.prediction_reason,
      progressPct
    );

    const cycleId = cycleInfo.lastInsertRowid;

    // 5. Create initial daily log for current day
    const tasksArray = stage ? stage.tasks.map(t => ({ task: t, completed: false })) : [];
    db.prepare(`
      INSERT INTO daily_crop_logs (crop_cycle_id, day_number, log_date, stage, tasks_json, health_status, irrigation_status, pest_observation, disease_observation)
      VALUES (?, ?, ?, ?, ?, 'Good', 'Not Required', 'None', 'None')
    `).run(cycleId, currentDay, sowDate, stage ? stage.name : 'Sowing', JSON.stringify(tasksArray));

    // 6. Record in prediction history
    db.prepare(`
      INSERT INTO prediction_history (crop_cycle_id, previous_window, new_window, most_likely_date, reason)
      VALUES (?, 'Initial', ?, ?, ?)
    `).run(cycleId, pred.harvest_window_display, pred.most_likely_harvest_date, 'Initial AI estimate based on variety, sowing date, soil, and regional weather.');

    // Save DB to disk
    db.save();

    res.status(201).json({
      success: true,
      crop_id: cropIdCode,
      id: cycleId,
      prediction: pred,
      message: `${finalCropName} registered successfully!`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/crops/:id/daily-log — Record daily farmer update
router.post('/:id/daily-log', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    ensureTables(db);
    const farmerId = req.user.id;
    const cropCycleId = req.params.id;

    const crop = db.prepare(`SELECT * FROM crop_cycles WHERE id = ? AND farmer_id = ?`).get(cropCycleId, farmerId);
    if (!crop) return res.status(404).json({ error: 'Crop not found' });

    const {
      day_number,
      tasks,
      health_status,
      irrigation_status,
      fertilizer_activity,
      pest_observation,
      pest_details,
      disease_observation,
      disease_details,
      notes
    } = req.body;

    const todayStr = new Date().toISOString().split('T')[0];
    const tasksJson = JSON.stringify(tasks || []);

    // Check if log exists for today
    const existing = db.prepare(`SELECT id FROM daily_crop_logs WHERE crop_cycle_id = ? AND day_number = ?`).get(cropCycleId, day_number || crop.current_day);

    if (existing) {
      db.prepare(`
        UPDATE daily_crop_logs
        SET tasks_json = ?, health_status = ?, irrigation_status = ?, fertilizer_activity = ?,
            pest_observation = ?, pest_details = ?, disease_observation = ?, disease_details = ?, notes = ?, is_completed = 1
        WHERE id = ?
      `).run(tasksJson, health_status || 'Good', irrigation_status || 'Done', fertilizer_activity || null,
             pest_observation || 'None', pest_details || null, disease_observation || 'None', disease_details || null, notes || null, existing.id);
    } else {
      db.prepare(`
        INSERT INTO daily_crop_logs (crop_cycle_id, day_number, log_date, stage, tasks_json, health_status, irrigation_status, fertilizer_activity, pest_observation, pest_details, disease_observation, disease_details, notes, is_completed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).run(cropCycleId, day_number || crop.current_day, todayStr, crop.current_stage, tasksJson, health_status || 'Good', irrigation_status || 'Done', fertilizer_activity || null, pest_observation || 'None', pest_details || null, disease_observation || 'None', disease_details || null, notes || null);
    }

    // Update crop cycle health status
    if (health_status) {
      db.prepare(`UPDATE crop_cycles SET health_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(health_status, cropCycleId);
    }

    // Evaluate dynamic harvest prediction adjustment
    const recentLogs = db.prepare(`SELECT health_status, pest_observation, disease_observation FROM daily_crop_logs WHERE crop_cycle_id = ? ORDER BY day_number DESC LIMIT 5`).all(cropCycleId);
    const dynamicCheck = evaluateDynamicPrediction(crop, recentLogs);

    if (dynamicCheck.updated) {
      const prevWin = `${crop.estimated_harvest_start} to ${crop.estimated_harvest_end}`;
      db.prepare(`
        UPDATE crop_cycles
        SET estimated_harvest_start = ?, estimated_harvest_end = ?, most_likely_harvest_date = ?, prediction_reason = ?
        WHERE id = ?
      `).run(dynamicCheck.new_start, dynamicCheck.new_end, dynamicCheck.new_most_likely, dynamicCheck.reason, cropCycleId);

      db.prepare(`
        INSERT INTO prediction_history (crop_cycle_id, previous_window, new_window, most_likely_date, reason)
        VALUES (?, ?, ?, ?, ?)
      `).run(cropCycleId, prevWin, dynamicCheck.new_window_display, dynamicCheck.new_most_likely, dynamicCheck.reason);
    }

    db.save();
    res.json({ success: true, message: 'Daily log recorded', prediction_updated: dynamicCheck.updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/crops/:id/ai-photo — Analyze crop image with responsible AI screening
router.post('/:id/ai-photo', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    ensureTables(db);
    const farmerId = req.user.id;
    const cropCycleId = req.params.id;

    const crop = db.prepare(`SELECT * FROM crop_cycles WHERE id = ? AND farmer_id = ?`).get(cropCycleId, farmerId);
    if (!crop) return res.status(404).json({ error: 'Crop not found' });

    const analysis = analyzeCropPhoto(crop.crop_name);

    db.prepare(`
      INSERT INTO crop_ai_observations (crop_cycle_id, image_url, observation, possible_issue, severity, confidence, recommendation)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(cropCycleId, req.body.image_url || 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=400', analysis.observation, analysis.possible_issue, analysis.severity, analysis.confidence, analysis.recommendation);

    db.save();
    res.json({ success: true, observation: analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/crops/:id/harvest — Mark crop as harvested
router.post('/:id/harvest', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    ensureTables(db);
    const farmerId = req.user.id;
    const cropCycleId = req.params.id;

    const crop = db.prepare(`SELECT * FROM crop_cycles WHERE id = ? AND farmer_id = ?`).get(cropCycleId, farmerId);
    if (!crop) return res.status(404).json({ error: 'Crop not found' });

    const { actual_harvest_date, actual_yield, yield_unit, quality_grade, notes } = req.body;
    const actDate = actual_harvest_date || new Date().toISOString().split('T')[0];
    const actYield = parseFloat(actual_yield) || 0;

    const sow = new Date(crop.sowing_date);
    const hDate = new Date(actDate);
    const durationDays = Math.max(1, Math.floor((hDate - sow) / (1000 * 60 * 60 * 24)));
    const yieldDiff = actYield - (crop.expected_yield || 0);

    // Update cycle
    db.prepare(`
      UPDATE crop_cycles
      SET status = 'harvested', progress_pct = 100, actual_harvest_date = ?, actual_yield = ?, harvest_quality = ?, harvest_notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(actDate, actYield, quality_grade || 'Grade A', notes || null, cropCycleId);

    // Create harvest report entry
    db.prepare(`
      INSERT INTO harvest_records (crop_cycle_id, actual_harvest_date, actual_yield, yield_unit, quality_grade, duration_days, yield_difference, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(cropCycleId, actDate, actYield, yield_unit || crop.yield_unit || 'quintal', quality_grade || 'Grade A', durationDays, yieldDiff, notes || null);

    db.save();
    res.json({ success: true, message: 'Crop successfully marked as harvested!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/crops/:id/report — Final Crop Report
router.get('/:id/report', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    ensureTables(db);
    const farmerId = req.user.id;
    const cropCycleId = req.params.id;

    const crop = db.prepare(`
      SELECT c.*, f.field_name, f.location_village, f.location_district, f.location_state
      FROM crop_cycles c
      LEFT JOIN fields f ON c.field_id = f.id
      WHERE c.id = ? AND c.farmer_id = ?
    `).get(cropCycleId, farmerId);

    if (!crop) return res.status(404).json({ error: 'Crop not found' });

    const harvest = db.prepare(`SELECT * FROM harvest_records WHERE crop_cycle_id = ?`).get(cropCycleId);
    const predHistory = db.prepare(`SELECT * FROM prediction_history WHERE crop_cycle_id = ? ORDER BY created_at ASC`).all(cropCycleId);
    const observations = db.prepare(`SELECT * FROM crop_ai_observations WHERE crop_cycle_id = ?`).all(cropCycleId);

    res.json({
      crop,
      harvest: harvest || {
        actual_harvest_date: crop.actual_harvest_date || new Date().toISOString().split('T')[0],
        actual_yield: crop.actual_yield || crop.expected_yield,
        yield_unit: crop.yield_unit,
        quality_grade: crop.harvest_quality || 'Grade A',
        duration_days: crop.total_duration_days
      },
      prediction_history: predHistory,
      observations
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
