import nodemailer from "nodemailer";

let transporter = null;

function smtpConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter() {
  if (!transporter && smtpConfigured()) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.hostinger.com",
      port: Number(process.env.SMTP_PORT || 465),
      secure: String(process.env.SMTP_PORT || "465") === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export function mailStatus() {
  return {
    configured: smtpConfigured(),
    host: process.env.SMTP_HOST || "smtp.hostinger.com",
    user: process.env.SMTP_USER || null,
    notify: process.env.NOTIFY_EMAIL || "ceo@sajidafridi.com",
  };
}

async function send({ to, subject, html, replyTo }) {
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || "no-reply@gtmsaas.sajidafridi.com";
  const tx = getTransporter();
  if (!tx) {
    console.log(`[mail:skipped] SMTP not configured. To=${to} Subject=${subject}`);
    return { sent: false, reason: "smtp_not_configured" };
  }
  try {
    const info = await tx.sendMail({ from, to, subject, html, replyTo });
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error("[mail:error]", error.message);
    return { sent: false, reason: error.message };
  }
}

export async function sendVerificationCode(email, name, code) {
  return send({
    to: email,
    subject: `Your JW × Enviro demo access code: ${code}`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px">
        <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#6366f1;font-weight:700">JW Corporation × Enviro Pakistan</div>
        <h1 style="font-size:26px;color:#0f172a;margin:12px 0 8px">Verify your demo account</h1>
        <p style="color:#475569;font-size:15px;line-height:1.6">Hi ${name || "there"}, use the code below to unlock the live Revenue OS demo. It expires in 15 minutes.</p>
        <div style="margin:28px 0;padding:20px;text-align:center;background:#0f172a;border-radius:12px;color:#fff;font-size:34px;letter-spacing:10px;font-weight:700">${code}</div>
        <p style="color:#64748b;font-size:13px">If you didn't request this, you can ignore this email.</p>
      </div>`,
  });
}

export async function sendLeadNotification(lead) {
  const rows = Object.entries(lead)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `<tr><td style="padding:6px 12px;color:#64748b;font-size:13px;text-transform:capitalize">${k}</td><td style="padding:6px 12px;color:#0f172a;font-size:14px;font-weight:600">${String(v).replace(/</g, "&lt;")}</td></tr>`)
    .join("");
  return send({
    to: process.env.NOTIFY_EMAIL || "ceo@sajidafridi.com",
    subject: `[JW × Enviro] New ${lead.source || "website"} lead — ${lead.name || lead.email}`,
    replyTo: lead.email,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:28px">
        <h2 style="color:#0f172a;margin:0 0 4px">New lead captured</h2>
        <p style="color:#64748b;font-size:14px;margin:0 0 20px">Source: ${lead.source || "website"} · ${new Date().toUTCString()}</p>
        <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:12px">${rows}</table>
        <p style="color:#94a3b8;font-size:12px;margin-top:20px">Sent from gtmsaas.sajidafridi.com</p>
      </div>`,
  });
}

export async function sendWelcome(email, name) {
  return send({
    to: email,
    subject: "Your JW × Enviro Revenue OS demo is ready",
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px">
        <h1 style="color:#0f172a">Welcome, ${name || "there"} 👋</h1>
        <p style="color:#475569;line-height:1.6">Your demo workspace is unlocked. Sign in to explore four live GTM and field-service flows across JW Corporation and Enviro Pakistan.</p>
        <p style="color:#475569;line-height:1.6">Demo access is limited to 14 days and daily action quotas apply.</p>
        <a href="${process.env.APP_URL || "https://gtmsaas.sajidafridi.com"}/demo/login" style="display:inline-block;margin-top:16px;padding:12px 22px;background:#4f46e5;color:#fff;border-radius:10px;text-decoration:none;font-weight:600">Open the demo</a>
      </div>`,
  });
}
