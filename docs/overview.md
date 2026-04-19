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

Content and environment are separated:

- `src/config/content.default.json` is the single source of truth for
  on-screen content (sections, profile, assets, links). Edit it directly, or
  use the in-app editor at [`/#/editor`](feature/content-editor.md) which
  round-trips this file as JSON.
- `src/config/environment.development.js` / `environment.production.js`
  import the JSON and deep-merge in environment-only bits: `ENV_NAME`, the
  contact-form submission adapter (`mock` in dev, `turnstile` in prod), its
  endpoints, and DDoS guard settings. Vite's `@env` alias resolves to the
  right file per `--mode`.

Sections consume the merged config through `useConfig()` (see
`src/config/ConfigContext.jsx`). The hook's default value is the env config,
so no provider is required for normal rendering; the editor wraps its preview
subtree with a `ConfigProvider` that overrides the value with edited content.

Public build-time values (Turnstile site key, Worker endpoint URL) live in
`.env` as `VITE_`-prefixed variables and are injected by the env JS files at
build time. Server-side secrets (`TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`)
live only in the Cloudflare Worker environment, provisioned via
`wrangler secret put`.

## Rendering flow

1. `index.html` boots `src/main.jsx`.
2. `App.jsx` reads the config via `useConfig()`. If `window.location.hash`
   starts with `#/editor`, it mounts the editor page; otherwise it sets body
   `data-accent` / `data-tex` / `data-timeline` attributes and composes the
   sections in order.
3. Each section reads its slice of the config via `useConfig()` and
   short-circuits to `null` when `enabled === false`.
4. `NotificationProvider` exposes a global toast via `useNotify()`.

## Feature index

See [features.md](features.md) for the catalog of features and links to their
detailed specs.

## Security

See [security.md](security.md) for the cross-cutting security posture — secret
management, defense-in-depth layers, CI/CD controls, and rotation procedures.
