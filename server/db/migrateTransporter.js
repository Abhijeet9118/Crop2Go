const { initDb, getDb } = require('./database');
const bcrypt = require('bcryptjs');

async function migrate() {
  const dbWrapper = await initDb();
  const db = getDb();

  console.log('🔄 Rebuilding users table to allow transporter & driver roles...');

  db.pragma('foreign_keys = OFF');

  try { db.exec('DROP TABLE IF EXISTS users_old'); } catch (e) {}

  db.exec('ALTER TABLE users RENAME TO users_old');

  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('farmer','fpo_admin','fpo_worker','buyer','transporter','driver')),
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (fpo_id) REFERENCES fpos(id)
    );
  `);

  db.exec(`
    INSERT INTO users (
      id, name, phone, password, role, fpo_id, village, district, state,
      aadhaar, business_name, business_type, first_name, last_name, created_at
    )
    SELECT 
      id, name, phone, password, role, fpo_id, village, district, state,
      aadhaar, business_name, business_type, first_name, last_name, created_at
    FROM users_old;
  `);

  db.exec('DROP TABLE users_old');
  db.pragma('foreign_keys = ON');

  const existingTransporter = db.prepare('SELECT * FROM users WHERE phone = ?').get('9999900030');
  if (!existingTransporter) {
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
      '9999900030',
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

    console.log('✅ Demo Transporter created with ID:', info.lastInsertRowid);

    try {
      db.prepare(`
        INSERT INTO vehicles (
          vehicle_number, type, capacity_kg, operator_name, driver_name, driver_phone, has_cold_chain, status, rate_per_km
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'available', ?)
      `).run(
        'MH 12 AB 9021',
        'standard_truck',
        5000,
        'Patil Agri Logistics',
        'Ramesh Patil',
        '9999900030',
        0,
        25
      );
      console.log('✅ Registered vehicle MH 12 AB 9021 in vehicles fleet');
    } catch (e) {
      console.log('Vehicle already exists');
    }
  } else {
    console.log('ℹ️ Demo Transporter already exists');
  }

  dbWrapper.save();
  console.log('🎉 Migration completed successfully!');
}

migrate().catch(console.error);
