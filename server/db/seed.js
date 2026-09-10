const bcrypt = require('bcryptjs');
const { initDb, getDb } = require('./database');

async function seed() {
  console.log('🌾 Initializing database for SIH Cohesive Seeding...');
  await initDb();
  const db = getDb();

  console.log('🧹 Clearing existing tables...');
  const tables = [
    'dispatch_location_history', 'dispatches', 'orders', 'buyers', 'payments',
    'grading_records', 'weighing_records', 'lots', 'master_lots',
    'transport_slots', 'transport_schedules', 'equipment_bookings', 'equipment',
    'vehicles', 'harvest_records', 'prediction_history', 'crop_ai_observations',
    'daily_crop_logs', 'crop_cycles', 'fields', 'crop_notifications',
    'expenses', 'crop_logs', 'ai_alerts', 'mandi_prices', 'users', 'fpos'
  ];

  for (const t of tables) {
    try {
      db.exec(`DELETE FROM ${t}`);
    } catch (e) {
      // Table may not exist yet
    }
  }
  try { db.exec(`DELETE FROM sqlite_sequence`); } catch (e) {}

  const hash = bcrypt.hashSync('password123', 10);

  // =========================================================================
  // 1. FPOs (Sahyadri Kisaan Samriddhi FPO, Pune Central Hub)
  // =========================================================================
  console.log('🏛️ Seeding FPOs with Precision Geolocation...');
  const fpos = [
    {
      id: 1,
      name: 'Sahyadri Kisaan Samriddhi Agro FPO',
      loc: 'Baramati Central Aggregation Hub',
      dist: 'Pune',
      state: 'Maharashtra',
      lat: 18.5204,
      lng: 73.8567,
      crops: 'Tomato, Onion, Potato, Wheat, Soybean',
      members: 280,
      phone: '9822001122'
    },
    {
      id: 2,
      name: 'Nashik Krishi Vikas FPO',
      loc: 'Pimpalgaon Central Yard',
      dist: 'Nashik',
      state: 'Maharashtra',
      lat: 20.1764,
      lng: 73.9872,
      crops: 'Onion, Tomato, Grapes, Pomegranate',
      members: 410,
      phone: '9822003344'
    },
    {
      id: 3,
      name: 'Malwa Golden Grain FPO',
      loc: 'Sanwer Logistics Hub',
      dist: 'Indore',
      state: 'Madhya Pradesh',
      lat: 22.7196,
      lng: 75.8577,
      crops: 'Soybean, Wheat, Potato, Garlic',
      members: 210,
      phone: '9822005566'
    }
  ];

  for (const f of fpos) {
    db.prepare(`
      INSERT INTO fpos (id, name, location, district, state, lat, lng, crops_handled, member_count, contact_phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(f.id, f.name, f.loc, f.dist, f.state, f.lat, f.lng, f.crops, f.members, f.phone);
  }

  // =========================================================================
  // 2. USERS: THE 4 SIH SHOWCASE DEMO ACTORS
  // =========================================================================
  console.log('👥 Seeding Interconnected Users (FPO Admin, Farmers, Buyer, Transporter)...');

  // Role 1: FPO Admin
  db.prepare(`
    INSERT INTO users (id, name, first_name, last_name, phone, password, role, fpo_id, village, district, state)
    VALUES (1, 'Rajesh Kumar', 'Rajesh', 'Kumar', '9999900001', ?, 'fpo_admin', 1, 'Baramati', 'Pune', 'Maharashtra')
  `).run(hash);

  // FPO Worker
  db.prepare(`
    INSERT INTO users (id, name, first_name, last_name, phone, password, role, fpo_id, village, district, state)
    VALUES (2, 'Mohan Sharma', 'Mohan', 'Sharma', '9999900002', ?, 'fpo_worker', 1, 'Baramati', 'Pune', 'Maharashtra')
  `).run(hash);

  // Role 2: Connected Cluster Farmers (Village Rui & Katewadi Cluster, Pune)
  const clusterFarmers = [
    { id: 10, name: 'Ramesh Patel', fn: 'Ramesh', ln: 'Patel', phone: '9999900010', village: 'Rui', district: 'Pune', state: 'Maharashtra' },
    { id: 11, name: 'Suresh Shinde', fn: 'Suresh', ln: 'Shinde', phone: '9999900011', village: 'Katewadi', district: 'Pune', state: 'Maharashtra' },
    { id: 12, name: 'Anand Gaikwad', fn: 'Anand', ln: 'Gaikwad', phone: '9999900012', village: 'Malegaon Bk', district: 'Pune', state: 'Maharashtra' },
    { id: 13, name: 'Ram Lal', fn: 'Ram', ln: 'Lal', phone: '9999900013', village: 'Rui', district: 'Pune', state: 'Maharashtra' },
    { id: 14, name: 'Anita Bai', fn: 'Anita', ln: 'Bai', phone: '9999900014', village: 'Katewadi', district: 'Pune', state: 'Maharashtra' }
  ];

  for (const f of clusterFarmers) {
    db.prepare(`
      INSERT INTO users (id, name, first_name, last_name, phone, password, role, fpo_id, village, district, state)
      VALUES (?, ?, ?, ?, ?, ?, 'farmer', 1, ?, ?, ?)
    `).run(f.id, f.name, f.fn, f.ln, f.phone, hash, f.village, f.district, f.state);
  }

  // Standalone Farmer
  db.prepare(`
    INSERT INTO users (id, name, first_name, last_name, phone, password, role, fpo_id, village, district, state)
    VALUES (30, 'Vikram Singh', 'Vikram', 'Singh', '9999900030', ?, 'farmer', NULL, 'Shirur', 'Pune', 'Maharashtra')
  `).run(hash);

  // Role 3: Wholesale Buyers
  const buyersList = [
    {
      id: 20,
      name: 'Vikramaditya Singhania',
      fn: 'Vikramaditya',
      ln: 'Singhania',
      phone: '9999900020',
      biz: 'Reliance Fresh Agri Wholesale Ltd',
      type: 'wholesaler',
      loc: 'Vashi APMC Terminal, Navi Mumbai',
      score: 4.9,
      days: 3,
      tx: 24,
      kg: 185000
    },
    {
      id: 21,
      name: 'Harpreet Singh',
      fn: 'Harpreet',
      ln: 'Singh',
      phone: '9999900021',
      biz: 'Delhi Fresh Wholesalers & Exporters',
      type: 'trader',
      loc: 'Azadpur Mandi, New Delhi',
      score: 3.8,
      days: 7,
      tx: 14,
      kg: 92000
    },
    {
      id: 22,
      name: 'Sanjay Deshmukh',
      fn: 'Sanjay',
      ln: 'Deshmukh',
      phone: '9999900022',
      biz: 'Sahyadri Food Processing Industries',
      type: 'processor',
      loc: 'MIDC Food Park, Ranjangaon, Pune',
      score: 4.7,
      days: 2,
      tx: 19,
      kg: 74000
    }
  ];

  for (let i = 0; i < buyersList.length; i++) {
    const b = buyersList[i];
    db.prepare(`
      INSERT INTO users (id, name, first_name, last_name, phone, password, role, fpo_id, village, district, state, business_name, business_type)
      VALUES (?, ?, ?, ?, ?, ?, 'buyer', NULL, ?, 'Pune', 'Maharashtra', ?, ?)
    `).run(b.id, b.name, b.fn, b.ln, b.phone, hash, b.loc, b.biz, b.type);

    db.prepare(`
      INSERT INTO buyers (id, user_id, business_name, business_type, location, past_transactions, avg_payment_days, total_purchased_kg, reliability_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(i + 1, b.id, b.biz, b.type, b.loc, b.tx, b.days, b.kg, b.score);
  }

  // Role 4: Transporter / Commercial Driver
  db.prepare(`
    INSERT INTO users (
      id, name, first_name, last_name, phone, password, role, fpo_id,
      village, district, state, vehicle_number, vehicle_type, vehicle_capacity_kg, license_number
    ) VALUES (
      35, 'Ramesh Patil (Transporter)', 'Ramesh', 'Patil', '9999900040', ?, 'transporter', 1,
      'Baramati', 'Pune', 'Maharashtra', 'MH 12 AB 9021', 'standard_truck', 5000, 'MH12-2018-0092182'
    )
  `).run(hash);

  // =========================================================================
  // 3. FARMER FIELDS & CROP CYCLES (Ramesh Patel, ID 10)
  // =========================================================================
  console.log('🌱 Seeding Farmer Fields & Crop Cycles (My Crop Module)...');
  db.prepare(`
    INSERT INTO fields (id, farmer_id, field_name, total_area_acres, cultivated_area_acres, location_state, location_district, location_village, gps_lat, gps_lng, soil_type, irrigation_type, water_availability, previous_crop)
    VALUES (1, 10, 'Ganga Plot (Khasra 42)', 3.5, 3.5, 'Maharashtra', 'Pune', 'Rui', 18.152, 74.578, 'Black Clay Loam', 'Drip Irrigation', 'Adequate', 'Soybean'),
           (2, 10, 'Canal Well Field', 2.0, 1.5, 'Maharashtra', 'Pune', 'Rui', 18.155, 74.582, 'Alluvial Loam', 'Sprinkler System', 'Adequate', 'Wheat')
  `).run();

  // Active Tomato Crop Cycle on Ganga Plot (Currently at Harvest Day 75)
  db.prepare(`
    INSERT INTO crop_cycles (
      id, crop_id, farmer_id, field_id, crop_name, variety, sowing_date, area_acres,
      seed_quantity, expected_yield, yield_unit, farming_method, seed_source,
      irrigation_method, soil_type, fertilizer_info, previous_crop, notes,
      current_stage, current_day, total_duration_days, estimated_harvest_start,
      estimated_harvest_end, most_likely_harvest_date, prediction_confidence,
      prediction_reason, progress_pct, health_status, status
    ) VALUES (
      1, 'CRP-2026-TOM-01', 10, 1, 'Tomato', 'Abhinav Hybrid (Syngenta)', '2026-06-25', 3.5,
      0.5, 180.0, 'quintal', 'Integrated Pest Management', 'Syngenta Seeds India',
      'Drip Fertigation', 'Black Clay Loam', 'Basal DAP 100kg + weekly 19:19:19 & micronutrient fertigation', 'Soybean',
      'Staking completed on bamboos, healthy crimson fruit clusters harvested today.',
      'Harvesting & Peak Yield', 75, 95, '2026-09-05',
      '2026-09-15', '2026-09-08', 0.94,
      'Peak maturity reached. Thermal accumulation index confirms optimal brix sugar level and fruit firmness.',
      82, 'Excellent', 'active'
    )
  `).run();

  // Ramesh Patel's Farm Expenses
  db.prepare(`
    INSERT INTO expenses (farmer_id, category, amount, description, date)
    VALUES (10, 'Seeds', 14500, 'Certified F1 Abhinav Hybrid Seeds (Syngenta)', '2026-06-20'),
           (10, 'Fertilizer', 18200, 'Water-soluble 19:19:19, Calcium Nitrate, Boron', '2026-07-12'),
           (10, 'Pesticide', 6800, 'Neem extract and biological pest control', '2026-08-04'),
           (10, 'Labour', 16000, 'Staking, pruning, and harvesting labour', '2026-09-07')
  `).run();

  // Daily log for active Tomato harvest
  const tomatoTasks = [
    { task: "Morning selective harvesting of Grade A red-ripe tomatoes", completed: true },
    { task: "Sanitize harvest crates with food-grade wash", completed: true },
    { task: "Check drip lines for dripper emitter clogging", completed: true },
    { task: "Transport produce to FPO collection centre Baramati", completed: true }
  ];

  db.prepare(`
    INSERT INTO daily_crop_logs (crop_cycle_id, day_number, log_date, stage, tasks_json, health_status, irrigation_status, pest_observation, disease_observation, notes, is_completed)
    VALUES (1, 75, '2026-09-08', 'Harvesting & Peak Yield', ?, 'Excellent', 'Done', 'None', 'None', '6,000 kg harvest gathered. High firmness and radiant crimson gloss.', 1)
  `).run(JSON.stringify(tomatoTasks));

  // AI Observation
  db.prepare(`
    INSERT INTO crop_ai_observations (crop_cycle_id, image_url, observation, possible_issue, severity, confidence, recommendation)
    VALUES (1, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400',
            'Canopy is clean and free of late blight. Fruit skin shows optimal turgidity and uniform carotenoid color.',
            'No disease or insect infestation detected.',
            'Low', 0.96, 'Continue morning harvesting to avoid heat degradation before transport.')
  `).run();

  // =========================================================================
  // 4. SHARED TRANSPORT SLOTS (Village Rui & Katewadi Demand Aggregation)
  // =========================================================================
  console.log('🚛 Seeding Shared Transport Slots (Village Demand Aggregation)...');
  try { db.exec(`ALTER TABLE transport_slots ADD COLUMN pickup_window TEXT`); } catch(e) {}
  try { db.exec(`ALTER TABLE transport_slots ADD COLUMN assigned_vehicle_name TEXT`); } catch(e) {}
  const today = '2026-09-08';
  db.prepare(`
    INSERT INTO transport_slots (
      slot_code, farmer_id, fpo_id, produce_type, quantity_kg, pickup_village,
      preferred_date, harvest_date, contact_phone, status, estimated_cost,
      pickup_window, assigned_vehicle_name
    ) VALUES
      ('SLOT-TOM-9081', 10, 1, 'Tomato', 6000, 'Rui', '${today}', '${today}', '9999900010', 'assigned', 4200, '08:00 AM - 10:00 AM', 'Eicher Pro Reefer (MH 12 AB 9021)'),
      ('SLOT-TOM-9082', 11, 1, 'Tomato', 4000, 'Katewadi', '${today}', '${today}', '9999900011', 'assigned', 2800, '09:00 AM - 11:00 AM', 'Eicher Pro Reefer (MH 12 AB 9021)'),
      ('SLOT-TOM-9083', 12, 1, 'Tomato', 2500, 'Malegaon Bk', '${today}', '${today}', '9999900012', 'assigned', 1750, '10:00 AM - 12:00 PM', 'Eicher Pro Reefer (MH 12 AB 9021)')
  `).run();

  // =========================================================================
  // 5. FPO COLLECTION, WEIGHING & AI QUALITY GRADING
  // =========================================================================
  console.log('📦 Seeding FPO Collection Lots, Digital Weighing & AI Grading...');
  // 3 Contributing Lots bringing total 12,250 kg Tomatoes
  db.prepare(`
    INSERT INTO lots (id, lot_id, farmer_id, fpo_id, crop_type, variety, estimated_quantity, weight_kg, collection_centre, recorded_by, status)
    VALUES (1, 'TOM-0908-01', 10, 1, 'Tomato', 'Abhinav Hybrid', 6000, 5850, 'Baramati Central Hub', 2, 'graded'),
           (2, 'TOM-0908-02', 11, 1, 'Tomato', 'Abhinav Hybrid', 4000, 3920, 'Baramati Central Hub', 2, 'graded'),
           (3, 'TOM-0908-03', 12, 1, 'Tomato', 'Pusa Ruby', 2500, 2480, 'Baramati Central Hub', 2, 'graded')
  `).run();

  db.prepare(`
    INSERT INTO weighing_records (lot_id, weight_kg, weighed_by)
    VALUES (1, 5850, 2),
           (2, 3920, 2),
           (3, 2480, 2)
  `).run();

  // AI Quality Grading Records (Computer Vision Classifications)
  db.prepare(`
    INSERT INTO grading_records (lot_id, grade_a_kg, grade_b_kg, grade_c_kg, rejected_kg, ai_suggested_grade, ai_confidence, final_grade, graded_by)
    VALUES (1, 3510, 1755, 468, 117, 'A', 0.96, 'A', 2),
           (2, 2156, 1372, 314, 78, 'A', 0.94, 'A', 2),
           (3, 1240, 992, 198, 50, 'A', 0.91, 'A', 2)
  `).run();

  // =========================================================================
  // 6. MASTER LOTS (Aggregated Batches & Processing Pathway)
  // =========================================================================
  console.log('🟢 Seeding Aggregated Master Lots...');
  // Master Lot 1: Grade A Premium Export/Retail (6,900 kg)
  // Master Lot 2: Grade B Regional Mandi (4,100 kg)
  // Master Lot 3: Grade C Food Processing / Puree Pathway (980 kg)
  db.prepare(`
    INSERT INTO master_lots (id, master_lot_id, fpo_id, crop_type, total_quantity_kg, grade_a_kg, grade_b_kg, grade_c_kg, rejected_kg, contributing_farmers, status)
    VALUES (1, 'ML-TOM-PUN-01', 1, 'Tomato', 6900, 6900, 0, 0, 0, 3, 'open'),
           (2, 'ML-TOM-PUN-02', 1, 'Tomato', 4100, 0, 4100, 0, 0, 3, 'open'),
           (3, 'ML-TOM-PROC-03', 1, 'Tomato', 980, 0, 0, 980, 0, 3, 'open'),
           (4, 'ML-ONI-NSK-02', 1, 'Onion', 15000, 9500, 4500, 800, 200, 8, 'open')
  `).run();

  // =========================================================================
  // 7. BUYER CONTRACTS & ORDERS
  // =========================================================================
  console.log('🛒 Seeding Buyer Contracts & Orders...');
  // Order 1: Reliance Fresh buys 6,000 kg Grade A Tomatoes from Master Lot 1
  // Order 2: Sahyadri Food Processing buys 980 kg Grade C Tomatoes for puree
  db.prepare(`
    INSERT INTO orders (id, order_id, buyer_id, fpo_id, master_lot_id, crop_type, grade, quantity_kg, price_per_kg, total_amount, status)
    VALUES (1, 'ORD-SIH-9081', 1, 1, 1, 'Tomato', 'A', 6000, 38.0, 228000, 'dispatched'),
           (2, 'ORD-SIH-9082', 3, 1, 3, 'Tomato', 'C', 980, 14.0, 13720, 'confirmed'),
           (3, 'ORD-SIH-8820', 2, 1, 4, 'Onion', 'A', 8000, 28.0, 224000, 'dispatched')
  `).run();

  // =========================================================================
  // 8. LIVE GPS DISPATCHES & REAL-TIME TRACKING BREADCRUMBS
  // =========================================================================
  console.log('📡 Seeding Live GPS Dispatches & Location Telemetry History...');
  const expEta = new Date(Date.now() + 1.5 * 3600 * 1000).toISOString();

  // Dispatch 1: The flagship live truck tracked on highway right now!
  // Route: Pune Aggregation Hub (18.5204, 73.8567) -> Vashi APMC Terminal, Navi Mumbai (19.0760, 72.9980)
  // Current live position: Near Khandala Ghat on Mumbai-Pune Expressway (Lat: 18.7562, Lng: 73.3718)
  db.prepare(`
    INSERT INTO dispatches (
      id, dispatch_id, order_id, master_lot_id, fpo_id, quantity_kg, destination, buyer_name,
      vehicle_number, vehicle_type, driver_name, driver_phone, cold_chain, cold_chain_temp,
      dispatch_time, expected_arrival, status, current_location, current_lat, current_lng,
      speed, heading, is_live_tracking, last_location_update
    ) VALUES (
      1, 'DISP-SIH-7701', 1, 1, 1, 6000, 'Reliance Fresh Hub, Vashi APMC Terminal, Navi Mumbai',
      'Reliance Fresh Agri Wholesale Ltd', 'MH 12 AB 9021', 'cold_truck', 'Ramesh Patil',
      '9999900040', 1, 11.5, CURRENT_TIMESTAMP, '${expEta}', 'in_transit',
      'Mumbai-Pune Expressway near Khandala Ghat (Km 82)', 18.7562, 73.3718, 54, 295, 1, CURRENT_TIMESTAMP
    ), (
      2, 'DISP-SIH-7702', 3, 4, 1, 8000, 'Delhi Fresh Hub, Azadpur APMC Yard, New Delhi',
      'Delhi Fresh Wholesalers & Exporters', 'KA 01 CT 8004', 'standard_truck', 'Gurpreet Singh',
      '9811122233', 0, NULL, CURRENT_TIMESTAMP, '${expEta}', 'in_transit',
      'NH-48 Highway near Surat bypass', 21.1702, 72.8311, 62, 10, 1, CURRENT_TIMESTAMP
    )
  `).run();

  // Breadcrumb Trail for DISP-SIH-7701 showing movement along the expressway
  db.prepare(`
    INSERT INTO dispatch_location_history (dispatch_id, lat, lng, speed, heading, recorded_at)
    VALUES (1, 18.5204, 73.8567, 0, 0, '2026-09-08 10:00:00'),
           (1, 18.6280, 73.7990, 48, 310, '2026-09-08 10:35:00'),
           (1, 18.7320, 73.6821, 62, 305, '2026-09-08 11:15:00'),
           (1, 18.7510, 73.4150, 48, 290, '2026-09-08 11:45:00'),
           (1, 18.7562, 73.3718, 54, 295, '2026-09-08 12:00:00')
  `).run();

  // =========================================================================
  // 9. TRANSPARENT FARMER PAYMENTS (Direct Value Return)
  // =========================================================================
  console.log('💰 Seeding Transparent Farmer Payment Distribution...');
  // Total Distributable to Farmers for Order ORD-SIH-9081 (₹2,28,000 - 5% FPO margin = ₹2,16,600)
  // Ramesh Patel: 50.8% = ₹1,10,032
  // Suresh Shinde: 31.2% = ₹67,580
  // Anand Gaikwad: 18.0% = ₹38,988
  db.prepare(`
    INSERT INTO payments (payment_id, order_id, farmer_id, fpo_id, amount, payment_type, lot_id, grade_breakdown, status, paid_at)
    VALUES ('PAY-SIH-001', 1, 10, 1, 110032, 'fpo_to_farmer', 1, '{"Grade_A_kg":3510,"Rate_per_kg":38.0,"Gross":133380,"Service_Fee_5pct":6669,"Net_Paid":110032}', 'completed', '2026-09-08 11:30:00'),
           ('PAY-SIH-002', 1, 11, 1, 67580, 'fpo_to_farmer', 2, '{"Grade_A_kg":2156,"Rate_per_kg":38.0,"Gross":81928,"Service_Fee_5pct":4096,"Net_Paid":67580}', 'completed', '2026-09-08 11:32:00'),
           ('PAY-SIH-003', 1, 12, 1, 38988, 'fpo_to_farmer', 3, '{"Grade_A_kg":1240,"Rate_per_kg":38.0,"Gross":47120,"Service_Fee_5pct":2356,"Net_Paid":38988}', 'completed', '2026-09-08 11:35:00')
  `).run();

  // =========================================================================
  // 10. MACHINERY, VEHICLES, AI ALERTS & PAN-INDIA MANDI PRICES
  // =========================================================================
  console.log('🚜 Seeding Equipment, Fleet Vehicles & Mandi Intelligence...');
  db.prepare(`
    INSERT INTO equipment (name, type, owner_type, owner_name, rate_per_hour, fpo_id, status)
    VALUES ('DJI Agras T40 Solar Spraying Drone', 'drone', 'fpo_fleet', 'FPO Fleet Tech Unit', 600, 1, 'available'),
           ('John Deere 5050D 4WD Tractor + Rotavator', 'tractor', 'fpo_fleet', 'FPO Fleet Unit 1', 800, 1, 'booked'),
           ('Cold-Room Mobile Pre-Cooling Unit', 'cold_storage', 'fpo_fleet', 'Central Hub Unit', 450, 1, 'available'),
           ('Automated Optical Produce Grader', 'grader', 'fpo_fleet', 'Baramati Grading Line', 300, 1, 'available')
  `).run();

  db.prepare(`
    INSERT INTO vehicles (vehicle_number, vehicle_type, capacity_kg, has_cold_chain, operator_name, driver_name, driver_phone, rate, rating, past_trips, fpo_id, status)
    VALUES ('MH 12 AB 9021', 'cold_truck', 5000, 1, 'Patil Express Cold Transport', 'Ramesh Patil', '9999900040', 4500, 4.9, 48, 1, 'booked'),
           ('KA 01 CT 8004', 'cold_truck', 8000, 1, 'Singh National Cold Chain', 'Gurpreet Singh', '9811122233', 9500, 4.8, 32, 1, 'booked'),
           ('MH 12 ST 4001', 'standard_truck', 5000, 0, 'Kisaan Express Logistics', 'Shankar Patil', '9822114455', 4000, 4.7, 34, 1, 'available'),
           ('MH 12 MT 1502', 'mini_truck', 1500, 0, 'Raju Mini Transport', 'Raju Mane', '9822114466', 1800, 4.5, 21, 1, 'available')
  `).run();

  db.prepare(`
    INSERT INTO ai_alerts (fpo_id, type, severity, title, message)
    VALUES (1, 'demand', 'info', 'High Wholesale Premium: Tomato in Mumbai APMC', 'Mumbai APMC wholesale price reached ₹42/kg. FPO Master Lot ML-TOM-PUN-01 secured ₹38/kg contract with Reliance Fresh (+58% over local farmgate).'),
           (1, 'processing', 'info', 'Zero-Waste Value Recovery: Grade C Puree Pathway', '980 kg of C-grade tomatoes diverted to Sahyadri Processing Unit at ₹14/kg, salvaging ₹13,720 which would otherwise be discarded.'),
           (1, 'transport', 'info', 'Cold Chain Compliance: Reefer Truck MH 12 AB 9021', 'Active telemetry confirms cargo bay temperature held stable at 11.5°C over 82 km of transit on Mumbai-Pune Expressway.')
  `).run();

  db.prepare(`
    INSERT INTO mandi_prices (crop, market, state, min_price, max_price, modal_price)
    VALUES ('Tomato', 'Vashi APMC (Navi Mumbai)', 'Maharashtra', 28, 44, 38),
           ('Tomato', 'Azadpur Mandi (Delhi)', 'Delhi', 26, 38, 32),
           ('Tomato', 'Pimpalgaon Mandi', 'Maharashtra', 22, 34, 28),
           ('Tomato', 'Kolar Mandi', 'Karnataka', 20, 32, 26),
           ('Onion', 'Lasalgaon Mandi', 'Maharashtra', 22, 32, 28),
           ('Onion', 'Azadpur Mandi (Delhi)', 'Delhi', 24, 36, 30),
           ('Potato', 'Agra Mandi', 'Uttar Pradesh', 14, 20, 17),
           ('Potato', 'Vashi APMC', 'Maharashtra', 18, 26, 22),
           ('Wheat', 'Khanna Mandi', 'Punjab', 24, 28, 26),
           ('Soybean', 'Indore Mandi', 'Madhya Pradesh', 46, 56, 51)
  `).run();

  db.save();
  console.log('🎉 SIH Interconnected Presentation Dataset successfully seeded into CROP2GO!');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
