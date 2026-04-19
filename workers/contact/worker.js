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
//   SITE_URL          canonical site URL shown in the email footer
//   SITE_NAME         display name shown in the email header

import { renderContactEmail } from "./email.js";

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const RESEND_URL = "https://api.resend.com/emails";

const LIMITS = {
  name: 120,
  email: 254,      // RFC 5321 max localpart+domain
  subject: 200,
  message: 5000,
  token: 2048,     // Turnstile tokens are ~600 chars; give headroom
};
const MAX_BODY_BYTES = 16 * 1024;

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

    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return json({ error: "Payload too large" }, 413, allowed);
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return json({ error: "Invalid JSON" }, 400, allowed);
    }

    const { name, email, subject, message, token } = payload || {};
    if (!name || !email || !subject || !message || !token) {
      return json({ error: "Invalid payload" }, 400, allowed);
    }
    if (
      String(name).length > LIMITS.name ||
      String(email).length > LIMITS.email ||
      String(subject).length > LIMITS.subject ||
      String(message).length > LIMITS.message ||
      String(token).length > LIMITS.token
    ) {
      return json({ error: "Field exceeds maximum length" }, 413, allowed);
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
  const rendered = renderContactEmail({
    name,
    email,
    subject,
    message,
    sentAt: new Date(),
    siteUrl: env.SITE_URL || "https://kartikeychoudhary.com",
    siteName: env.SITE_NAME || "Kartikey Choudhary",
  });

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
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}
