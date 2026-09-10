-- CROP2GO Comprehensive Database Schema
-- AI-Integrated Digital FPO Platform

CREATE TABLE IF NOT EXISTS fpos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  location TEXT,
  district TEXT,
  state TEXT,
  lat REAL,
  lng REAL,
  crops_handled TEXT,
  member_count INTEGER DEFAULT 0,
  contact_phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fpo_id) REFERENCES fpos(id)
);

-- ==========================================================
-- MY CROP MODULE: FIELDS & CROP CYCLES
-- ==========================================================

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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES users(id)
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
  health_status TEXT DEFAULT 'Good', -- Good, Needs Attention, Poor
  status TEXT DEFAULT 'active', -- active, harvested, abandoned
  actual_harvest_date DATE,
  actual_yield REAL,
  harvest_quality TEXT,
  harvest_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES users(id),
  FOREIGN KEY (field_id) REFERENCES fields(id)
);

CREATE TABLE IF NOT EXISTS daily_crop_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  crop_cycle_id INTEGER NOT NULL,
  day_number INTEGER NOT NULL,
  log_date DATE NOT NULL,
  stage TEXT,
  tasks_json TEXT,
  health_status TEXT DEFAULT 'Good',
  irrigation_status TEXT DEFAULT 'Not Required', -- Done, Not Done, Not Required
  fertilizer_activity TEXT,
  pest_observation TEXT DEFAULT 'None', -- None, Observed
  pest_details TEXT,
  disease_observation TEXT DEFAULT 'None', -- None, Observed
  disease_details TEXT,
  notes TEXT,
  photo_url TEXT,
  is_completed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (crop_cycle_id) REFERENCES crop_cycles(id)
);

CREATE TABLE IF NOT EXISTS crop_ai_observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  crop_cycle_id INTEGER NOT NULL,
  image_url TEXT,
  observation TEXT,
  possible_issue TEXT,
  severity TEXT, -- Low, Medium, High
  confidence REAL,
  recommendation TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (crop_cycle_id) REFERENCES crop_cycles(id)
);

CREATE TABLE IF NOT EXISTS prediction_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  crop_cycle_id INTEGER NOT NULL,
  previous_window TEXT,
  new_window TEXT,
  most_likely_date DATE,
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (crop_cycle_id) REFERENCES crop_cycles(id)
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (crop_cycle_id) REFERENCES crop_cycles(id)
);

CREATE TABLE IF NOT EXISTS crop_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  farmer_id INTEGER NOT NULL,
  crop_cycle_id INTEGER,
  type TEXT NOT NULL, -- stage, irrigation, weather, pest, harvest
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES users(id),
  FOREIGN KEY (crop_cycle_id) REFERENCES crop_cycles(id)
);

-- Legacy crop_logs for backward compatibility
CREATE TABLE IF NOT EXISTS crop_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  farmer_id INTEGER NOT NULL,
  crop_name TEXT NOT NULL,
  variety TEXT,
  area_acres REAL,
  sowing_date DATE,
  expected_harvest DATE,
  status TEXT DEFAULT 'growing',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  farmer_id INTEGER NOT NULL,
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES users(id)
);

-- ==========================================================
-- FPO OPERATIONS: INTAKE, LOTS & COMMERCIAL
-- ==========================================================

CREATE TABLE IF NOT EXISTS lots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lot_id TEXT UNIQUE NOT NULL,
  farmer_id INTEGER NOT NULL,
  fpo_id INTEGER NOT NULL,
  crop_type TEXT NOT NULL,
  variety TEXT,
  estimated_quantity REAL,
  weight_kg REAL,
  harvest_date DATE,
  collection_centre TEXT,
  recorded_by INTEGER,
  master_lot_id INTEGER,
  final_grade TEXT,
  status TEXT DEFAULT 'collected', -- collected, weighed, graded, aggregated, sold
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES users(id),
  FOREIGN KEY (fpo_id) REFERENCES fpos(id),
  FOREIGN KEY (recorded_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS weighing_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lot_id INTEGER NOT NULL,
  weight_kg REAL NOT NULL,
  weighed_by INTEGER,
  notes TEXT,
  weighed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lot_id) REFERENCES lots(id),
  FOREIGN KEY (weighed_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS grading_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lot_id INTEGER NOT NULL,
  grade_a_kg REAL DEFAULT 0,
  grade_b_kg REAL DEFAULT 0,
  grade_c_kg REAL DEFAULT 0,
  rejected_kg REAL DEFAULT 0,
  ai_suggested_grade TEXT,
  ai_confidence REAL,
  final_grade TEXT,
  graded_by INTEGER,
  graded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  image_path TEXT,
  FOREIGN KEY (lot_id) REFERENCES lots(id),
  FOREIGN KEY (graded_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS master_lots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  master_lot_id TEXT UNIQUE NOT NULL,
  fpo_id INTEGER NOT NULL,
  crop_type TEXT NOT NULL,
  total_quantity_kg REAL DEFAULT 0,
  grade_a_kg REAL DEFAULT 0,
  grade_b_kg REAL DEFAULT 0,
  grade_c_kg REAL DEFAULT 0,
  rejected_kg REAL DEFAULT 0,
  contributing_farmers INTEGER DEFAULT 0,
  collection_start DATE,
  collection_end DATE,
  status TEXT DEFAULT 'open', -- open, closed, selling, sold
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fpo_id) REFERENCES fpos(id)
);

CREATE TABLE IF NOT EXISTS buyers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  business_name TEXT,
  business_type TEXT,
  location TEXT,
  past_transactions INTEGER DEFAULT 0,
  avg_payment_days REAL DEFAULT 0,
  total_purchased_kg REAL DEFAULT 0,
  reliability_score REAL DEFAULT 4.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT UNIQUE NOT NULL,
  buyer_id INTEGER NOT NULL,
  fpo_id INTEGER NOT NULL,
  master_lot_id INTEGER,
  crop_type TEXT,
  grade TEXT,
  quantity_kg REAL,
  price_per_kg REAL,
  total_amount REAL,
  status TEXT DEFAULT 'pending', -- pending, confirmed, dispatched, delivered, paid
  ordered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (buyer_id) REFERENCES buyers(id),
  FOREIGN KEY (master_lot_id) REFERENCES master_lots(id),
  FOREIGN KEY (fpo_id) REFERENCES fpos(id)
);

CREATE TABLE IF NOT EXISTS dispatches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dispatch_id TEXT UNIQUE NOT NULL,
  order_id INTEGER,
  master_lot_id INTEGER,
  fpo_id INTEGER NOT NULL,
  quantity_kg REAL,
  destination TEXT,
  buyer_name TEXT,
  vehicle_number TEXT,
  vehicle_type TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  cold_chain INTEGER DEFAULT 0,
  cold_chain_temp REAL,
  dispatch_time DATETIME,
  expected_arrival DATETIME,
  status TEXT DEFAULT 'loading', -- loading, in_transit, delivered
  current_location TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (master_lot_id) REFERENCES master_lots(id),
  FOREIGN KEY (fpo_id) REFERENCES fpos(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id TEXT UNIQUE NOT NULL,
  order_id INTEGER,
  farmer_id INTEGER,
  fpo_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  payment_type TEXT DEFAULT 'fpo_to_farmer', -- buyer_to_fpo, fpo_to_farmer
  lot_id INTEGER,
  grade_breakdown TEXT,
  status TEXT DEFAULT 'pending', -- pending, completed
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (farmer_id) REFERENCES users(id),
  FOREIGN KEY (fpo_id) REFERENCES fpos(id)
);

CREATE TABLE IF NOT EXISTS equipment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fpo_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  owner_type TEXT DEFAULT 'fpo_fleet',
  owner_name TEXT,
  rate_per_hour REAL NOT NULL,
  status TEXT DEFAULT 'available',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fpo_id) REFERENCES fpos(id)
);

CREATE TABLE IF NOT EXISTS equipment_bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipment_id INTEGER NOT NULL,
  farmer_id INTEGER NOT NULL,
  fpo_id INTEGER NOT NULL,
  booking_date DATE,
  start_time TEXT,
  end_time TEXT,
  hours_used REAL,
  total_cost REAL,
  status TEXT DEFAULT 'pending', -- pending, confirmed, completed, cancelled
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id),
  FOREIGN KEY (farmer_id) REFERENCES users(id),
  FOREIGN KEY (fpo_id) REFERENCES fpos(id)
);

-- ==========================================================
-- TRANSPORT MODULE: VEHICLES & SHARED AGGREGATION SLOTS
-- ==========================================================

CREATE TABLE IF NOT EXISTS vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fpo_id INTEGER,
  vehicle_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL, -- magic_pickup, mini_truck, standard_truck, heavy_truck, cold_truck
  capacity_kg REAL NOT NULL,
  has_cold_chain INTEGER DEFAULT 0,
  operator_name TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  rate REAL NOT NULL,
  rating REAL DEFAULT 4.5,
  past_trips INTEGER DEFAULT 0,
  status TEXT DEFAULT 'available',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Individual farmer transport reservations (Demand Aggregation)
CREATE TABLE IF NOT EXISTS transport_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slot_code TEXT UNIQUE NOT NULL,
  farmer_id INTEGER NOT NULL,
  fpo_id INTEGER,
  produce_type TEXT NOT NULL,
  quantity_kg REAL NOT NULL,
  pickup_village TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  harvest_date DATE,
  contact_phone TEXT NOT NULL,
  notes TEXT,
  schedule_id INTEGER,
  status TEXT DEFAULT 'confirmed', -- confirmed, aggregated, assigned, in_transit, delivered, cancelled
  estimated_cost REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES users(id),
  FOREIGN KEY (schedule_id) REFERENCES transport_schedules(id)
);

-- Dynamic Aggregated Schedules
CREATE TABLE IF NOT EXISTS transport_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  schedule_code TEXT UNIQUE NOT NULL,
  fpo_id INTEGER NOT NULL,
  scheduled_date DATE NOT NULL,
  village_cluster TEXT NOT NULL,
  total_quantity_kg REAL DEFAULT 0,
  booking_count INTEGER DEFAULT 0,
  recommended_vehicle_tier TEXT, -- pickup, mini_truck, standard_truck, heavy_truck
  assigned_vehicle_id INTEGER,
  status TEXT DEFAULT 'scheduled', -- scheduled, vehicle_assigned, in_transit, completed
  pickup_window TEXT DEFAULT '08:00 AM - 12:00 PM',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_vehicle_id) REFERENCES vehicles(id)
);

-- Legacy transport_bookings for backwards compatibility
CREATE TABLE IF NOT EXISTS transport_bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER,
  booked_by INTEGER NOT NULL,
  fpo_id INTEGER,
  pickup_location TEXT,
  drop_location TEXT,
  quantity_kg REAL,
  cold_chain_needed INTEGER DEFAULT 0,
  booking_date DATE,
  rate REAL,
  status TEXT DEFAULT 'pending',
  is_shared INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (booked_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS ai_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fpo_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fpo_id) REFERENCES fpos(id)
);

CREATE TABLE IF NOT EXISTS mandi_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  crop TEXT NOT NULL,
  variety TEXT,
  market TEXT NOT NULL,
  state TEXT NOT NULL,
  min_price REAL NOT NULL,
  max_price REAL NOT NULL,
  modal_price REAL NOT NULL,
  date DATE DEFAULT CURRENT_DATE
);

-- ==========================================================
-- AI PRODUCE QUALITY GRADING RECORDS
-- ==========================================================
CREATE TABLE IF NOT EXISTS ai_grading_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  grading_id TEXT UNIQUE NOT NULL,
  fpo_id INTEGER NOT NULL,
  produce_type TEXT NOT NULL,
  lot_id INTEGER,
  image_url TEXT,
  ai_grade TEXT NOT NULL, -- Grade A, Grade B, Grade C
  ai_confidence REAL,
  ai_observations TEXT,
  final_grade TEXT NOT NULL,
  verification_status TEXT DEFAULT 'ai_confirmed', -- ai_confirmed, manually_overridden
  verified_by INTEGER,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fpo_id) REFERENCES fpos(id),
  FOREIGN KEY (verified_by) REFERENCES users(id)
);

-- ==========================================================
-- FPO PROCESSING: BATCH QUANTITY OVERVIEW & ALLOCATIONS
-- ==========================================================
CREATE TABLE IF NOT EXISTS processing_batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id TEXT UNIQUE NOT NULL,
  fpo_id INTEGER NOT NULL,
  master_lot_id INTEGER,
  crop_type TEXT NOT NULL,
  total_quantity_kg REAL NOT NULL,
  processed_kg REAL DEFAULT 0,
  remaining_kg REAL NOT NULL,
  cold_storage_kg REAL DEFAULT 0,
  processing_unit_kg REAL DEFAULT 0,
  packaging_kg REAL DEFAULT 0,
  status TEXT DEFAULT 'In Progress', -- In Progress, Completed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fpo_id) REFERENCES fpos(id)
);

CREATE TABLE IF NOT EXISTS processing_allocations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL,
  allocation_type TEXT NOT NULL, -- Cold Storage, Processing Unit, Packaging, Secondary Sale
  quantity_kg REAL NOT NULL,
  unit_location TEXT,
  status TEXT DEFAULT 'Stored', -- Stored, Processing, Completed
  notes TEXT,
  allocated_by INTEGER,
  allocated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id) REFERENCES processing_batches(id),
  FOREIGN KEY (allocated_by) REFERENCES users(id)
);

-- ==========================================================
-- DISPATCH REAL-TIME GPS TRACKING
-- ==========================================================
CREATE TABLE IF NOT EXISTS dispatch_location_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dispatch_id INTEGER NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  speed REAL,
  heading REAL,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dispatch_id) REFERENCES dispatches(id)
);

-- ==========================================================
-- FARMER AI EQUIPMENT RECOMMENDATIONS & ADVANCE ALERTS
-- ==========================================================
CREATE TABLE IF NOT EXISTS equipment_recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recommendation_id TEXT UNIQUE NOT NULL,
  farmer_id INTEGER NOT NULL,
  crop_cycle_id INTEGER,
  crop_name TEXT NOT NULL,
  equipment_type TEXT NOT NULL,
  expected_window TEXT NOT NULL,
  recommended_booking_window TEXT NOT NULL,
  reason TEXT NOT NULL,
  confidence TEXT DEFAULT 'High',
  status TEXT DEFAULT 'pending', -- pending, reminder_sent, booked, dismissed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES users(id),
  FOREIGN KEY (crop_cycle_id) REFERENCES crop_cycles(id)
);
