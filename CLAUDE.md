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
│       └── deploy-pipeline.md
├── public/assets/                  # favicon, résumé, portrait, OG image
├── src/
│   ├── main.jsx                    # React entry
│   ├── App.jsx                     # section composition + body data-attrs
│   ├── config/
│   │   ├── environment.development.js
│   │   └── environment.production.js
│   ├── components/                 # Icon, Nav, Notifications (+ Turnstile)
│   ├── sections/                   # Hero, Skills, Experience, Education,
│   │                               # Projects, GitHub, Writing, Contact, Footer
│   ├── utils/
│   │   ├── formSubmit.js           # adapters: turnstile | lambda | gotify | custom | mock
│   │   ├── ddos.js                 # honeypot, min-time, rate-limit guards
│   │   └── richText.jsx
│   └── styles/                     # globals.css + components.css
└── workers/
    └── contact/
        ├── worker.js               # Turnstile verify + Resend dispatch
        └── wrangler.toml
```

## Configuration model

Vite's `@env` alias resolves to one of two files based on `--mode`:

| Mode          | Resolves `@env` to                        |
| ------------- | ----------------------------------------- |
| `development` | `src/config/environment.development.js`   |
| `production`  | `src/config/environment.production.js`    |

Every section (`hero`, `skills`, `experience`, …) exports an object with an
`enabled` flag plus its own content. Flipping `enabled: false` hides the
section entirely. Visual knobs (accent, texture, hero variant, timeline layout)
live under `site`.

### Secrets vs. public config

| Kind                    | Where                                  | Example                          |
| ----------------------- | -------------------------------------- | -------------------------------- |
| Public content          | `environment.*.js`                     | headings, nav links, stack lists |
| Public build-time vars  | `.env` (prefixed `VITE_`)              | `VITE_TURNSTILE_SITE_KEY`, `VITE_WORKER_URL` |
| Server-side secrets     | Cloudflare Worker env (`wrangler secret put`) | `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY` |

Never commit `.env`. Never put server secrets in `environment.*.js` — those
files are bundled into the client. Full security posture in
[docs/security.md](docs/security.md).

## Contact form flow

`contact.form.submission.type` in `environment.*.js` selects the adapter:
`turnstile` (production), `lambda`, `gotify`, `custom`, or `mock` (local dev).
The `turnstile` adapter posts `{name, email, subject, message, token}` to the
Cloudflare Worker, which verifies the Turnstile token with Cloudflare's
`siteverify` API and then dispatches via Resend. See
[docs/feature/serverless-contact-form.md](docs/feature/serverless-contact-form.md).

# Important 
 -  Don't use co authored in git messages