# Release procedure

Manual steps for cutting a new release of the Portfolio image + the
corresponding GitHub release. CI is optional — everything below is
intended to be run by hand from a clean checkout of `main`.

> **Replace before running:**
> - `DOCKER_USER` → your Docker Hub username (e.g. `kartikey31choudhary`)
> - `IMAGE_NAME`  → `portfolio` (or whatever repo name you want on Docker Hub)
> - `VERSION`     → the version you're cutting, e.g. `v1.0.0`

```bash
export DOCKER_USER=kartikey31choudhary
export IMAGE_NAME=portfolio
export VERSION=v1.0.0
```

---

## 1. Pre-flight

```bash
git checkout main
git pull --ff-only
git status                      # working tree must be clean
npm ci
npm run build                   # sanity-check that the site still builds
```

Bump `version` in [package.json](package.json) if it doesn't already match
`$VERSION` (minus the leading `v`), commit, and push.

---

## 2. Tag the release in git

```bash
git tag -a "$VERSION" -m "Release $VERSION"
git push origin "$VERSION"
```

> Delete a bad tag with `git tag -d $VERSION && git push origin :refs/tags/$VERSION`.

---

## 3. Build the Docker image (multi-arch)

The image bundles Node + the full source so the entrypoint can rebuild the
static bundle at container start when a user mounts a custom
`content.default.json` or `environment.*.js`. Multi-arch (`amd64` + `arm64`)
covers cloud VMs and Apple Silicon laptops.

```bash
# One-time setup
docker login
docker buildx create --name portfolio-builder --use 2>/dev/null || docker buildx use portfolio-builder
docker buildx inspect --bootstrap
```

Build and push **both** `$VERSION` and `latest` in a single pass:

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag "$DOCKER_USER/$IMAGE_NAME:$VERSION" \
  --tag "$DOCKER_USER/$IMAGE_NAME:latest" \
  --push \
  .
```

Single-arch fallback (faster, host-arch only — fine for testing):

```bash
docker build -t "$DOCKER_USER/$IMAGE_NAME:$VERSION" -t "$DOCKER_USER/$IMAGE_NAME:latest" .
docker push "$DOCKER_USER/$IMAGE_NAME:$VERSION"
docker push "$DOCKER_USER/$IMAGE_NAME:latest"
```

### Smoke-test the pushed image

```bash
docker run --rm -p 8080:8080 "$DOCKER_USER/$IMAGE_NAME:$VERSION"
# open http://localhost:8080 — you should see the Jon Doe placeholder site.
```

Then with a custom config:

```bash
mkdir -p ./config
cp src/config/content.default.json ./config/content.default.json
docker run --rm -p 8080:8080 \
  -v "$PWD/config:/config:ro" \
  -e VITE_TURNSTILE_SITE_KEY=... \
  -e VITE_WORKER_URL=https://portfolio-contact.example.workers.dev \
  "$DOCKER_USER/$IMAGE_NAME:$VERSION"
```

---

## 4. Create the GitHub release

Requires the `gh` CLI (`brew install gh && gh auth login`). The notes below
double as the body of the GitHub release — tweak before publishing if you
want to call out specific changes.

```bash
gh release create "$VERSION" \
  --title "Portfolio $VERSION" \
  --notes "$(cat <<'EOF'
## Portfolio v1.0.0

First tagged release. Static React portfolio with a Cloudflare-Worker-backed
contact form, packaged as a self-contained Docker image that rebuilds on
startup when users mount their own content.

### Docker images

- `DOCKER_USER/IMAGE_NAME:v1.0.0`
- `DOCKER_USER/IMAGE_NAME:latest`

Pull with:

```bash
docker pull DOCKER_USER/IMAGE_NAME:v1.0.0
```

### Quick deploy

```bash
docker run -d --name portfolio -p 8080:8080 \
  -v "$PWD/config:/config:ro" \
  -v "$PWD/public-assets:/public-assets:ro" \
  -e VITE_TURNSTILE_SITE_KEY=your_site_key \
  -e VITE_WORKER_URL=https://portfolio-contact.example.workers.dev \
  DOCKER_USER/IMAGE_NAME:v1.0.0
```

Or use the committed `docker-compose.yml`:

```bash
docker compose up -d
```

### Configuration

Mount any of these files to override the Jon Doe defaults baked into the
image. Any file you skip falls back to the default.

| Mount path | Purpose |
| --- | --- |
| `/config/content.default.json` | All on-screen content (see `/#/editor` in the running site for a form-based editor). |
| `/config/environment.production.js` | Production env overrides (used when `BUILD_MODE=production`, the default). |
| `/config/environment.development.js` | Development env overrides (used when `BUILD_MODE=development`). |
| `/public-assets` | Directory merged into `/app/public/assets` (avatar, résumé, favicon, OG image). |

### Contact form resolution order

When `VITE_CONTACT_SUBMISSION_TYPE` is empty, the site auto-picks the first
adapter whose required vars are set:

1. `turnstile` — needs `VITE_TURNSTILE_SITE_KEY` + `VITE_WORKER_URL`
2. `lambda`    — needs `VITE_LAMBDA_ENDPOINT`
3. `gotify`    — needs `VITE_GOTIFY_ENDPOINT` + `VITE_GOTIFY_TOKEN`
4. `custom`    — needs `VITE_CUSTOM_ENDPOINT`
5. `mock`      — console-only; the safe default

### Environment variables

See [docker-compose.yml](docker-compose.yml) for the full list with defaults.
All are optional — missing vars fall through to the next adapter in the list
above.

### Ports

- **8080** — HTTP (override with `PORT` env var).

EOF
)"
```

> `gh release create` also accepts `--draft` if you want to review the
> rendered release before publishing.

### Attach a source tarball (optional)

GitHub auto-attaches source zips from the tag, but you can add extras:

```bash
npm run build
tar -czf "portfolio-$VERSION-dist.tar.gz" -C dist .
gh release upload "$VERSION" "portfolio-$VERSION-dist.tar.gz"
```

---

## 5. Post-release

- Bump `package.json` to the next `-dev` version on `main` if you're
  following a release-branch workflow.
- Update README badges/links to the new tag if you keep any.
- Announce wherever you announce things.

---

## Rollback

```bash
# Re-point :latest to the previous good version.
docker pull "$DOCKER_USER/$IMAGE_NAME:v0.X.Y"
docker tag  "$DOCKER_USER/$IMAGE_NAME:v0.X.Y" "$DOCKER_USER/$IMAGE_NAME:latest"
docker push "$DOCKER_USER/$IMAGE_NAME:latest"

# Delete the bad GitHub release + tag.
gh release delete "$VERSION" --yes
git push origin ":refs/tags/$VERSION"
git tag -d "$VERSION"
```
