// Cloudflare Worker: contact form relay.
// Flow: CORS preflight → validate payload → Turnstile siteverify → Resend dispatch.
//
// Secrets (wrangler secret put):
//   TURNSTILE_SECRET_KEY
//   RESEND_API_KEY
// Vars (wrangler.toml [vars]):
//   ALLOWED_ORIGINS   comma-separated list, e.g. "https://example.com,http://localhost:5173"
//   MAIL_TO           destination inbox
//   MAIL_FROM         verified Resend sender, e.g. "contact@yourdomain.com"

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const RESEND_URL = "https://api.resend.com/emails";

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = allowedOrigin(origin, env.ALLOWED_ORIGINS);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(allowed) });
    }
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { Allow: "POST, OPTIONS", ...corsHeaders(allowed) },
      });
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400, allowed);
    }

    const { name, email, subject, message, token } = payload || {};
    if (!name || !email || !subject || !message || !token) {
      return json({ error: "Invalid payload" }, 400, allowed);
    }

    const verified = await verifyTurnstile(token, request, env);
    if (!verified) return json({ error: "Bot verification failed" }, 403, allowed);

    try {
      await sendEmail({ name, email, subject, message }, env);
    } catch (err) {
      return json({ error: err.message || "Email dispatch failed" }, 500, allowed);
    }

    return json({ success: true }, 200, allowed);
  },
};

function allowedOrigin(origin, allowedList) {
  const list = (allowedList || "").split(",").map((s) => s.trim()).filter(Boolean);
  return list.includes(origin) ? origin : list[0] || "";
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

async function verifyTurnstile(token, request, env) {
  const body = new FormData();
  body.append("secret", env.TURNSTILE_SECRET_KEY);
  body.append("response", token);
  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) body.append("remoteip", ip);

  const res = await fetch(SITEVERIFY, { method: "POST", body });
  if (!res.ok) return false;
  const data = await res.json();
  return Boolean(data.success);
}

async function sendEmail({ name, email, subject, message }, env) {
  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.5;max-width:560px">
      <h2 style="margin:0 0 12px">Portfolio contact: ${esc(subject)}</h2>
      <p><strong>From:</strong> ${esc(name)} &lt;${esc(email)}&gt;</p>
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
      <div style="white-space:pre-wrap">${esc(message)}</div>
    </div>`;

  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: env.MAIL_TO,
      reply_to: email,
      subject: `Portfolio · ${subject}`,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
