# Portfolio & Blog Webapp

Personal portfolio site by Kartikey Choudhary — React + Vite, deployed to
Cloudflare Pages, with a serverless contact form powered by Cloudflare Workers
+ Turnstile + Resend.

- **Live architecture:** [docs/overview.md](docs/overview.md)
- **Feature specs:** [docs/features.md](docs/features.md)
- **Claude Code guide:** [CLAUDE.md](CLAUDE.md)

---

## 1. Prerequisites

| Tool              | Version                              |
| ----------------- | ------------------------------------ |
| Node.js           | ≥ 20                                 |
| npm               | ≥ 10 (bundled with Node 20)          |
| `gh` CLI          | latest — only if you're cloning via `gh repo clone` |
| `wrangler`        | invoked via `npx` — no global install needed |
| A Cloudflare account | free tier is enough             |
| A Resend account  | free tier is enough                  |

---

## 2. Clone and install

```bash
gh repo clone kartikeychoudhary/kartikeychoudhary-portfolio portfolio
cd portfolio
npm install
```

---

## 3. Configure environment variables

The contact form reads two public values at build time. Copy the template:

```bash
cp .env.example .env
```

Fill in `.env`:

```
VITE_TURNSTILE_SITE_KEY=0x4AAAAAAA_YOUR_SITE_KEY
VITE_WORKER_URL=https://portfolio-contact.YOUR_SUBDOMAIN.workers.dev
```

You get these values in steps 5 and 6. For local development you can run
against the mock adapter without them — the form logs to the console.

`.env` is git-ignored. Never commit it.

---

## 4. Run locally

```bash
npm run dev        # loads src/config/environment.development.js
```

Vite serves at `http://localhost:5173`. The contact form uses the `mock`
adapter in development by default — it prints the payload to the console
instead of hitting Resend.

Other scripts:

```bash
npm run build      # loads src/config/environment.production.js → writes dist/
npm run preview    # serves the built dist/ locally
```

---

## 5. Set up Cloudflare Turnstile

1. Sign in to <https://dash.cloudflare.com/?to=/:account/turnstile>.
2. **Add site** → widget mode **Managed** (recommended) or **Invisible**.
3. **Hostnames:** add `localhost` (for dev) and your production domain.
4. Copy the **Site key** → save as `VITE_TURNSTILE_SITE_KEY` in `.env`.
5. Copy the **Secret key** → you'll paste it into Cloudflare Worker secrets in step 6.

---

## 6. Set up Resend

1. Sign up at <https://resend.com>.
2. Dashboard → **API Keys** → create a key with **Sending access**. Copy it.
3. **Domains:**
   - For testing, use the default sender `onboarding@resend.dev` — no setup.
   - For production, add and verify your own domain (DKIM records).
4. Decide `MAIL_FROM` (verified sender) and `MAIL_TO` (destination inbox).

---

## 7. Deploy the Cloudflare Worker (contact form backend)

The Worker verifies Turnstile tokens and sends email via Resend.

```bash
cd workers/contact
npx wrangler login                           # opens browser
npx wrangler secret put TURNSTILE_SECRET_KEY  # paste the Turnstile secret
npx wrangler secret put RESEND_API_KEY       # paste the Resend API key
```

Edit [workers/contact/wrangler.toml](workers/contact/wrangler.toml):

```toml
[vars]
ALLOWED_ORIGINS = "http://localhost:5173,https://your-production-domain.example"
MAIL_TO         = "you@gmail.com"
MAIL_FROM       = "onboarding@resend.dev"      # or your verified sender
```

Deploy:

```bash
npx wrangler deploy
```

Wrangler prints a URL like `https://portfolio-contact.<subdomain>.workers.dev`.
**Copy that URL** — it becomes `VITE_WORKER_URL` in the next step.

---

## 8. Deploy the site to Cloudflare Pages (one-time)

Create the Pages project:

```bash
npx wrangler pages project create kartikey-portfolio --production-branch=main
```

Set `VITE_WORKER_URL` in `.env` to the Worker URL from step 7, then do a
first manual deploy to confirm everything works:

```bash
cd /path/to/repo-root
npm run build
npx wrangler pages deploy dist --project-name=kartikey-portfolio --branch=main
```

Visit the printed `*.pages.dev` URL. Submit the contact form. You should
receive an email at `MAIL_TO`.

---

## 9. Wire up CI/CD (GitHub Actions)

After the one-time manual deploy, all future pushes to `main` can deploy
automatically via [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

### Create a Cloudflare API token

Dashboard → **My Profile** → **API Tokens** → **Create Token** → **Custom**:

- **Permissions:**
  - Account → Cloudflare Pages → Edit
  - Account → Workers Scripts → Edit
- **Account resources:** include your account.

Copy the token.

Grab your **Account ID** from the right sidebar of the Workers & Pages
dashboard.

### Configure GitHub secrets and variables

Repo → **Settings** → **Secrets and variables** → **Actions**.

**Secrets** (sensitive — masked in logs):

| Name                    | Value                                 |
| ----------------------- | ------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Token created above.                  |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID.           |
| `TURNSTILE_SECRET_KEY`  | Turnstile secret key (from step 5).   |
| `RESEND_API_KEY`        | Resend API key (from step 6).         |

**Variables** (public — embedded in the client bundle):

| Name                       | Value                                     |
| -------------------------- | ----------------------------------------- |
| `VITE_TURNSTILE_SITE_KEY`  | Turnstile site key (from step 5).         |
| `VITE_WORKER_URL`          | Worker URL (from step 7).                 |

### Push to `main`

```bash
git init
git branch -M main
git add .
git commit -m "Initial portfolio site"
git remote add origin https://github.com/kartikeychoudhary/kartikeychoudhary-portfolio.git
git push -u origin main
```

The workflow runs automatically. Follow it under the **Actions** tab.

---

## 10. Edit content

All on-screen content lives in one file:

- [src/config/content.default.json](src/config/content.default.json) — shared by dev and prod.

The env files ([environment.development.js](src/config/environment.development.js)
and [environment.production.js](src/config/environment.production.js)) import
the JSON and only add environment-specific bits (`ENV_NAME`, contact-form
adapter type, endpoints, Turnstile keys).

### Option A — In-app editor (recommended)

Visit [`/#/editor`](http://localhost:5173/#/editor) while `npm run dev` is
running (the route is also available on the production build). You get a
section-by-section form with live preview, **Load JSON** / **Reset** /
**Download JSON** actions.

Workflow:

1. Edit fields in the form.
2. Click **Download JSON**.
3. Replace `src/config/content.default.json` with the downloaded file.
4. Commit and push — CI rebuilds.

Full spec in [docs/feature/content-editor.md](docs/feature/content-editor.md).

### Option B — Edit the JSON directly

Every section object carries an `enabled` flag (`false` hides it entirely):

```json
{
  "skills": {
    "enabled": true,
    "eyebrow": "01 — What I work with",
    "heading": { "before": "A stack chosen for ", "serif": "longevity", "after": ", not novelty." }
  }
}
```

`heading.serif` renders in an italic serif accent. `hero.lead` supports
`**bold**` markers.

### Visual tweaks

Under `site` in `content.default.json`:

```json
{
  "site": {
    "accent": "teal",
    "texture": "grid",
    "heroVariant": "split",
    "timelineLayout": "horizontal-dots"
  }
}
```

- `accent`: `teal | lime | violet | amber | emerald | rose`
- `texture`: `grid | dots | noise | none`
- `heroVariant`: `split | terminal | centered`
- `timelineLayout`: `horizontal-dots | rail-cards | stepper`

### Assets

Drop files into `public/assets/` and reference them in `content.default.json`:

```json
{
  "assets": {
    "favicon":  "/assets/favicon.svg",
    "resume":   "/assets/resume.pdf",
    "portrait": { "src": "/assets/avatar-1024.jpg" },
    "ogImage":  "/assets/og.png"
  }
}
```

---

## 11. Contact form adapters

`contact.form.submission.type` in the env JS files (not `content.default.json`)
picks how submissions are delivered:

| Type        | Behavior                                                                |
| ----------- | ----------------------------------------------------------------------- |
| `turnstile` | POSTs to the Cloudflare Worker with a Turnstile token. **Use in prod.** |
| `mock`      | Logs payload to console, resolves after ~600 ms. **Use in local dev.**  |
| `lambda`    | Generic JSON POST — left in for alternative backends.                   |
| `gotify`    | Push notification via a self-hosted Gotify server.                      |
| `custom`    | POST JSON to any URL with optional headers / method.                    |

Client-side spam guards live in [src/utils/ddos.js](src/utils/ddos.js):
honeypot field, min time-to-submit, and per-browser rate limit. They run
regardless of adapter. Configure under `contact.form.ddos`.

See [docs/feature/serverless-contact-form.md](docs/feature/serverless-contact-form.md)
for the full spec.

---

## 12. Repo layout

```
Portfolio/
├── .github/workflows/deploy.yml    # CI: Pages + Worker on push to main
├── docs/
│   ├── overview.md                 # high-level architecture
│   ├── features.md                 # feature index
│   └── feature/
│       ├── serverless-contact-form.md
│       ├── deploy-pipeline.md
│       └── content-editor.md
├── public/assets/                  # favicon, résumé, portrait, OG image
├── src/
│   ├── main.jsx                    # React entry
│   ├── App.jsx                     # section composition + #/editor route
│   ├── config/
│   │   ├── content.default.json    # shared portfolio content
│   │   ├── deepMerge.js
│   │   ├── ConfigContext.jsx       # useConfig() hook
│   │   ├── environment.development.js
│   │   └── environment.production.js
│   ├── components/                 # Icon, Nav, Notifications, Turnstile
│   ├── sections/                   # Hero, Skills, Experience, …, Contact, Footer
│   ├── pages/                      # Editor, FieldRenderer, editorState
│   ├── utils/
│   │   ├── formSubmit.js           # adapter dispatch
│   │   ├── ddos.js                 # client-side spam guards
│   │   └── richText.jsx            # **bold** renderer
│   └── styles/                     # globals.css + components.css + editor.css
├── workers/
│   └── contact/                    # Cloudflare Worker (Turnstile + Resend)
├── CLAUDE.md                       # guide for Claude Code
├── .env.example                    # template for VITE_ vars
└── vite.config.js
```

---

## 13. Troubleshooting

**`wrangler deploy` fails with `Project not found`**
Create the Pages project first: `npx wrangler pages project create kartikey-portfolio --production-branch=main`.

**Contact form shows "Bot verification failed"**
- Verify `TURNSTILE_SECRET_KEY` is set in the Worker: `npx wrangler secret list` in `workers/contact/`.
- Confirm the site key in `.env` matches the secret key's pair in the Turnstile dashboard.
- Check the hostname you're testing from is in the Turnstile site's allowed hostnames.

**Contact form shows "Request failed (403)" or CORS errors**
Update `ALLOWED_ORIGINS` in `workers/contact/wrangler.toml` and redeploy the Worker.

**Resend returns 422 `from` not verified**
Either use `onboarding@resend.dev` as `MAIL_FROM`, or verify your domain in the Resend dashboard.

**GitHub Actions fails on `wrangler pages deploy`**
- Confirm the `CLOUDFLARE_API_TOKEN` has both Pages Edit and Workers Scripts Edit.
- Confirm `CLOUDFLARE_ACCOUNT_ID` is set.
- Ensure the Pages project `kartikey-portfolio` exists (step 8).

**Turnstile widget never loads**
Check the browser console for CSP errors and confirm the site key is a real,
active one from the Turnstile dashboard.

---

## License

Personal project — all rights reserved. Feel free to take inspiration from
the architecture; please don't copy the content verbatim.
