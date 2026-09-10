const { initDb, getDb } = require('./database');
const bcrypt = require('bcryptjs');

async function fix() {
  const dbWrapper = await initDb();
  const db = getDb();

  db.pragma('foreign_keys = OFF');

  try { db.exec('DROP TABLE IF EXISTS users_new'); } catch (e) {}

  db.exec(`
    CREATE TABLE users_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      fpo_id INTEGER,
      village TEXT,
      district TEXT,
      state TEXT,
      aadhaar TEXT,
      business_name TEXT,
      business_type TEXT,
      vehicle_number TEXT,
      vehicle_type TEXT,
      vehicle_capacity_kg REAL,
      license_number TEXT,
      first_name TEXT,
      last_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    INSERT INTO users_new (
      id, name, phone, password, role, fpo_id, village, district, state,
      aadhaar, business_name, business_type, first_name, last_name,
      vehicle_number, vehicle_type, vehicle_capacity_kg, license_number, created_at
    )
    SELECT 
      id, name, phone, password, role, fpo_id, village, district, state,
      aadhaar, business_name, business_type, first_name, last_name,
      vehicle_number, vehicle_type, vehicle_capacity_kg, license_number, created_at
    FROM users;
  `);

  db.exec('DROP TABLE users');
  db.exec('ALTER TABLE users_new RENAME TO users');

  db.pragma('foreign_keys = ON');

  const hash = bcrypt.hashSync('password123', 10);
  const info = db.prepare(`
    INSERT INTO users (
      name, first_name, last_name, phone, password, role, fpo_id,
      village, district, state, vehicle_number, vehicle_type, vehicle_capacity_kg, license_number
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Ramesh Patil (Transporter)',
    'Ramesh',
    'Patil',
    '9999900040',
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
  dbWrapper.save();
  console.log('Done!');
}

fix().catch(console.error);
