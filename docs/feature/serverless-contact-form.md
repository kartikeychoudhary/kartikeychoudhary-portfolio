# Serverless Contact Form

**Status:** Shipped · **Author:** Kartikey Choudhary · **Date:** 2026-04-19

## Objective

Deliver a highly available, near-zero-cost contact form that captures inquiries,
resists bot spam and DDoS, and routes messages to a Gmail inbox.

## Architecture

```
React ─► Turnstile (client) ─► Cloudflare Worker ─► siteverify ─► Resend ─► Gmail
```

- **Frontend:** React form in [src/sections/Contact.jsx](../../src/sections/Contact.jsx)
- **Bot protection:** Cloudflare Turnstile (invisible/managed widget)
- **Backend:** Cloudflare Worker at [workers/contact/worker.js](../../workers/contact/worker.js)
- **Email:** Resend API → designated Gmail inbox

## Functional requirements

| ID   | Requirement                                                                |
| ---- | -------------------------------------------------------------------------- |
| FR-1 | Form captures Name, Email, Subject, Message.                               |
| FR-2 | All fields required before submission.                                     |
| FR-3 | Turnstile widget renders on the contact section.                           |
| FR-4 | Frontend blocks submit until a Turnstile token is present.                 |
| FR-5 | Worker verifies the token against Cloudflare `siteverify` before sending.  |
| FR-6 | On success, Worker dispatches an HTML email via Resend.                    |
| FR-7 | UI shows clear success/error states.                                       |
| FR-8 | Form clears on successful submission.                                      |

## Non-functional requirements

- **Performance:** Worker execution under 50 ms (excluding external calls).
- **Security:** Worker enforces CORS to the configured origin(s) only.
- **Availability:** DDoS mitigation inherited from Cloudflare's edge.
- **Cost:** Stays within Workers free tier (100k req/day) and Resend free tier
  (3k emails/month).

## Flow

1. User loads the contact page. Turnstile script is injected on demand and the
   widget renders inside the form.
2. User fills the form. On Turnstile success, the token is stashed in React state.
3. Client-side guards run: honeypot, min time-to-submit, per-browser rate limit.
4. Frontend `POST`s `{name, email, subject, message, token}` to the Worker.
5. Worker handles the CORS preflight (`OPTIONS`), then the `POST`:
   - Validates payload shape and Origin.
   - Verifies the Turnstile token against `siteverify`.
   - On success, posts an HTML email to Resend.
6. Worker returns `200 {success:true}` or an error; UI reacts.

## API contract (Frontend → Worker)

**Route:** `POST {VITE_WORKER_URL}`

**Request headers:**

| Header          | Value                 |
| --------------- | --------------------- |
| `Content-Type`  | `application/json`    |
| `Origin`        | Frontend domain       |

**Request body:**

| Field     | Type   | Required |
| --------- | ------ | -------- |
| `name`    | string | yes      |
| `email`   | string | yes      |
| `subject` | string | yes      |
| `message` | string | yes      |
| `token`   | string | yes      |

**Responses:**

| Status | Body                                        | Condition                                       |
| ------ | ------------------------------------------- | ----------------------------------------------- |
| 200    | `{ "success": true }`                       | Verified and queued via Resend.                 |
| 400    | `{ "error": "Invalid payload" }`            | Missing fields or malformed JSON.               |
| 403    | `{ "error": "Bot verification failed" }`    | Turnstile token invalid / expired / missing.    |
| 405    | `Method Not Allowed`                        | Non-POST/OPTIONS method.                        |
| 500    | `{ "error": "..." }`                        | Resend failure or unexpected exception.         |

## Configuration

### Frontend (Vite `.env`)

```
VITE_TURNSTILE_SITE_KEY=0x4AAAAAAA...
VITE_WORKER_URL=https://contact-form.<subdomain>.workers.dev
```

Copy `.env.example` to `.env` and populate before running `npm run dev` or
`npm run build`.

### Frontend config (`environment.*.js`)

```js
contact.form.submission = {
  type: "turnstile",
  turnstile: {
    siteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
    endpoint: import.meta.env.VITE_WORKER_URL,
  },
  // lambda/gotify/custom blocks retained for fallback
}
```

### Worker secrets (Cloudflare)

Set via `wrangler secret put` — never committed:

- `TURNSTILE_SECRET_KEY` — from the Turnstile dashboard.
- `RESEND_API_KEY` — from Resend dashboard.

### Worker vars (`wrangler.toml`)

- `ALLOWED_ORIGINS` — comma-separated origins allowed by CORS.
- `MAIL_TO` — destination Gmail address.
- `MAIL_FROM` — verified Resend sender (e.g. `contact@yourdomain.com`).

## Deployment

```bash
cd workers/contact
npx wrangler login
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put RESEND_API_KEY
npx wrangler deploy
```

Copy the deployed URL into `.env` as `VITE_WORKER_URL`, then `npm run build`.

## Defense in depth

Four layers, outermost first. Each stops a different attacker profile.

### 1. Client-side guards (`src/utils/ddos.js`)

Free, cheap, bypassable — meant to filter casual spam before burning Worker invocations.

- **Honeypot** — hidden input; filled = silently rejected.
- **Min time-to-submit** — blocks instant POSTs.
- **Per-browser rate limit** — N submissions per window in `localStorage`.

### 2. Turnstile token verification (Worker)

Primary bot gate. Every request must present a valid Turnstile token; the Worker verifies against Cloudflare's `siteverify` before dispatching email.

### 3. Worker-side input caps (`worker.js`)

Hard ceilings on payload size to bound resource use even if an attacker brings a valid Turnstile token:

| Check | Limit | Returns |
| --- | --- | --- |
| Total request body | 16 KB | `413` |
| `name` | 120 chars | `413` |
| `email` | 254 chars (RFC 5321) | `413` |
| `subject` | 200 chars | `413` |
| `message` | 5000 chars | `413` |
| `token` | 2048 chars | `413` |

Tune via the `LIMITS` / `MAX_BODY_BYTES` constants at the top of `worker.js`.

### 4. Cloudflare Rate Limiting Rule (recommended)

Turnstile tokens are effectively unlimited to motivated attackers (paid CAPTCHA solvers, headless browsers). A platform-level rate limit caps the damage — Resend's free tier is 3k emails/month and you don't want a single actor draining it.

**Prerequisite:** the Worker must be routed through a zone you own, not just `*.workers.dev`. Rate Limiting Rules only apply to zones.

#### Step 1 — Route the Worker through your zone

Assuming `kartikeychoudhary.com` is on Cloudflare, add a Worker Route:

Cloudflare dashboard → **Workers & Pages** → `portfolio-contact` → **Settings** → **Triggers** → **Add Custom Domain** → enter e.g. `contact.kartikeychoudhary.com`.

Cloudflare provisions DNS and the cert automatically. The Worker is now reachable at that host.

Update `VITE_WORKER_URL` (GitHub variable) and `ALLOWED_ORIGINS` (wrangler.toml `[vars]`) to the new URL, then redeploy.

#### Step 2 — Create the Rate Limiting Rule

Cloudflare dashboard → select the `kartikeychoudhary.com` zone → **Security** → **WAF** → **Rate limiting rules** → **Create rule**.

| Field | Value |
| --- | --- |
| Rule name | `contact-form-throttle` |
| If incoming requests match | Field: **Hostname** · Operator: `equals` · Value: `contact.kartikeychoudhary.com` |
| And | Field: **Request Method** · Operator: `equals` · Value: `POST` |
| When rate exceeds | `10` requests per `1 minute` |
| Counting characteristic | **IP address** (free plan) |
| Then | **Block** · Duration: `10 minutes` · Response: `429 Too Many Requests` |

Save & deploy. The free plan includes one rate-limiting rule per zone, which is enough for a single contact-form endpoint.

#### Tuning the thresholds

- Legit users submit once per visit; 10/min/IP is well above normal traffic and well below useful attack volume.
- If you run the site behind an office/campus NAT, raise the per-IP threshold or counter on a cookie/fingerprint instead.
- If you're on a paid plan, add a second rule that counts across all IPs toward a zone-wide ceiling (e.g. 100/min) as a cost cap.

#### Verification

```bash
# Should start returning 429 after the 10th hit within a minute.
for i in $(seq 1 15); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST https://contact.kartikeychoudhary.com \
    -H "Content-Type: application/json" \
    -d '{"name":"x","email":"x@x.x","subject":"x","message":"x","token":"x"}'
done
```

The first ~10 requests return `403` (bot verification — expected, the token is bogus), then requests start returning `429` from Cloudflare before even reaching the Worker.
