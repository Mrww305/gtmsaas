import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { getPool, ensureSchema } from "./db.js";
import {
  hashPassword,
  verifyPassword,
  makeCode,
  createSession,
  getSessionUser,
  destroySession,
  sessionCookie,
  publicUser,
} from "./auth.js";
import {
  mailStatus,
  sendVerificationCode,
  sendLeadNotification,
  sendWelcome,
} from "./mailer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const PORT = Number(process.env.PORT || 3000);
const DEMO_DAYS = Number(process.env.DEMO_DAYS || 14);

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "3mb" }));
app.use(cookieParser());

const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nowSql() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function addHours(h) {
  return new Date(Date.now() + h * 3600000).toISOString().slice(0, 19).replace("T", " ");
}

function normalizePhone(value = "") {
  const digits = String(value).replace(/\D/g, "");
  return digits.slice(-10);
}

const usageLimits = {
  ticket_create: 5,
  order_create: 5,
  cross_sell: 10,
  erp_sync: 10,
};

async function bumpUsage(db, userId, action) {
  const limit = usageLimits[action] ?? 10;
  await db.query(
    `INSERT INTO demo_usage (user_id, action, day, count) VALUES (?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE count = count + 1`,
    [userId, action, today()]
  );
  const [rows] = await db.query(
    "SELECT count FROM demo_usage WHERE user_id = ? AND action = ? AND day = ?",
    [userId, action, today()]
  );
  const used = rows[0]?.count || 0;
  return { ok: used <= limit, used, limit, remaining: Math.max(0, limit - used) };
}

async function logActivity(db, userId, action, detail) {
  await db.query("INSERT INTO activity_log (user_id, action, detail) VALUES (?, ?, ?)", [userId, action, detail || null]);
}

// --- simple in-memory rate limit for public endpoints ---
const buckets = new Map();
function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now > entry.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= max;
}

// --- auth middleware ---
const requireAuth = asyncRoute(async (req, res, next) => {
  const db = getPool();
  const user = await getSessionUser(db, req.cookies?.rw_session);
  if (!user) return res.status(401).json({ error: "Not signed in" });
  req.user = user;
  req.db = db;
  next();
});

const requireDemoAccess = asyncRoute(async (req, res, next) => {
  if (!req.user.verified) return res.status(403).json({ error: "Please verify your email first", code: "unverified" });
  if (!req.user.onboarded) return res.status(403).json({ error: "Complete onboarding first", code: "onboarding" });
  next();
});

// ============ AUTH ============
app.post("/api/auth/signup", asyncRoute(async (req, res) => {
  const db = getPool();
  const { name, email, password, company, role, terms } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: "Name, email and password are required" });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: "Enter a valid email" });
  if (String(password).length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
  if (!terms) return res.status(400).json({ error: "Please accept the demo terms" });
  if (!rateLimit(`signup:${req.ip}`, 8, 3600000)) return res.status(429).json({ error: "Too many signups from this IP. Try later." });

  const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email.toLowerCase()]);
  if (existing.length) return res.status(409).json({ error: "An account with this email already exists. Sign in instead." });

  const code = makeCode();
  const hash = await hashPassword(password);
  const [result] = await db.query(
    `INSERT INTO users (email, password_hash, name, company, role, verified, verify_code, verify_expires, terms_accepted)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?, 1)`,
    [email.toLowerCase(), hash, name, company || null, role || null, code, addHours(0.25)]
  );
  const mail = await sendVerificationCode(email, name, code);
  await logActivity(db, result.insertId, "signup", email);
  res.json({
    ok: true,
    email: email.toLowerCase(),
    mailSent: mail.sent,
    devCode: mail.sent ? undefined : code,
    message: mail.sent ? "Verification code sent to your email." : "SMTP is not configured; use the code shown.",
  });
}));

app.post("/api/auth/resend", asyncRoute(async (req, res) => {
  const db = getPool();
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "Email is required" });
  if (!rateLimit(`resend:${req.ip}`, 6, 3600000)) return res.status(429).json({ error: "Too many requests. Try later." });
  const [rows] = await db.query("SELECT id, name, verified FROM users WHERE email = ?", [email.toLowerCase()]);
  if (!rows.length) return res.status(404).json({ error: "No account found for that email" });
  if (rows[0].verified) return res.status(400).json({ error: "Email already verified. Please sign in." });
  const code = makeCode();
  await db.query("UPDATE users SET verify_code = ?, verify_expires = ? WHERE id = ?", [code, addHours(0.25), rows[0].id]);
  const mail = await sendVerificationCode(email, rows[0].name, code);
  res.json({ ok: true, mailSent: mail.sent, devCode: mail.sent ? undefined : code });
}));

app.post("/api/auth/verify", asyncRoute(async (req, res) => {
  const db = getPool();
  const { email, code } = req.body || {};
  if (!email || !code) return res.status(400).json({ error: "Email and code are required" });
  const [rows] = await db.query(
    "SELECT id, name, verify_code, verify_expires, verified, (verify_expires > UTC_TIMESTAMP()) AS code_valid FROM users WHERE email = ?",
    [email.toLowerCase()]
  );
  if (!rows.length) return res.status(404).json({ error: "Account not found" });
  const user = rows[0];
  if (user.verified) {
    const session = await createSession(db, user.id);
    res.cookie("rw_session", session.token, sessionCookie(session.token, session.expires));
    return res.json({ ok: true, verified: true });
  }
  if (!user.verify_code || user.verify_code !== String(code).trim()) return res.status(400).json({ error: "Incorrect code" });
  if (!user.code_valid) return res.status(400).json({ error: "Code expired. Resend a new one." });
  await db.query("UPDATE users SET verified = 1, verify_code = NULL, verify_expires = NULL WHERE id = ?", [user.id]);
  const session = await createSession(db, user.id);
  res.cookie("rw_session", session.token, sessionCookie(session.token, session.expires));
  await sendWelcome(email, user.name);
  await logActivity(db, user.id, "verified", email);
  res.json({ ok: true, verified: true });
}));

app.post("/api/auth/login", asyncRoute(async (req, res) => {
  const db = getPool();
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
  if (!rateLimit(`login:${req.ip}`, 20, 900000)) return res.status(429).json({ error: "Too many attempts. Try later." });
  const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email.toLowerCase()]);
  if (!rows.length) return res.status(401).json({ error: "Invalid email or password" });
  const user = rows[0];
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: "Invalid email or password" });
  if (!user.verified) return res.status(403).json({ error: "Please verify your email first", code: "unverified", email: user.email });
  const session = await createSession(db, user.id);
  await db.query("UPDATE users SET last_login = UTC_TIMESTAMP() WHERE id = ?", [user.id]);
  res.cookie("rw_session", session.token, sessionCookie(session.token, session.expires));
  res.json({ ok: true, user: publicUser(user) });
}));

app.post("/api/auth/logout", asyncRoute(async (req, res) => {
  await destroySession(getPool(), req.cookies?.rw_session);
  res.clearCookie("rw_session", { path: "/" });
  res.json({ ok: true });
}));

app.get("/api/auth/me", asyncRoute(async (req, res) => {
  const db = getPool();
  const user = await getSessionUser(db, req.cookies?.rw_session);
  if (!user) return res.status(401).json({ error: "Not signed in" });
  res.json({ user: publicUser(user), mail: mailStatus() });
}));

app.post("/api/auth/onboarding", requireAuth, asyncRoute(async (req, res) => {
  const { company, role, useCase, teamSize } = req.body || {};
  if (!company || !role) return res.status(400).json({ error: "Company and role are required" });
  await req.db.query(
    "UPDATE users SET company = ?, role = ?, use_case = ?, team_size = ?, onboarded = 1 WHERE id = ?",
    [company, role, useCase || null, teamSize || null, req.user.id]
  );
  const user = await getSessionUser(req.db, req.cookies.rw_session);
  res.json({ ok: true, user: publicUser(user) });
}));

// ============ LEADS ============
app.post("/api/leads", asyncRoute(async (req, res) => {
  const db = getPool();
  const { name, email, company, phone, message, source } = req.body || {};
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: "A valid email is required" });
  if (!rateLimit(`lead:${req.ip}`, 10, 3600000)) return res.status(429).json({ error: "Too many submissions. Please try later." });
  const meta = { ip: req.ip, ua: req.headers["user-agent"] || null };
  const [result] = await db.query(
    "INSERT INTO leads (name, email, company, phone, message, source, meta) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [name || null, email.toLowerCase(), company || null, phone || null, message || null, source || "website", JSON.stringify(meta)]
  );
  const mail = await sendLeadNotification({ name, email, company, phone, message, source });
  res.json({ ok: true, id: result.insertId, mailSent: mail.sent });
}));

// ============ DEMO DATA ============
app.get("/api/demo/bootstrap", requireAuth, requireDemoAccess, asyncRoute(async (req, res) => {
  const db = req.db;
  const [verticals] = await db.query("SELECT * FROM entity_verticals ORDER BY id");
  const [accounts] = await db.query("SELECT * FROM accounts ORDER BY id");
  const [contacts] = await db.query("SELECT * FROM contacts ORDER BY id");
  const [products] = await db.query("SELECT * FROM products ORDER BY id");
  const [assets] = await db.query(
    `SELECT a.*, p.name AS product_name, p.sku, p.category, p.unit_price_pkr,
            c.full_name AS owner_name, c.phone_whatsapp, c.city AS owner_city
       FROM customer_assets a
       JOIN products p ON p.id = a.product_id
       JOIN contacts c ON c.id = a.owner_contact_id
      ORDER BY a.id`
  );
  const [opportunities] = await db.query(
    `SELECT o.*, a.name AS account_name, a.city, v.name AS vertical_name
       FROM opportunities o JOIN accounts a ON a.id = o.account_id JOIN entity_verticals v ON v.id = o.vertical_id
      ORDER BY o.expected_close_date`
  );
  const [orders] = await db.query(
    `SELECT o.*, a.name AS account_name, a.tier, a.city
       FROM channel_orders o JOIN accounts a ON a.id = o.dealer_account_id
      ORDER BY o.created_at DESC LIMIT 50`
  );
  const [tickets] = await db.query(
    `SELECT t.*, c.full_name AS contact_name, c.phone_whatsapp, c.city,
            a.serial_number, p.name AS product_name,
            tech.name AS technician_name, tech.city AS technician_city
       FROM service_tickets t
       JOIN contacts c ON c.id = t.contact_id
       LEFT JOIN customer_assets a ON a.id = t.asset_id
       LEFT JOIN products p ON p.id = a.product_id
       LEFT JOIN technicians tech ON tech.id = t.assigned_technician_id
      ORDER BY t.created_at DESC LIMIT 60`
  );
  const [technicians] = await db.query("SELECT * FROM technicians ORDER BY id");
  const [erpRows] = await db.query("SELECT * FROM erp_settings WHERE id = 1");
  const [usage] = await db.query("SELECT action, count FROM demo_usage WHERE user_id = ? AND day = ?", [req.user.id, today()]);
  const [activity] = await db.query("SELECT * FROM activity_log WHERE user_id = ? ORDER BY id DESC LIMIT 12", [req.user.id]);

  const openTickets = tickets.filter((t) => t.status !== "Resolved").length;
  const resolvedTickets = tickets.filter((t) => t.status === "Resolved").length;
  const pipeline = opportunities.filter((o) => o.stage !== "Closed-Won").reduce((s, o) => s + Number(o.deal_value_pkr), 0);
  const won = opportunities.filter((o) => o.stage === "Closed-Won").reduce((s, o) => s + Number(o.deal_value_pkr), 0);
  const orderValue = orders.reduce((s, o) => s + Number(o.total_amount_pkr), 0);
  const creditExposure = accounts.reduce((s, a) => s + Number(a.current_balance_pkr), 0);
  const creditLimit = accounts.reduce((s, a) => s + Number(a.credit_limit_pkr), 0);
  const atRisk = accounts.filter((a) => Number(a.current_balance_pkr) / Math.max(1, Number(a.credit_limit_pkr)) >= 0.8).length;

  const revenueByVertical = verticals.map((v) => ({
    name: v.name,
    value: opportunities
      .filter((o) => o.vertical_id === v.id)
      .reduce((s, o) => s + Number(o.deal_value_pkr), 0),
  }));

  const ticketStatus = ["Open", "Technician Dispatched", "Resolved"].map((s) => ({
    name: s,
    value: tickets.filter((t) => t.status === s).length,
  }));

  const orderTrend = orders
    .slice(0, 8)
    .reverse()
    .map((o) => ({ name: o.order_number.slice(-4), value: Math.round(Number(o.total_amount_pkr) / 100000) }));

  res.json({
    user: publicUser(req.user),
    meta: { demoDays: DEMO_DAYS, today: today(), mail: mailStatus() },
    verticals, accounts, contacts, products, assets, opportunities, orders, tickets, technicians,
    erp: erpRows[0] || null,
    usage,
    activity,
    metrics: {
      pipeline, won, orderValue, creditExposure, creditLimit, atRisk,
      openTickets, resolvedTickets, totalTickets: tickets.length,
      crossSell: opportunities.filter((o) => o.cross_sell_flag).length,
      accounts: accounts.length,
      revenueByVertical,
      ticketStatus,
      orderTrend,
    },
  });
}));

// Flow 1 — WhatsApp warranty + dispatch
app.post("/api/demo/tickets/whatsapp", requireAuth, requireDemoAccess, asyncRoute(async (req, res) => {
  const db = req.db;
  const { phone, message, issueType } = req.body || {};
  if (!phone) return res.status(400).json({ error: "Customer phone number is required" });
  const quota = await bumpUsage(db, req.user.id, "ticket_create");
  if (!quota.ok) return res.status(429).json({ error: `Daily demo limit reached (${quota.limit} tickets).`, quota });

  const [contacts] = await db.query("SELECT * FROM contacts WHERE contact_type = 'End Consumer'");
  const target = normalizePhone(phone);
  const contact = contacts.find((c) => normalizePhone(c.phone_whatsapp) === target);
  if (!contact) return res.status(404).json({ error: "No customer found for that WhatsApp number. Try +92 300 1234567." });

  const [assets] = await db.query(
    `SELECT a.*, p.name AS product_name, p.sku, p.category, p.unit_price_pkr
       FROM customer_assets a JOIN products p ON p.id = a.product_id
      WHERE a.owner_contact_id = ? ORDER BY a.warranty_status = 'Active' DESC, a.id LIMIT 1`,
    [contact.id]
  );
  const asset = assets[0] || null;
  const warrantyActive = asset ? new Date(asset.warranty_expiry_date).getTime() >= Date.now() : false;

  const [techs] = await db.query("SELECT * FROM technicians WHERE city = ? AND status = 'available' ORDER BY id LIMIT 1", [contact.city]);
  const technician = techs[0] || null;

  const issue = issueType || (message && /cool/i.test(message) ? "Cooling Issue" : "General Service");
  const [maxRows] = await db.query("SELECT COALESCE(MAX(id),0) AS m FROM service_tickets");
  const ticketNumber = `TCK-${new Date().getFullYear()}-${2200 + Number(maxRows[0].m) + 1}`;
  const slaHours = issue === "Cooling Issue" ? 4 : issue === "Gas Refill" ? 8 : 24;
  const [result] = await db.query(
    `INSERT INTO service_tickets
      (ticket_number, channel, contact_id, asset_id, issue_type, assigned_technician_id, sla_deadline, status, warranty_verified, notes)
     VALUES (?, 'WhatsApp', ?, ?, ?, ?, ?, ?, ?, ?)`,
    [ticketNumber, contact.id, asset?.id || null, issue, technician?.id || null, addHours(slaHours), technician ? "Technician Dispatched" : "Open", warrantyActive ? 1 : 0, message || null]
  );
  if (technician) await db.query("UPDATE technicians SET status = 'on_job' WHERE id = ?", [technician.id]);
  await logActivity(db, req.user.id, "ticket.whatsapp", `${ticketNumber} · ${contact.full_name}`);

  res.json({
    ok: true,
    quota,
    contact,
    asset,
    product: asset ? { name: asset.product_name, sku: asset.sku, category: asset.category } : null,
    warranty: {
      active: warrantyActive,
      expiry: asset?.warranty_expiry_date || null,
      serial: asset?.serial_number || null,
    },
    ticket: {
      id: result.insertId,
      ticket_number: ticketNumber,
      channel: "WhatsApp",
      issue_type: issue,
      status: technician ? "Technician Dispatched" : "Open",
      sla_deadline: addHours(slaHours),
      technician,
    },
    technician,
  });
}));

app.post("/api/demo/tickets/:id/dispatch", requireAuth, requireDemoAccess, asyncRoute(async (req, res) => {
  const db = req.db;
  const { technicianId } = req.body || {};
  const [tickets] = await db.query("SELECT * FROM service_tickets WHERE id = ?", [req.params.id]);
  if (!tickets.length) return res.status(404).json({ error: "Ticket not found" });
  const [techs] = await db.query("SELECT * FROM technicians WHERE id = ?", [technicianId]);
  if (!techs.length) return res.status(400).json({ error: "Select a valid technician" });
  await db.query("UPDATE service_tickets SET assigned_technician_id = ?, status = 'Technician Dispatched' WHERE id = ?", [technicianId, req.params.id]);
  await db.query("UPDATE technicians SET status = 'on_job' WHERE id = ?", [technicianId]);
  await logActivity(db, req.user.id, "ticket.dispatch", `#${req.params.id} → ${techs[0].name}`);
  res.json({ ok: true, technician: techs[0], status: "Technician Dispatched" });
}));

app.post("/api/demo/tickets/:id/resolve", requireAuth, requireDemoAccess, asyncRoute(async (req, res) => {
  const db = req.db;
  const { signature, notes, partsUsed } = req.body || {};
  const [tickets] = await db.query("SELECT * FROM service_tickets WHERE id = ?", [req.params.id]);
  if (!tickets.length) return res.status(404).json({ error: "Ticket not found" });
  if (!signature) return res.status(400).json({ error: "Customer signature is required to close the job" });
  await db.query(
    "UPDATE service_tickets SET status = 'Resolved', resolved_at = UTC_TIMESTAMP(), signature = ?, notes = ?, parts_used = ? WHERE id = ?",
    [signature, notes || null, partsUsed || null, req.params.id]
  );
  if (tickets[0].assigned_technician_id) {
    await db.query("UPDATE technicians SET status = 'available' WHERE id = ?", [tickets[0].assigned_technician_id]);
  }
  await logActivity(db, req.user.id, "ticket.resolve", `#${req.params.id}`);
  res.json({ ok: true, status: "Resolved" });
}));

// Flow 2 — Dealer order + credit check + promo
app.post("/api/demo/orders", requireAuth, requireDemoAccess, asyncRoute(async (req, res) => {
  const db = req.db;
  const { dealerAccountId, items, paymentStatus } = req.body || {};
  if (!dealerAccountId || !Array.isArray(items) || !items.length) return res.status(400).json({ error: "Select a dealer and at least one product" });
  const quota = await bumpUsage(db, req.user.id, "order_create");
  if (!quota.ok) return res.status(429).json({ error: `Daily demo limit reached (${quota.limit} orders).`, quota });

  const [accounts] = await db.query("SELECT * FROM accounts WHERE id = ?", [dealerAccountId]);
  if (!accounts.length) return res.status(404).json({ error: "Dealer not found" });
  const account = accounts[0];

  const ids = items.map((i) => Number(i.productId));
  const [products] = await db.query("SELECT * FROM products WHERE id IN (?)", [ids]);
  const lines = items.map((i) => {
    const product = products.find((p) => p.id === Number(i.productId));
    const qty = Math.max(1, Number(i.qty) || 1);
    return { product, qty, lineTotal: product ? Number(product.unit_price_pkr) * qty : 0 };
  }).filter((l) => l.product);
  if (!lines.length) return res.status(400).json({ error: "No valid products selected" });

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const promoRate = subtotal >= 1000000 ? 0.075 : 0;
  const discount = Math.round(subtotal * promoRate);
  const total = subtotal - discount;

  const available = Number(account.credit_limit_pkr) - Number(account.current_balance_pkr);
  if (paymentStatus === "Credit" && total > available) {
    return res.status(409).json({
      error: "Credit limit exceeded",
      code: "credit_limit",
      account,
      subtotal, discount, total,
      credit: { limit: Number(account.credit_limit_pkr), balance: Number(account.current_balance_pkr), available, shortfall: total - available },
    });
  }

  const [maxRows] = await db.query("SELECT COALESCE(MAX(id),0) AS m FROM channel_orders");
  const orderNumber = `SO-${new Date().getFullYear()}-${1050 + Number(maxRows[0].m) + 1}`;
  const [result] = await db.query(
    `INSERT INTO channel_orders (order_number, dealer_account_id, branch_name, order_type, total_amount_pkr, payment_status, order_status, items, discount_pkr)
     VALUES (?, ?, ?, 'Secondary', ?, ?, 'Dispatched', ?, ?)`,
    [orderNumber, account.id, account.name, total, paymentStatus || "Paid", JSON.stringify(lines.map((l) => ({ sku: l.product.sku, name: l.product.name, qty: l.qty, price: Number(l.product.unit_price_pkr) }))), discount]
  );
  if (paymentStatus === "Credit") {
    await db.query("UPDATE accounts SET current_balance_pkr = current_balance_pkr + ? WHERE id = ?", [total, account.id]);
  }
  await logActivity(db, req.user.id, "order.create", `${orderNumber} · ${account.name}`);
  res.json({
    ok: true,
    quota,
    order: { id: result.insertId, order_number: orderNumber, total_amount_pkr: total, discount_pkr: discount, payment_status: paymentStatus || "Paid", order_status: "Dispatched", items: lines },
    pricing: { subtotal, promoRate, discount, total },
    credit: { limit: Number(account.credit_limit_pkr), balance: Number(account.current_balance_pkr), available, after: paymentStatus === "Credit" ? available - total : available },
  });
}));

// Flow 3 — Cross-vertical bundle suggestion
app.post("/api/demo/opportunities/:id/cross-sell", requireAuth, requireDemoAccess, asyncRoute(async (req, res) => {
  const db = req.db;
  const quota = await bumpUsage(db, req.user.id, "cross_sell");
  if (!quota.ok) return res.status(429).json({ error: `Daily demo limit reached (${quota.limit} suggestions).`, quota });

  const [rows] = await db.query(
    `SELECT o.*, a.name AS account_name, a.account_type, a.city, v.name AS vertical_name
       FROM opportunities o JOIN accounts a ON a.id = o.account_id JOIN entity_verticals v ON v.id = o.vertical_id
      WHERE o.id = ?`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: "Opportunity not found" });
  const opp = rows[0];

  const [products] = await db.query("SELECT * FROM products WHERE id IN (6, 7, 8, 10)");
  const ac = products.find((p) => p.id === 6);
  const truck = products.find((p) => p.id === 7);
  const heavyTruck = products.find((p) => p.id === 8);
  const warehouse = products.find((p) => p.id === 10);

  const bundle = [];
  const push = (product, qty, reason) => {
    if (!product) return;
    bundle.push({ productId: product.id, sku: product.sku, name: product.name, qty, unitPrice: Number(product.unit_price_pkr), lineTotal: Number(product.unit_price_pkr) * qty, reason });
  };

  if (opp.vertical_id === 2) {
    push(ac, 40, "Cooling for the new facility footprint");
    push(warehouse, 1, "Industrial storage attached to the JW-SEZ plot");
    push(truck, 2, "Forland fleet for intra-zone logistics");
  } else if (opp.vertical_id === 3) {
    push(heavyTruck, 4, "Fleet expansion matched to the current Forland order");
    push(ac, 20, "Driver facilities and site offices");
  } else {
    push(ac, 25, "Seasonal cooling bundle for channel partners");
    push(truck, 1, "Delivery fleet for secondary distribution");
  }

  const bundleValue = bundle.reduce((s, b) => s + b.lineTotal, 0);
  await db.query("UPDATE opportunities SET cross_sell_flag = 1 WHERE id = ?", [opp.id]);
  await logActivity(db, req.user.id, "opportunity.crosssell", `#${opp.id} · ${opp.account_name}`);

  res.json({
    ok: true,
    quota,
    opportunity: opp,
    rationale: `${opp.account_name} is a ${opp.account_type} in ${opp.city}. ${opp.vertical_name} deals typically attach cooling, logistics and storage.`,
    confidence: opp.vertical_id === 2 ? 0.87 : 0.72,
    bundle,
    bundleValue,
    combinedValue: Number(opp.deal_value_pkr) + bundleValue,
  });
}));

// Flow 4 — ERP sync simulator
const ERP_PROVIDERS = ["SAP S/4HANA", "Oracle NetSuite", "MS Dynamics 365"];
app.post("/api/demo/erp/sync", requireAuth, requireDemoAccess, asyncRoute(async (req, res) => {
  const db = req.db;
  const { provider } = req.body || {};
  if (!ERP_PROVIDERS.includes(provider)) return res.status(400).json({ error: "Choose a supported ERP provider" });
  const quota = await bumpUsage(db, req.user.id, "erp_sync");
  if (!quota.ok) return res.status(429).json({ error: `Daily demo limit reached (${quota.limit} syncs).`, quota });

  const now = new Date();
  const ts = (offsetSec) => new Date(now.getTime() - offsetSec * 1000).toISOString();
  const events = [
    { ts: ts(4), type: "invoice.sync", status: "success", ref: "INV-2026-10482", detail: "Sales invoice posted to AR ledger", amountPkr: 1850000 },
    { ts: ts(3), type: "inventory.reserve", status: "success", ref: "WH-LHR-01", detail: "18 × ENV-AC-15INV reserved for SO-2026-1051" },
    { ts: ts(2), type: "customer.master", status: "success", ref: "CUST-8841", detail: "Customer + credit profile upserted" },
    { ts: ts(1), type: "gl.posting", status: "success", ref: "GL-2026-11", detail: "Revenue and COGS journals balanced" },
    { ts: ts(0), type: "webhook.ack", status: "success", ref: provider, detail: "Connector acknowledged — queue drained" },
  ];
  const payload = {
    provider,
    direction: "bi-directional",
    endpoint: provider === "SAP S/4HANA" ? "/sap/opu/odata/sap/API_SALES_ORDER_SRV" : provider === "Oracle NetSuite" ? "/services/rest/record/v1/salesOrder" : "/api/data/v9.2/salesorders",
    events,
    summary: { records: 5, failed: 0, durationMs: 842 },
  };
  await db.query("UPDATE erp_settings SET provider = ?, last_sync = UTC_TIMESTAMP(), payload = ? WHERE id = 1", [provider, JSON.stringify(payload)]);
  await logActivity(db, req.user.id, "erp.sync", provider);
  res.json({ ok: true, quota, ...payload, syncedAt: now.toISOString() });
}));

app.get("/api/health", asyncRoute(async (req, res) => {
  let dbOk = false;
  try {
    const [rows] = await getPool().query("SELECT 1 AS ok");
    dbOk = rows[0].ok === 1;
  } catch {}
  res.json({ ok: true, db: dbOk, mail: mailStatus(), time: new Date().toISOString() });
}));

// ============ STATIC ============
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST, { index: false, maxAge: "1h" }));
}
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  const index = path.join(DIST, "index.html");
  if (fs.existsSync(index)) return res.sendFile(index);
  res.status(404).send("Build not found. Run npm run build.");
});

app.use((err, req, res, next) => {
  console.error("[api:error]", err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

async function start() {
  try {
    await ensureSchema();
    console.log("[db] schema ready");
  } catch (error) {
    console.error("[db] init failed:", error.message);
  }
  app.listen(PORT, () => {
    console.log(`[server] listening on :${PORT}`);
    console.log(`[mail] ${JSON.stringify(mailStatus())}`);
  });
}

start();
