const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'crop2go.db');

let db = null;
let dbReady = false;

// Wrapper class to make sql.js API compatible with better-sqlite3 API
// Routes use: db.prepare(sql).run(...params), .get(...params), .all(...params)
class StatementWrapper {
  constructor(database, sql) {
    this.database = database;
    this.sql = sql;
  }

  run(...params) {
    const bindParams = this._flattenParams(params);
    this.database.run(this.sql, bindParams);
    const changes = this.database.getRowsModified();
    // Get last insert rowid
    const result = this.database.exec('SELECT last_insert_rowid() as id');
    const lastInsertRowid = result.length > 0 ? result[0].values[0][0] : 0;
    return { changes, lastInsertRowid };
  }

  get(...params) {
    const bindParams = this._flattenParams(params);
    try {
      const stmt = this.database.prepare(this.sql);
      if (bindParams.length > 0) stmt.bind(bindParams);
      if (stmt.step()) {
        const columns = stmt.getColumnNames();
        const values = stmt.get();
        const row = {};
        columns.forEach((col, i) => { row[col] = values[i]; });
        stmt.free();
        return row;
      }
      stmt.free();
      return undefined;
    } catch (e) {
      throw e;
    }
  }

  all(...params) {
    const bindParams = this._flattenParams(params);
    try {
      const stmt = this.database.prepare(this.sql);
      if (bindParams.length > 0) stmt.bind(bindParams);
      const rows = [];
      const columns = stmt.getColumnNames();
      while (stmt.step()) {
        const values = stmt.get();
        const row = {};
        columns.forEach((col, i) => { row[col] = values[i]; });
        rows.push(row);
      }
      stmt.free();
      return rows;
    } catch (e) {
      throw e;
    }
  }

  _flattenParams(params) {
    if (params.length === 0) return [];
    if (params.length === 1 && Array.isArray(params[0])) return params[0];
    return params;
  }
}

class DatabaseWrapper {
  constructor(sqlJsDb) {
    this.db = sqlJsDb;
  }

  prepare(sql) {
    return new StatementWrapper(this.db, sql);
  }

  exec(sql) {
    return this.db.exec(sql);
  }

  pragma(str) {
    try {
      this.db.exec(`PRAGMA ${str}`);
    } catch (e) {
      // Ignore pragma errors
    }
  }

  close() {
    const data = this.db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
    this.db.close();
  }

  // Save to disk
  save() {
    const data = this.db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

let wrappedDb = null;

async function initDb() {
  if (wrappedDb) return wrappedDb;

  const SQL = await initSqlJs();
  
  let sqlDb;
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    sqlDb = new SQL.Database(fileBuffer);
  } else {
    sqlDb = new SQL.Database();
  }

  wrappedDb = new DatabaseWrapper(sqlDb);
  wrappedDb.pragma('journal_mode = WAL');
  wrappedDb.pragma('foreign_keys = ON');

  // Run schema
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  wrappedDb.exec(schema);

  // Safe incremental migrations for existing tables
  const safeAddColumn = (table, colDef) => {
    try {
      wrappedDb.exec(`ALTER TABLE ${table} ADD COLUMN ${colDef}`);
    } catch (e) {
      // Column already exists
    }
  };

  safeAddColumn('users', 'first_name TEXT');
  safeAddColumn('users', 'last_name TEXT');
  safeAddColumn('users', 'vehicle_number TEXT');
  safeAddColumn('users', 'vehicle_type TEXT');
  safeAddColumn('users', 'vehicle_capacity_kg REAL');
  safeAddColumn('users', 'license_number TEXT');
  safeAddColumn('dispatches', 'current_lat REAL');
  safeAddColumn('dispatches', 'current_lng REAL');
  safeAddColumn('dispatches', 'speed REAL');
  safeAddColumn('dispatches', 'heading REAL');
  safeAddColumn('dispatches', 'last_location_update DATETIME');
  safeAddColumn('dispatches', 'is_live_tracking INTEGER DEFAULT 0');

  // Auto-migrate users table if old restrictive role check exists
  try {
    const userTableInfo = wrappedDb.exec(`SELECT sql FROM sqlite_master WHERE name = 'users'`);
    const sqlText = (userTableInfo && userTableInfo[0] && userTableInfo[0].values[0][0]) || '';
    if (sqlText && !sqlText.includes('transporter')) {
      console.log('🔄 Auto-migrating users table for transporter role...');
      wrappedDb.pragma('foreign_keys = OFF');
      wrappedDb.exec(`
        CREATE TABLE users_new (
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
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      wrappedDb.exec(`
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
      wrappedDb.exec('DROP TABLE users');
      wrappedDb.exec('ALTER TABLE users_new RENAME TO users');
      wrappedDb.pragma('foreign_keys = ON');
      console.log('✅ users table migrated successfully for transporter role');
    }
  } catch (e) {
    console.error('User migration notice:', e.message);
  }

  // Seed demo Transporter account (9999900040)
  try {
    const tp = wrappedDb.exec(`SELECT * FROM users WHERE phone = '9999900040'`);
    if (!tp || tp.length === 0 || tp[0].values.length === 0) {
      const bcrypt = require('bcryptjs');
      const hash = bcrypt.hashSync('password123', 10);
      wrappedDb.exec(`
        INSERT INTO users (
          name, first_name, last_name, phone, password, role, fpo_id,
          village, district, state, vehicle_number, vehicle_type, vehicle_capacity_kg, license_number
        ) VALUES (
          'Ramesh Patil (Transporter)', 'Ramesh', 'Patil', '9999900040', '${hash}', 'transporter', 1,
          'Baramati', 'Pune', 'Maharashtra', 'MH 12 AB 9021', 'standard_truck', 5000, 'MH-12-2018-0092182'
        );
      `);
      console.log('✅ Seeded demo transporter (9999900040)');
    }
  } catch (e) {
    console.error('Transporter seed notice:', e.message);
  }

  // Save changes to disk immediately
  wrappedDb.save();

  // Auto-save every 30 seconds
  setInterval(() => {
    if (wrappedDb) wrappedDb.save();
  }, 30000);

  console.log('✅ Database initialized (sql.js)');
  dbReady = true;
  return wrappedDb;
}

function getDb() {
  if (!wrappedDb) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return wrappedDb;
}

function isDbReady() {
  return dbReady;
}

module.exports = { initDb, getDb, isDbReady };
