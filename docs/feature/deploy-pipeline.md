# Deploy Pipeline (Cloudflare Pages + Workers)

**Status:** Shipped · **Author:** Kartikey Choudhary · **Date:** 2026-04-19

## Objective

Continuously deploy the React site to Cloudflare Pages and the contact-form
Worker to Cloudflare Workers from a single GitHub Actions workflow, triggered
by pushes to `main`.

## Workflow

File: [.github/workflows/deploy.yml](../../.github/workflows/deploy.yml)

Three jobs:

| Job             | When it runs                          | What it does                                     |
| --------------- | ------------------------------------- | ------------------------------------------------ |
| `changes`       | Every push to `main`                  | Path-filters to decide which deploys are needed. |
| `deploy-pages`  | When `src/**`, `public/**`, `index.html`, `vite.config.js`, or `package*.json` changed (or `workflow_dispatch`) | `npm ci` → `npm run build` → `wrangler pages deploy dist`. |
| `deploy-worker` | When `workers/**` changed (or `workflow_dispatch`) | `wrangler deploy` in `workers/contact/` and syncs Worker secrets. |

No PR previews — only `main` deploys. Manual runs via the Actions tab use
`workflow_dispatch`.

## One-time setup

### 1. Cloudflare — create the Pages project

The project must exist before the first deploy:

```bash
npx wrangler pages project create kartikey-portfolio \
  --production-branch=main
```

### 2. Cloudflare — create a scoped API token

In the Cloudflare dashboard → My Profile → API Tokens → Create Token → Custom:

- **Permissions:**
  - Account → Cloudflare Pages → Edit
  - Account → Workers Scripts → Edit
- **Account resources:** include your account.
- **Zone resources:** include all zones (only needed if you later attach a
  custom domain managed in Cloudflare DNS).

Save the token — you'll paste it as `CLOUDFLARE_API_TOKEN` in GitHub.

Grab your account ID from the Workers & Pages dashboard sidebar.

### 3. GitHub — configure repository secrets & variables

Repository → Settings → Secrets and variables → Actions.

**Secrets** (sensitive):

| Name                     | Value                                                  |
| ------------------------ | ------------------------------------------------------ |
| `CLOUDFLARE_API_TOKEN`   | Token from step 2.                                     |
| `CLOUDFLARE_ACCOUNT_ID`  | Your Cloudflare account ID.                            |
| `TURNSTILE_SECRET_KEY`   | From the Turnstile dashboard.                          |
| `RESEND_API_KEY`         | From the Resend dashboard.                             |

**Variables** (public — end up in the JS bundle):

| Name                       | Value                                                       |
| -------------------------- | ----------------------------------------------------------- |
| `VITE_TURNSTILE_SITE_KEY`  | Turnstile site key (public half of the pair).               |
| `VITE_WORKER_URL`          | Deployed Worker URL (populated after the first Worker deploy). |

### 4. First deploy — chicken-and-egg note

The Pages build injects `VITE_WORKER_URL` into the bundle, but that URL only
exists after the Worker is deployed. First-run sequence:

1. Manually deploy the Worker once: `cd workers/contact && npx wrangler deploy`.
2. Copy the printed URL into the `VITE_WORKER_URL` GitHub variable.
3. Push to `main` (or trigger the workflow manually).

Subsequent deploys are fully automated.

## How secrets reach each runtime

| Secret                    | Lives in           | Delivered to            | Via                               |
| ------------------------- | ------------------ | ----------------------- | --------------------------------- |
| `CLOUDFLARE_API_TOKEN`    | GitHub secrets     | GitHub Actions runner   | `secrets.*` in workflow YAML      |
| `CLOUDFLARE_ACCOUNT_ID`   | GitHub secrets     | GitHub Actions runner   | `secrets.*` in workflow YAML      |
| `TURNSTILE_SECRET_KEY`    | GitHub secrets     | Cloudflare Worker env   | `wrangler-action` `secrets:` list |
| `RESEND_API_KEY`          | GitHub secrets     | Cloudflare Worker env   | `wrangler-action` `secrets:` list |
| `VITE_TURNSTILE_SITE_KEY` | GitHub variables   | Vite build (client JS)  | `env:` in the build step          |
| `VITE_WORKER_URL`         | GitHub variables   | Vite build (client JS)  | `env:` in the build step          |

The two `VITE_*` values are public — they're embedded in the shipped bundle,
so `vars` is appropriate (and doesn't get masked in logs).

## Operations

### Trigger a redeploy manually

GitHub → Actions → Deploy → Run workflow → pick `main`.

### Rotate a Worker secret

Update the value in GitHub Secrets, then trigger a Worker deploy (push a
no-op change under `workers/` or use `workflow_dispatch`). The `secrets:`
list in `wrangler-action` re-syncs them on every run.

### Rollback

Cloudflare Pages keeps prior deployments. Dashboard → Pages →
`kartikey-portfolio` → Deployments → pick an older successful build →
"Rollback to this deployment". For the Worker, re-run an older commit's
workflow via "Re-run jobs" in the Actions tab.

## Non-functional properties

- **Concurrency:** a `concurrency` group on `deploy-${{ github.ref }}` with
  `cancel-in-progress: false` keeps successive pushes from overlapping
  mid-deploy while still running them in order.
- **Idempotency:** the Pages deploy is content-hashed; re-running on the same
  commit produces the same deployment. The Worker deploy overwrites
  in-place.
- **Least privilege:** the API token is scoped to Pages + Workers only,
  not full account access.
