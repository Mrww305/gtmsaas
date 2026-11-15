import crypto from "node:crypto";
import bcrypt from "bcryptjs";

const SESSION_DAYS = 7;

export function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function makeCode() {
  return String(crypto.randomInt(100000, 999999));
}

export function makeToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSession(db, userId) {
  const token = makeToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000);
  await db.query("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", [token, userId, expires]);
  return { token, expires };
}

export async function getSessionUser(db, token) {
  if (!token) return null;
  const [rows] = await db.query(
    `SELECT u.id, u.email, u.name, u.company, u.role, u.use_case, u.team_size,
            u.verified, u.onboarded, u.terms_accepted, u.created_at
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token = ? AND s.expires_at > UTC_TIMESTAMP() LIMIT 1`,
    [token]
  );
  return rows[0] || null;
}

export async function destroySession(db, token) {
  if (!token) return;
  await db.query("DELETE FROM sessions WHERE token = ?", [token]);
}

export function sessionCookie(token, expires) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires,
    path: "/",
  };
}

export function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    company: user.company,
    role: user.role,
    useCase: user.use_case,
    teamSize: user.team_size,
    verified: !!user.verified,
    onboarded: !!user.onboarded,
    termsAccepted: !!user.terms_accepted,
    createdAt: user.created_at,
  };
}
