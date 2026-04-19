# Contact Form Worker

Cloudflare Worker that validates a Turnstile token and relays the contact form
to Resend. See [../../docs/feature/serverless-contact-form.md](../../docs/feature/serverless-contact-form.md)
for the full spec.

## Deploy

```bash
npx wrangler login
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put RESEND_API_KEY
npx wrangler deploy
```

Edit `wrangler.toml` to set `ALLOWED_ORIGINS`, `MAIL_TO`, and `MAIL_FROM`
before deploying. Copy the deployed URL into the repo root `.env` as
`VITE_WORKER_URL`.

## Local dev

```bash
npx wrangler dev
```

Pair with `npm run dev` in the repo root.
