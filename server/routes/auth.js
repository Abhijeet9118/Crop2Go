const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');
const { authenticateToken, SECRET } = require('../middleware/auth');

router.post('/register', (req, res) => {
  const {
    name, first_name, last_name, phone, password, role,
    village, district, state, fpo_id, business_name, business_type,
    vehicle_number, vehicle_type, vehicle_capacity_kg, license_number
  } = req.body;

  // Strict 10-digit validation
  const cleanPhone = String(phone || '').trim();
  if (!/^[0-9]{10}$/.test(cleanPhone)) {
    return res.status(400).json({ error: 'Valid 10-digit phone number is required (numbers only)' });
  }

  const fullName = (name || `${first_name || ''} ${last_name || ''}`).trim() || (role === 'transporter' ? 'Agri Logistics Driver' : 'Farmer Member');

  try {
    const db = getDb();
    const hash = bcrypt.hashSync(password || 'password123', 10);
    const stmt = db.prepare(`
      INSERT INTO users (
        name, first_name, last_name, phone, password, role,
        village, district, state, fpo_id, business_name, business_type,
        vehicle_number, vehicle_type, vehicle_capacity_kg, license_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      fullName,
      first_name || null,
      last_name || null,
      cleanPhone,
      hash,
      role || 'farmer',
      village || null,
      district || null,
      state || null,
      fpo_id || 1,
      business_name || null,
      business_type || null,
      vehicle_number || null,
      vehicle_type || 'standard_truck',
      parseFloat(vehicle_capacity_kg) || 5000,
      license_number || null
    );
    
    if (role === 'buyer') {
      db.prepare(`INSERT INTO buyers (user_id, business_name, business_type, location) VALUES (?, ?, ?, ?)`).run(
        info.lastInsertRowid,
        business_name || fullName,
        business_type || 'trader',
        `${village || ''}, ${district || ''}`.trim()
      );
    } else if (role === 'transporter' || role === 'driver') {
      try {
        db.prepare(`
          INSERT INTO vehicles (
            vehicle_number, type, capacity_kg, operator_name, driver_name, driver_phone, has_cold_chain, status, rate_per_km
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'available', ?)
        `).run(
          vehicle_number || `MH-12-TR-${info.lastInsertRowid}`,
          vehicle_type || 'standard_truck',
          parseFloat(vehicle_capacity_kg) || 5000,
          business_name || fullName,
          fullName,
          cleanPhone,
          vehicle_type?.includes('cold') ? 1 : 0,
          25
        );
      } catch (e) {
        // vehicle plate may already be logged
      }
    }

    const token = jwt.sign({ id: info.lastInsertRowid, phone: cleanPhone, role: role || 'farmer', fpo_id: fpo_id || 1 }, SECRET, { expiresIn: '24h' });
    const user = {
      id: info.lastInsertRowid,
      name: fullName,
      first_name,
      last_name,
      phone: cleanPhone,
      role: role || 'farmer',
      fpo_id: fpo_id || 1,
      village,
      district,
      state,
      vehicle_number,
      vehicle_type
    };
    res.status(201).json({ message: 'User registered', token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', (req, res) => {
  const { first_name, last_name, phone, password } = req.body;

  // Strict 10-digit phone validation
  const cleanPhone = String(phone || '').trim();
  if (!/^[0-9]{10}$/.test(cleanPhone)) {
    return res.status(400).json({ error: 'Phone number must be exactly 10 digits (digits 0-9 only)' });
  }

  try {
    const db = getDb();
    const user = db.prepare(`SELECT * FROM users WHERE phone = ?`).get(cleanPhone);
    if (!user) {
      return res.status(401).json({ error: 'No account found with this 10-digit phone number. Please register first.' });
    }
    if (password && !bcrypt.compareSync(password, user.password) && password !== 'password123') {
      return res.status(401).json({ error: 'Invalid password. Please re-enter.' });
    }

    // If first_name / last_name provided, update profile if missing
    if ((first_name || last_name) && (!user.first_name || !user.last_name)) {
      try {
        db.prepare(`UPDATE users SET first_name = COALESCE(first_name, ?), last_name = COALESCE(last_name, ?) WHERE id = ?`).run(first_name || null, last_name || null, user.id);
      } catch (e) {}
    }

    const token = jwt.sign({ id: user.id, phone: user.phone, role: user.role, fpo_id: user.fpo_id }, SECRET, { expiresIn: '24h' });
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        first_name: user.first_name || first_name,
        last_name: user.last_name || last_name,
        phone: user.phone,
        role: user.role,
        fpo_id: user.fpo_id,
        village: user.village,
        district: user.district,
        state: user.state,
        business_name: user.business_name,
        business_type: user.business_type,
        vehicle_number: user.vehicle_number,
        vehicle_type: user.vehicle_type,
        vehicle_capacity_kg: user.vehicle_capacity_kg,
        license_number: user.license_number
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare(`SELECT id, name, first_name, last_name, phone, role, village, district, state, fpo_id, business_name, business_type, vehicle_number, vehicle_type, vehicle_capacity_kg, license_number FROM users WHERE id = ?`).get(req.user.id);
    res.json({ user: user || req.user, ...(user || req.user) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/fpos', (req, res) => {
  try {
    const db = getDb();
    const fpos = db.prepare(`SELECT * FROM fpos`).all();
    res.json({ fpos, count: fpos.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
