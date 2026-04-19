# Portfolio & Blog Webapp

React + Vite single-page portfolio. All on-screen content, feature flags, and
integration endpoints are driven from **per-environment config files** — no
CMS, no backend (beyond a single Cloudflare Worker for the contact form).

## Stack

- **Frontend:** React 18, Vite 5, plain CSS (no CSS framework)
- **Serverless:** Cloudflare Workers (contact form backend)
- **Bot protection:** Cloudflare Turnstile
- **Email delivery:** Resend API
- **Hosting target:** Cloudflare Pages (static `dist/`)
- **CI/CD:** GitHub Actions → Cloudflare Pages + Workers (see [docs/feature/deploy-pipeline.md](docs/feature/deploy-pipeline.md))

## Scripts

```bash
npm run dev        # vite --mode development  (loads environment.development.js)
npm run build      # vite --mode production   (loads environment.production.js)
npm run preview    # preview built dist/
```

## Directory tree

```
Portfolio/
├── CLAUDE.md
├── README.md
├── index.html
├── package.json
├── vite.config.js
├── .env.example                    # template for Turnstile site key + Worker URL
├── .github/workflows/
│   └── deploy.yml                  # Pages + Worker deploy on push to main
├── docs/
│   ├── overview.md                 # high-level architecture
│   ├── features.md                 # index of features (links to feature/*.md)
│   ├── security.md                 # secret model, defense-in-depth, CI posture
│   └── feature/
│       ├── serverless-contact-form.md
│       ├── deploy-pipeline.md
│       └── content-editor.md
├── public/assets/                  # favicon, résumé, portrait, OG image
├── src/
│   ├── main.jsx                    # React entry
│   ├── App.jsx                     # section composition + body data-attrs + #/editor route
│   ├── config/
│   │   ├── content.default.json    # shared portfolio content (round-trips via /#/editor)
│   │   ├── deepMerge.js            # env JS files + editor preview merge
│   │   ├── environment.development.js  # imports JSON + layers in dev overrides
│   │   ├── environment.production.js   # imports JSON + layers in prod overrides
│   │   └── ConfigContext.jsx       # ConfigProvider + useConfig() hook
│   ├── components/                 # Icon, Nav, Notifications (+ Turnstile)
│   ├── sections/                   # Hero, Skills, Experience, Education,
│   │                               # Projects, GitHub, Writing, Contact, Footer
│   ├── pages/
│   │   ├── Editor.jsx              # /#/editor page (form + live preview)
│   │   ├── FieldRenderer.jsx       # generic form renderer
│   │   └── editorState.js          # immutable path get/set/delete
│   ├── utils/
│   │   ├── formSubmit.js           # adapters: turnstile | lambda | gotify | custom | mock
│   │   ├── ddos.js                 # honeypot, min-time, rate-limit guards
│   │   └── richText.jsx
│   └── styles/                     # globals.css + components.css + editor.css
└── workers/
    └── contact/
        ├── worker.js               # Turnstile verify + Resend dispatch
        └── wrangler.toml
```

## Configuration model

Portfolio content lives in **`src/config/content.default.json`** — one file,
shared by dev and prod. The env JS files are thin overrides that deep-merge
environment-only bits on top:

| File                                  | What it adds on top of `content.default.json`                                                        |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `environment.development.js`          | `ENV_NAME`, dev title suffix, `contact.form.submission` (`mock`), `contact.form.ddos`, Turnstile keys |
| `environment.production.js`           | `ENV_NAME`, `contact.form.submission` (`turnstile`), `contact.form.ddos`, Turnstile keys             |

Vite's `@env` alias resolves to one of the env files based on `--mode`.
Sections read the merged config through `useConfig()`
([src/config/ConfigContext.jsx](src/config/ConfigContext.jsx)); the hook's
default value is the env config, so no provider wrapper is needed for normal
rendering.

Each section object carries an `enabled` flag — flipping it to `false` hides
the section entirely. Visual knobs (accent, texture, hero variant, timeline
layout) live under `site`.

### Editing content

Preferred: open **`/#/editor`** (in dev or any built copy) — a form-based
editor with live preview. Click **Download JSON** and replace
`src/config/content.default.json` with the download. Full spec in
[docs/feature/content-editor.md](docs/feature/content-editor.md).

Alternative: edit `content.default.json` directly. Either way, the env JS
files stay untouched for routine content changes.

### Secrets vs. public config

| Kind                    | Where                                         | Example                                       |
| ----------------------- | --------------------------------------------- | --------------------------------------------- |
| Public content          | `content.default.json`                        | headings, nav links, stack lists              |
| Env-specific config     | `environment.{development,production}.js`     | `contact.form.submission.type`, DDoS settings |
| Public build-time vars  | `.env` (prefixed `VITE_`)                     | `VITE_TURNSTILE_SITE_KEY`, `VITE_WORKER_URL`  |
| Server-side secrets     | Cloudflare Worker env (`wrangler secret put`) | `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`      |

Never commit `.env`. Never put server secrets in the env JS files or
`content.default.json` — all of these are bundled into the client. Full
security posture in [docs/security.md](docs/security.md).

## Contact form flow

`contact.form.submission.type` in `environment.*.js` selects the adapter:
`turnstile` (production), `lambda`, `gotify`, `custom`, or `mock` (local dev).
The `turnstile` adapter posts `{name, email, subject, message, token}` to the
Cloudflare Worker, which verifies the Turnstile token with Cloudflare's
`siteverify` API and then dispatches via Resend. See
[docs/feature/serverless-contact-form.md](docs/feature/serverless-contact-form.md).

# Important 
 -  Don't use co authored in git messages