# Overview

A single-page React portfolio for Kartikey Choudhary. The site is fully static
at runtime; the only moving part is a Cloudflare Worker that accepts contact
form submissions.

## Architecture

```
┌───────────────────┐    POST /         ┌────────────────────────┐
│  React SPA        │ ────────────────▶ │  Cloudflare Worker     │
│  (static, Vite)   │   JSON + token    │  (workers/contact)     │
└───────────────────┘                   └─────────┬──────────────┘
        │                                         │
        │  Turnstile widget                       │ POST /siteverify
        ▼                                         ▼
┌───────────────────┐                   ┌────────────────────────┐
│ challenges.       │                   │ challenges.cloudflare  │
│ cloudflare.com    │                   │ /turnstile/v0/siteverify│
└───────────────────┘                   └─────────┬──────────────┘
                                                  │ success:true
                                                  ▼
                                        ┌────────────────────────┐
                                        │   Resend API           │
                                        │   → Gmail inbox        │
                                        └────────────────────────┘
```

## Stack

| Layer              | Choice                                       |
| ------------------ | -------------------------------------------- |
| UI framework       | React 18                                     |
| Build tool         | Vite 5 (`@vitejs/plugin-react`)              |
| Styling            | Plain CSS (`src/styles/globals.css`, `components.css`) |
| Serverless runtime | Cloudflare Workers                           |
| Bot protection     | Cloudflare Turnstile                         |
| Email delivery     | Resend                                       |
| Hosting            | Static `dist/` on any CDN                    |

## Configuration

All on-screen content lives in `src/config/environment.development.js` and
`environment.production.js`. Vite's `@env` alias picks the right file per
`--mode`. Every section exports an object with an `enabled` flag plus its data.

Public build-time values (Turnstile site key, Worker endpoint URL) live in
`.env` as `VITE_`-prefixed variables. Server-side secrets (`TURNSTILE_SECRET_KEY`,
`RESEND_API_KEY`) live only in the Cloudflare Worker environment, provisioned
via `wrangler secret put`.

## Rendering flow

1. `index.html` boots `src/main.jsx`.
2. `App.jsx` reads `@env`, sets body `data-accent` / `data-tex` / `data-timeline`
   attributes, and composes sections in order.
3. Each section reads its slice of the env config and short-circuits to `null`
   when `enabled === false`.
4. `NotificationProvider` exposes a global toast via `useNotify()`.

## Feature index

See [features.md](features.md) for the catalog of features and links to their
detailed specs.

## Security

See [security.md](security.md) for the cross-cutting security posture — secret
management, defense-in-depth layers, CI/CD controls, and rotation procedures.
