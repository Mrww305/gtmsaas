import mysql from "mysql2/promise";
import { seedData } from "./seed.js";

let pool;

function config() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  return {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };
}

export function getPool() {
  if (!pool) {
    const cfg = config();
    if (typeof cfg === "string") {
      pool = mysql.createPool(cfg);
    } else {
      pool = mysql.createPool({
        ...cfg,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        charset: "utf8mb4",
        dateStrings: true,
        timezone: "Z",
      });
    }
  }
  return pool;
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(120) NOT NULL,
    company VARCHAR(160) DEFAULT NULL,
    role VARCHAR(60) DEFAULT NULL,
    use_case VARCHAR(160) DEFAULT NULL,
    team_size VARCHAR(40) DEFAULT NULL,
    verified TINYINT NOT NULL DEFAULT 0,
    verify_code VARCHAR(12) DEFAULT NULL,
    verify_expires DATETIME DEFAULT NULL,
    terms_accepted TINYINT NOT NULL DEFAULT 0,
    onboarded TINYINT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME DEFAULT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS sessions (
    token CHAR(64) PRIMARY KEY,
    user_id INT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sessions_user (user_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) DEFAULT NULL,
    email VARCHAR(190) NOT NULL,
    company VARCHAR(160) DEFAULT NULL,
    phone VARCHAR(40) DEFAULT NULL,
    message TEXT DEFAULT NULL,
    source VARCHAR(60) DEFAULT 'website',
    meta JSON DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS entity_verticals (
    id INT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    type VARCHAR(30) NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS accounts (
    id INT PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    account_type VARCHAR(60) NOT NULL,
    vertical_id INT NOT NULL,
    city VARCHAR(80) NOT NULL,
    region VARCHAR(30) NOT NULL,
    credit_limit_pkr BIGINT NOT NULL DEFAULT 0,
    current_balance_pkr BIGINT NOT NULL DEFAULT 0,
    tier VARCHAR(20) NOT NULL DEFAULT 'Silver'
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS contacts (
    id INT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    phone_whatsapp VARCHAR(40) NOT NULL,
    email VARCHAR(190) DEFAULT NULL,
    city VARCHAR(80) DEFAULT NULL,
    address VARCHAR(255) DEFAULT NULL,
    contact_type VARCHAR(60) NOT NULL,
    account_id INT DEFAULT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY,
    sku VARCHAR(60) NOT NULL,
    name VARCHAR(160) NOT NULL,
    vertical_id INT NOT NULL,
    category VARCHAR(60) NOT NULL,
    unit_price_pkr BIGINT NOT NULL,
    warranty_months INT NOT NULL DEFAULT 12
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS customer_assets (
    id INT PRIMARY KEY,
    serial_number VARCHAR(60) NOT NULL,
    product_id INT NOT NULL,
    owner_contact_id INT NOT NULL,
    dealer_account_id INT DEFAULT NULL,
    purchase_date DATE NOT NULL,
    warranty_expiry_date DATE NOT NULL,
    warranty_status VARCHAR(20) NOT NULL DEFAULT 'Active'
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS opportunities (
    id INT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    vertical_id INT NOT NULL,
    account_id INT NOT NULL,
    stage VARCHAR(40) NOT NULL,
    deal_value_pkr BIGINT NOT NULL,
    expected_close_date DATE NOT NULL,
    cross_sell_flag TINYINT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS channel_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(40) NOT NULL UNIQUE,
    dealer_account_id INT NOT NULL,
    branch_name VARCHAR(120) NOT NULL,
    order_type VARCHAR(20) NOT NULL,
    total_amount_pkr BIGINT NOT NULL,
    payment_status VARCHAR(20) NOT NULL,
    order_status VARCHAR(20) NOT NULL,
    items JSON DEFAULT NULL,
    discount_pkr BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS technicians (
    id INT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    city VARCHAR(80) NOT NULL,
    phone VARCHAR(40) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'available',
    lat DECIMAL(10,6) NOT NULL,
    lng DECIMAL(10,6) NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS service_tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(40) NOT NULL UNIQUE,
    channel VARCHAR(30) NOT NULL,
    contact_id INT NOT NULL,
    asset_id INT DEFAULT NULL,
    issue_type VARCHAR(60) NOT NULL,
    assigned_technician_id INT DEFAULT NULL,
    sla_deadline DATETIME NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'Open',
    parts_used VARCHAR(255) DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    signature LONGTEXT DEFAULT NULL,
    warranty_verified TINYINT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME DEFAULT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS erp_settings (
    id INT PRIMARY KEY,
    provider VARCHAR(60) NOT NULL,
    last_sync DATETIME DEFAULT NULL,
    payload JSON DEFAULT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    action VARCHAR(80) NOT NULL,
    detail VARCHAR(255) DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS demo_usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(60) NOT NULL,
    day DATE NOT NULL,
    count INT NOT NULL DEFAULT 0,
    UNIQUE KEY uniq_usage (user_id, action, day)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];

export async function ensureSchema() {
  const db = getPool();
  for (const statement of SCHEMA) {
    await db.query(statement);
  }
  await seedData(db);
}

export async function withDb(fn) {
  const db = getPool();
  return fn(db);
}
