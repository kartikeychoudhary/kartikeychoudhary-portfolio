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

Client-side guards in [src/utils/ddos.js](../../src/utils/ddos.js) still run
before the submit request:

- **Honeypot** — hidden input; filled = silently rejected.
- **Min time-to-submit** — blocks instant POSTs.
- **Per-browser rate limit** — N submissions per window in `localStorage`.

Turnstile is the primary bot filter; these guards catch trivial spam before
burning Worker invocations.
