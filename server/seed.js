const VERTICALS = [
  [1, "Enviro Pakistan", "B2C"],
  [2, "JW-SEZ", "B2B"],
  [3, "JW Forland", "B2B"],
  [4, "RD Pvt Ltd", "Distribution"],
];

const ACCOUNTS = [
  [1, "Enviro Mart Gulberg", "Retail Dealer", 1, "Lahore", "North", 5000000, 1850000, "Gold"],
  [2, "CoolPoint DHA", "Retail Dealer", 1, "Lahore", "North", 3000000, 2900000, "Silver"],
  [3, "Sadiq Electronics Saddar", "Retail Dealer", 1, "Karachi", "South", 4000000, 1200000, "Gold"],
  [4, "Bismillah Traders Blue Area", "Retail Dealer", 1, "Islamabad", "North", 2500000, 400000, "Platinum"],
  [5, "RD Lahore Branch", "Regional Distributor", 4, "Lahore", "North", 20000000, 8400000, "Platinum"],
  [6, "RD Karachi Branch", "Regional Distributor", 4, "Karachi", "South", 18000000, 12100000, "Gold"],
  [7, "Bahria Town Phase 8", "Corporate B2B Client", 2, "Rawalpindi", "North", 50000000, 22000000, "Platinum"],
  [8, "Packages Mall Holdings", "Corporate B2B Client", 2, "Lahore", "North", 35000000, 9500000, "Gold"],
  [9, "Lucky Cement Plant", "Industrial Tenant", 2, "Karachi", "South", 80000000, 41000000, "Platinum"],
  [10, "JW Forland Fleet — Faisalabad", "Corporate B2B Client", 3, "Faisalabad", "Central", 25000000, 6000000, "Silver"],
  [11, "Enviro Service Center Johar Town", "Retail Dealer", 1, "Lahore", "North", 1500000, 300000, "Silver"],
  [12, "Hyderabad Wholesale Hub", "Regional Distributor", 4, "Hyderabad", "South", 12000000, 5600000, "Gold"],
];

const CONTACTS = [
  [1, "Ahmed Raza", "+92 300 1234567", "ahmed.raza@gmail.com", "Lahore", "House 42, Block C, Johar Town", "End Consumer", null],
  [2, "Fatima Khan", "+92 321 7654321", "fatima.khan@outlook.com", "Lahore", "Flat 7, Askari 11, Sector B", "End Consumer", null],
  [3, "Usman Tariq", "+92 333 1122334", "usman.tariq@gmail.com", "Karachi", "Plot 18, DHA Phase 6", "End Consumer", null],
  [4, "Ayesha Siddiqui", "+92 345 5566778", "ayesha.s@gmail.com", "Islamabad", "House 9, Street 23, F-7/2", "End Consumer", null],
  [5, "Bilal Hussain", "+92 301 9988776", "bilal.h@yahoo.com", "Lahore", "12-B, Model Town Link Road", "End Consumer", null],
  [6, "Zainab Malik", "+92 322 4455667", "zainab.malik@gmail.com", "Karachi", "B-14, Gulshan-e-Iqbal Block 13", "End Consumer", null],
  [7, "Hamza Sheikh", "+92 313 7788990", "hamza.sheikh@gmail.com", "Lahore", "House 88, DHA Phase 5", "End Consumer", null],
  [8, "Sana Iqbal", "+92 334 2233445", "sana.iqbal@gmail.com", "Islamabad", "House 21, G-11/3", "End Consumer", null],
  [9, "Imran Qureshi", "+92 300 6677889", "imran.q@hotmail.com", "Karachi", "Shop 4, Bahadurabad", "End Consumer", null],
  [10, "Nida Aslam", "+92 321 3344556", "nida.aslam@gmail.com", "Lahore", "House 5, Gulberg III", "End Consumer", null],
  [11, "Kashif Mehmood", "+92 300 1112223", "kashif@enviromart.pk", "Lahore", "Main Boulevard, Gulberg", "Dealer Owner", 1],
  [12, "Shazia Anwar", "+92 321 4445556", "shazia@coolpoint.pk", "Lahore", "DHA Phase 2, Commercial Area", "Dealer Owner", 2],
  [13, "Tariq Jameel", "+92 333 7778889", "tariq@sadiqelectronics.pk", "Karachi", "Saddar Electronics Market", "Dealer Owner", 3],
  [14, "Asad Ullah", "+92 345 9990001", "asad@bismillahtraders.pk", "Islamabad", "Blue Area, Jinnah Avenue", "Dealer Owner", 4],
  [15, "Faisal Nadeem", "+92 300 5556667", "faisal.nadeem@bahriatown.com.pk", "Rawalpindi", "Bahria Town Phase 8, Head Office", "Procurement Head", 7],
  [16, "Raza Haider", "+92 321 8889990", "raza.haider@luckycement.com", "Karachi", "Lucky Cement Plant, Port Qasim", "Procurement Head", 9],
];

const PRODUCTS = [
  [1, "ENV-AC-15INV", "1.5 Ton Inverter AC", 1, "Cooling", 185000, 60],
  [2, "ENV-AC-10INV", "1.0 Ton Inverter AC", 1, "Cooling", 145000, 60],
  [3, "ENV-GYS-INST", "Instant Geyser 3kW", 1, "Heating", 32500, 24],
  [4, "ENV-AF-5L", "Air Fryer 5L", 1, "Kitchen", 18900, 12],
  [5, "ENV-REF-16CFT", "Refrigerator 16 CFT", 1, "Kitchen", 165000, 60],
  [6, "ENV-AC-2TON", "2.0 Ton Commercial AC", 1, "Commercial", 310000, 36],
  [7, "JWF-TRK-5T", "Forland 5-Ton Cargo Truck", 3, "Commercial EV", 8900000, 36],
  [8, "JWF-TRK-10T", "Forland 10-Ton Cargo Truck", 3, "Commercial EV", 14500000, 36],
  [9, "JW-SEZ-PLOT-1K", "Industrial Plot 1 Kanal", 2, "Industrial Land", 42000000, 0],
  [10, "JW-SEZ-WH-5K", "Warehouse 5,000 sqft", 2, "Industrial Land", 65000000, 0],
  [11, "RD-AC-15INV", "1.5 Ton Inverter AC (Distributor)", 4, "Cooling", 178000, 60],
  [12, "RD-GYS-INST", "Instant Geyser (Distributor)", 4, "Heating", 31000, 24],
];

const ASSETS = [
  [1, "ENV-AC-2026-8841", 1, 1, 1, "2026-03-12", "2031-03-12", "Active"],
  [2, "ENV-AC-2025-7712", 1, 2, 2, "2025-06-01", "2030-06-01", "Active"],
  [3, "ENV-AC-2024-5530", 2, 3, 3, "2024-01-15", "2029-01-15", "Active"],
  [4, "ENV-GYS-2025-2210", 3, 4, 4, "2025-11-20", "2027-11-20", "Active"],
  [5, "ENV-AF-2026-1102", 4, 5, 1, "2026-02-14", "2027-02-14", "Active"],
  [6, "ENV-AC-2023-9981", 1, 6, 3, "2023-05-10", "2028-05-10", "Active"],
  [7, "ENV-REF-2024-6677", 5, 7, 2, "2024-08-08", "2029-08-08", "Active"],
  [8, "ENV-AC-2022-3320", 2, 8, 4, "2022-04-02", "2027-04-02", "Active"],
  [9, "ENV-AC-2026-4410", 6, 9, 6, "2026-01-05", "2029-01-05", "Active"],
  [10, "ENV-AC-2021-1200", 1, 10, 5, "2021-07-19", "2026-07-19", "Expired"],
];

const TECHNICIANS = [
  [1, "Waqas Ahmed", "Lahore", "+92 300 7778889", "available", 31.5204, 74.3587],
  [2, "Naveed Akhtar", "Karachi", "+92 321 6667778", "on_job", 24.8607, 67.0011],
  [3, "Sheraz Khan", "Islamabad", "+92 333 5556667", "available", 33.6844, 73.0479],
  [4, "Adnan Butt", "Lahore", "+92 345 4445556", "available", 31.4697, 74.2728],
];

const OPPORTUNITIES = [
  [1, "500 Inverter ACs for Bahria Town Phase 8", 2, 7, "Negotiation", 92500000, "2026-12-15", 0],
  [2, "JW-SEZ Warehouse + Forland Fleet Bundle", 2, 8, "Proposal", 78000000, "2027-01-20", 1],
  [3, "Lucky Cement Plant HVAC Retrofit", 2, 9, "Lead", 145000000, "2027-03-01", 0],
  [4, "Faisalabad Fleet Expansion — 20 Trucks", 3, 10, "Closed-Won", 178000000, "2026-11-30", 0],
  [5, "Packages Mall Retail Wing Cooling", 2, 8, "Negotiation", 56000000, "2026-12-05", 1],
  [6, "Enviro Distributor Onboarding — Hyderabad", 4, 12, "Lead", 18000000, "2026-12-28", 0],
];

const ORDERS = [
  ["SO-2026-1042", 5, "RD Lahore Branch", "Primary", 8900000, "Credit", "Delivered", 0],
  ["SO-2026-1043", 1, "Enviro Mart Gulberg", "Secondary", 1850000, "Paid", "Delivered", 0],
  ["SO-2026-1044", 2, "CoolPoint DHA", "Secondary", 2900000, "BNPL", "Dispatched", 0],
  ["SO-2026-1045", 3, "Sadiq Electronics Saddar", "Secondary", 1200000, "Paid", "Delivered", 0],
  ["SO-2026-1046", 6, "RD Karachi Branch", "Primary", 12100000, "Credit", "Dispatched", 0],
  ["SO-2026-1047", 4, "Bismillah Traders Blue Area", "Secondary", 400000, "Paid", "Delivered", 0],
  ["SO-2026-1048", 12, "Hyderabad Wholesale Hub", "Primary", 5600000, "Credit", "Dispatched", 0],
  ["SO-2026-1049", 11, "Enviro Service Center Johar Town", "Secondary", 300000, "Paid", "Delivered", 0],
];

const TICKETS = [
  ["TCK-2026-2201", "WhatsApp", 1, 1, "Cooling Issue", 1, 4, "Open", null, null, 1],
  ["TCK-2026-2202", "Call Center", 3, 3, "Gas Refill", 2, 8, "Technician Dispatched", null, null, 1],
  ["TCK-2026-2203", "Web Portal", 4, 4, "New Installation", 3, 24, "Open", null, null, 1],
  ["TCK-2026-2204", "WhatsApp", 6, 6, "Cooling Issue", 1, 4, "Resolved", "Capacitor replaced", "Replaced run capacitor and recharged gas.", 1],
  ["TCK-2026-2205", "WhatsApp", 8, 8, "DOA", 3, 6, "Technician Dispatched", null, null, 1],
  ["TCK-2026-2206", "Call Center", 9, 9, "Cooling Issue", 2, 4, "Open", null, null, 1],
  ["TCK-2026-2207", "Web Portal", 10, 10, "Gas Refill", null, 12, "Open", null, null, 0],
  ["TCK-2026-2208", "WhatsApp", 2, 2, "Cooling Issue", 4, 4, "Resolved", "PCB reset", "Reset PCB and tested for 30 minutes.", 1],
];

function hoursFromNow(h) {
  const d = new Date(Date.now() + h * 3600 * 1000);
  return d.toISOString().slice(0, 19).replace("T", " ");
}

export async function seedData(db) {
  const [rows] = await db.query("SELECT COUNT(*) AS c FROM accounts");
  if (rows[0].c > 0) return;

  await db.query("INSERT IGNORE INTO entity_verticals (id, name, type) VALUES ?", [VERTICALS]);
  await db.query(
    "INSERT IGNORE INTO accounts (id, name, account_type, vertical_id, city, region, credit_limit_pkr, current_balance_pkr, tier) VALUES ?",
    [ACCOUNTS]
  );
  await db.query(
    "INSERT IGNORE INTO contacts (id, full_name, phone_whatsapp, email, city, address, contact_type, account_id) VALUES ?",
    [CONTACTS]
  );
  await db.query(
    "INSERT IGNORE INTO products (id, sku, name, vertical_id, category, unit_price_pkr, warranty_months) VALUES ?",
    [PRODUCTS]
  );
  await db.query(
    "INSERT IGNORE INTO customer_assets (id, serial_number, product_id, owner_contact_id, dealer_account_id, purchase_date, warranty_expiry_date, warranty_status) VALUES ?",
    [ASSETS]
  );
  await db.query(
    "INSERT IGNORE INTO technicians (id, name, city, phone, status, lat, lng) VALUES ?",
    [TECHNICIANS]
  );
  await db.query(
    "INSERT IGNORE INTO opportunities (id, title, vertical_id, account_id, stage, deal_value_pkr, expected_close_date, cross_sell_flag) VALUES ?",
    [OPPORTUNITIES]
  );
  await db.query(
    "INSERT IGNORE INTO channel_orders (order_number, dealer_account_id, branch_name, order_type, total_amount_pkr, payment_status, order_status, discount_pkr) VALUES ?",
    [ORDERS]
  );

  for (const t of TICKETS) {
    await db.query(
      `INSERT IGNORE INTO service_tickets
        (ticket_number, channel, contact_id, asset_id, issue_type, assigned_technician_id, sla_deadline, status, parts_used, notes, warranty_verified, resolved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [t[0], t[1], t[2], t[3], t[4], t[5], hoursFromNow(t[6]), t[7], t[8], t[9], t[10], t[7] === "Resolved" ? hoursFromNow(-2) : null]
    );
  }

  await db.query(
    "INSERT IGNORE INTO erp_settings (id, provider, last_sync, payload) VALUES (1, 'SAP S/4HANA', ?, ?)",
    [hoursFromNow(-1), JSON.stringify({ status: "idle", provider: "SAP S/4HANA" })]
  );
}
