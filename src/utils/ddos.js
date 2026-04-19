// Client-side DDoS / spam guards for the contact form.
//   - Honeypot: a hidden input. Bots fill everything, humans don't.
//   - Min time-to-submit: humans take ≥ N ms to fill the form; bots POST instantly.
//   - Rate limit: N submissions per window, tracked per-browser via localStorage.
//
// NOTE: client-side only — deterministic bots can bypass this. Pair with a
// server-side check (WAF, Gateway rate limit, hCaptcha, etc.) if threat model
// demands it. These guards block the vast majority of casual spam cheaply.

const RATE_KEY = "__contact_rate_log__";

export function checkHoneypot(values, fieldName) {
  const v = values[fieldName];
  return !v; // ok when empty
}

export function checkMinTime(mountedAt, minMs) {
  return Date.now() - mountedAt >= minMs;
}

function readLog() {
  try {
    return JSON.parse(localStorage.getItem(RATE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeLog(log) {
  try {
    localStorage.setItem(RATE_KEY, JSON.stringify(log));
  } catch {
    /* storage disabled — skip */
  }
}

export function checkRateLimit({ maxPerWindow = 3, windowMs = 10 * 60 * 1000 } = {}) {
  const now = Date.now();
  const log = readLog().filter((t) => now - t < windowMs);
  if (log.length >= maxPerWindow) {
    const wait = Math.ceil((windowMs - (now - log[0])) / 1000);
    return { allowed: false, retryAfterSec: wait };
  }
  return { allowed: true, count: log.length };
}

export function recordSubmission() {
  const now = Date.now();
  const log = readLog();
  log.push(now);
  writeLog(log);
}
