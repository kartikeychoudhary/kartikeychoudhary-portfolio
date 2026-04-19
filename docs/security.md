# Security

Cross-cutting security posture of the portfolio site. Feature-specific depth
lives in the feature docs; this file is the synthesis.

## 1. Scope and threat model

**In scope**

- Protecting the contact-form delivery pipeline against bots, abuse, and quota drain.
- Preventing leakage of server-side secrets (`TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, Cloudflare API token) through the repo, CI logs, or the client bundle.
- Keeping the CI/CD pipeline from being hijacked to exfiltrate those secrets or push unauthorized deployments.
- Hardening the Worker against payload-shape and payload-size abuse.

**Explicitly out of scope**

- The static site's content (name, email, socials, résumé) — these are published by design.
- Targeted nation-state adversaries; the Cloudflare free tier's DDoS posture is considered sufficient for this site's profile.
- Confidentiality of contact-form submissions in transit beyond what TLS + Resend provide; messages are routed to Gmail and subject to Gmail's threat model afterwards.

## 2. Secret management

Three runtimes, three trust boundaries. A secret **never crosses its boundary**.

| Secret                    | Stored in                                   | Delivered to               | Bundled into client? |
| ------------------------- | ------------------------------------------- | -------------------------- | -------------------- |
| `TURNSTILE_SECRET_KEY`    | GitHub Secrets + Cloudflare Worker env      | Worker runtime only        | No                   |
| `RESEND_API_KEY`          | GitHub Secrets + Cloudflare Worker env      | Worker runtime only        | No                   |
| `CLOUDFLARE_API_TOKEN`    | GitHub Secrets                              | GitHub Actions runner only | No                   |
| `CLOUDFLARE_ACCOUNT_ID`   | GitHub Secrets                              | GitHub Actions runner only | No                   |
| `VITE_TURNSTILE_SITE_KEY` | GitHub Variables + local `.env`             | Vite build (client JS)     | Yes — public by design |
| `VITE_WORKER_URL`         | GitHub Variables + local `.env`             | Vite build (client JS)     | Yes — public by design |

**Rules.** `environment.*.js` is bundled into the client — no server secrets go there. `.env` is git-ignored and holds only `VITE_*` public build vars. The Cloudflare API token is scoped to Pages Edit + Workers Scripts Edit only — not full account access. Worker secrets are synced from GitHub on every Worker deploy via `wrangler-action`'s `secrets:` list, so rotating a value in GitHub and re-running the workflow is the single rotation step.

**Verification (repeatable).**

```bash
# No committed secrets
git log --all -p | grep -E 'sk_live_|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|re_[A-Za-z0-9]{20,}|-----BEGIN.*PRIVATE KEY-----' && echo "LEAK" || echo "clean"

# Configured on GitHub
gh secret list
gh variable list
```

## 3. Contact form — defense in depth

Four ordered layers. Each filters a different attacker profile. Full detail in [feature/serverless-contact-form.md](feature/serverless-contact-form.md#defense-in-depth).

| Layer | Where | Attacker it stops |
| --- | --- | --- |
| Honeypot + min-time + localStorage rate limit | Client (`src/utils/ddos.js`) | Naive scripted spam |
| Turnstile token + `siteverify` | Worker | Bots without CAPTCHA-solving capability |
| Payload shape + length caps (16 KB body; per-field limits) | Worker (`worker.js`) | Valid-token actors sending oversized bodies to drain compute/quota |
| Cloudflare WAF rate-limiting rule | Zone | Valid-token actors submitting at volume |

Turnstile is the primary gate; the others are depth. CORS is enforced but is not a security control against non-browser clients — Turnstile is.

## 4. CI/CD pipeline security

Workflow: [.github/workflows/deploy.yml](../.github/workflows/deploy.yml).

| Control | Posture |
| --- | --- |
| Triggers | Only `push: main` and `workflow_dispatch`. No `pull_request_target`, `workflow_run`, or `issue_comment`. PRs from forks cannot trigger a run that has secrets. |
| `GITHUB_TOKEN` permissions | Explicit block: `contents: read`, `deployments: write`. All other permissions default to `none`. Repo-wide default is also `read`. |
| Third-party actions | All four pinned to full commit SHAs with version comments. Tag-move supply-chain attacks are neutralized; version bumps are intentional changes visible in diff. |
| Secret exposure in logs | Values passed via `secrets.*` are auto-masked by GitHub. `wrangler-action` doesn't echo them. The `env:` block for Worker secrets is scoped to a single step. |
| Script injection surface | No `run:` step interpolates `${{ github.event.* }}`, `github.head_ref`, or any other attacker-controlled field. |
| Cache poisoning | `cache: npm` scope is per-branch; no PR-triggered run can seed a malicious cache for `main`. |

**Maintenance.** When bumping a pinned action, resolve the new SHA explicitly:

```bash
gh api repos/<owner>/<repo>/commits/<tag> --jq '.sha'
```

Then update the `@<sha> # <semver>` pair in `deploy.yml` in the same commit.

## 5. Worker input handling

[workers/contact/worker.js](../workers/contact/worker.js) defends against shape and size abuse.

- **Body size:** request body is read as text first; anything over `MAX_BODY_BYTES` (16 KB) returns `413` before `JSON.parse`.
- **Field caps:** `name`/`email`/`subject`/`message`/`token` each have explicit length limits (`LIMITS` object). Over-limit returns `413`.
- **Shape:** all five fields must be present and non-empty; else `400`.
- **Token verification:** every request calls `siteverify` with the caller's `CF-Connecting-IP` for Cloudflare-side signal. Failure returns `403`, before Resend is contacted.
- **Output escaping:** email content is rendered by `email.js`; all user-supplied values pass through `esc()` (HTML entity escape) before interpolation. The `Reply` button uses `encodeURIComponent` on the mailto subject.
- **CORS:** `Access-Control-Allow-Origin` is set only to origins in `ALLOWED_ORIGINS`. Unknown origins receive the first allowed value as a header, which browsers reject for cross-origin mismatch.

## 6. Rotation

| Secret / token | How to rotate |
| --- | --- |
| `TURNSTILE_SECRET_KEY` | Turnstile dashboard → regenerate → update GitHub Secret → re-run workflow (or push any `workers/**` change). |
| `RESEND_API_KEY` | Resend dashboard → revoke & create → update GitHub Secret → re-run workflow. |
| `CLOUDFLARE_API_TOKEN` | Cloudflare → API Tokens → revoke & create → update GitHub Secret. No deploy needed until the next run. |
| `VITE_TURNSTILE_SITE_KEY` | Turnstile dashboard → regenerate site key → update GitHub Variable + local `.env` → push to trigger Pages redeploy. Also update the paired secret key. |

Because Worker secrets are pushed from GitHub on every Worker deploy, there is no separate `wrangler secret put` step during rotation — the workflow re-syncs them.

## 7. Known limitations

- **Major-tag drift of pinned actions.** Pinned SHAs don't auto-update. CVEs in a pinned version go unpatched until a manual bump. Mitigation: review action changelogs quarterly, or enable Dependabot for `github-actions`.
- **Client-side rate limit is bypassable.** The `localStorage` counter in `src/utils/ddos.js` is trivially reset. It exists to filter casual repeats, not as a security control. The Cloudflare rate-limiting rule (layer 4) is the real bound.
- **Turnstile tokens are not unforgeable at scale.** Paid CAPTCHA-solving services can produce valid tokens. This is why the WAF rate-limiting rule and Worker payload caps exist — to bound the damage of a solved-token spam campaign.
- **Resend free tier is 3k emails/month.** A successful spam campaign above the rate limit could still drain it. Upgrade plan or add a second, zone-wide rate limit rule if quota exhaustion becomes a real concern.

## 8. Reporting a vulnerability

Email `kartikey31choudhary@gmail.com` with subject prefix `[SECURITY]`. Please do not open a public GitHub issue for any finding that could be weaponized against the live site before you've heard back.

Expected response: acknowledgment within 72 hours; triage and fix timeline shared in the reply.
