const { initDb, getDb } = require('./database');
const bcrypt = require('bcryptjs');

async function seedTransporter() {
  const dbWrapper = await initDb();
  const db = getDb();

  const phone = '9999900040';
  const existing = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  const hash = bcrypt.hashSync('password123', 10);

  if (!existing) {
    const info = db.prepare(`
      INSERT INTO users (
        name, first_name, last_name, phone, password, role, fpo_id,
        village, district, state, vehicle_number, vehicle_type, vehicle_capacity_kg, license_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'Ramesh Patil (Transporter)',
      'Ramesh',
      'Patil',
      phone,
      hash,
      'transporter',
      1,
      'Baramati',
      'Pune',
      'Maharashtra',
      'MH 12 AB 9021',
      'standard_truck',
      5000,
      'MH-12-2018-0092182'
    );
    console.log('✅ Seeded demo transporter user ID:', info.lastInsertRowid);
  } else {
    db.prepare(`
      UPDATE users SET role = 'transporter', vehicle_number = 'MH 12 AB 9021', vehicle_type = 'standard_truck', vehicle_capacity_kg = 5000
      WHERE phone = ?
    `).run(phone);
    console.log('✅ Updated existing user 9999900040 to transporter');
  }

  // Ensure vehicle exists in vehicles table
  try {
    const v = db.prepare('SELECT * FROM vehicles WHERE vehicle_number = ?').get('MH 12 AB 9021');
    if (!v) {
      db.prepare(`
        INSERT INTO vehicles (
          vehicle_number, type, capacity_kg, operator_name, driver_name, driver_phone, has_cold_chain, status, rate_per_km
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'available', ?)
      `).run('MH 12 AB 9021', 'standard_truck', 5000, 'Patil Agri Logistics', 'Ramesh Patil', phone, 0, 25);
      console.log('✅ Inserted vehicle MH 12 AB 9021');
    }
  } catch (e) {
    console.error('Vehicle insert notice:', e.message);
  }

  dbWrapper.save();
  console.log('Done!');
}

seedTransporter().catch(console.error);
