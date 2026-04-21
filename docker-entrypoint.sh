#!/bin/sh
# =============================================================================
#  Portfolio container entrypoint
# -----------------------------------------------------------------------------
#  1. Copy user-mounted config (if any) from $CONFIG_DIR over the baked-in
#     defaults. Missing files fall back to the Jon Doe defaults.
#  2. Merge mounted /public-assets into /app/public/assets.
#  3. Render a .env file from all VITE_* environment variables (with
#     sane fallbacks) so Vite embeds them at build time.
#  4. Rebuild the site if the inputs changed since the prebuild in the image.
#  5. Serve /app/dist on $PORT using `serve`.
# =============================================================================
set -eu

: "${PORT:=8080}"
: "${BUILD_MODE:=production}"
: "${CONFIG_DIR:=/config}"
: "${PUBLIC_ASSETS_DIR:=/public-assets}"

APP_DIR="/app"
SRC_CONFIG="$APP_DIR/src/config"
DEFAULTS="$APP_DIR/docker/defaults"
STAMP_DIR="$APP_DIR/.docker"
mkdir -p "$STAMP_DIR"

log() { printf '[entrypoint] %s\n' "$*"; }

# ---------------------------------------------------------------------------
# 1. Resolve config files: mounted > default
# ---------------------------------------------------------------------------
resolve_file() {
  # $1 = filename, $2 = destination path
  mounted="$CONFIG_DIR/$1"
  default="$DEFAULTS/$1"
  dest="$2"
  if [ -f "$mounted" ]; then
    log "using mounted $1 from $mounted"
    cp "$mounted" "$dest"
  else
    log "no mounted $1 at $mounted — falling back to default"
    cp "$default" "$dest"
  fi
}

resolve_file "content.default.json"      "$SRC_CONFIG/content.default.json"
resolve_file "environment.development.js" "$SRC_CONFIG/environment.development.js"
resolve_file "environment.production.js"  "$SRC_CONFIG/environment.production.js"

# ---------------------------------------------------------------------------
# 2. Merge user-mounted public assets (favicon, resume, avatar, og image, …)
# ---------------------------------------------------------------------------
if [ -d "$PUBLIC_ASSETS_DIR" ]; then
  if [ -n "$(ls -A "$PUBLIC_ASSETS_DIR" 2>/dev/null || true)" ]; then
    log "merging user assets from $PUBLIC_ASSETS_DIR → $APP_DIR/public/assets"
    mkdir -p "$APP_DIR/public/assets"
    cp -R "$PUBLIC_ASSETS_DIR"/. "$APP_DIR/public/assets/"
  fi
fi

# ---------------------------------------------------------------------------
# 3. Render .env from VITE_* env vars (with fallbacks).
#    Any env var starting with VITE_ is passed through so Vite can embed it.
# ---------------------------------------------------------------------------
ENV_FILE="$APP_DIR/.env"
: > "$ENV_FILE"
# Defaults — empty means "disabled"; the env JS files fall through to the
# next configured adapter when values are blank.
for var in \
  VITE_TURNSTILE_SITE_KEY \
  VITE_WORKER_URL \
  VITE_CONTACT_SUBMISSION_TYPE \
  VITE_LAMBDA_ENDPOINT \
  VITE_GOTIFY_ENDPOINT \
  VITE_GOTIFY_TOKEN \
  VITE_GOTIFY_PRIORITY \
  VITE_GOTIFY_TITLE_TEMPLATE \
  VITE_GOTIFY_MESSAGE_TEMPLATE \
  VITE_CUSTOM_ENDPOINT \
  VITE_CUSTOM_METHOD
do
  eval "value=\${$var:-}"
  printf '%s=%s\n' "$var" "$value" >> "$ENV_FILE"
done

log "rendered .env with $(wc -l < "$ENV_FILE" | tr -d ' ') VITE_* vars"

# ---------------------------------------------------------------------------
# 4. Decide whether to rebuild. Hash the inputs and compare to last build.
# ---------------------------------------------------------------------------
HASH=$(cat \
  "$SRC_CONFIG/content.default.json" \
  "$SRC_CONFIG/environment.development.js" \
  "$SRC_CONFIG/environment.production.js" \
  "$ENV_FILE" \
  2>/dev/null | sha256sum | cut -d' ' -f1)

STAMP_FILE="$STAMP_DIR/build.$BUILD_MODE.hash"
PREV_HASH=""
[ -f "$STAMP_FILE" ] && PREV_HASH=$(cat "$STAMP_FILE")

if [ ! -d "$APP_DIR/dist" ] || [ "$HASH" != "$PREV_HASH" ]; then
  log "building site (mode=$BUILD_MODE, inputs changed or no dist)"
  cd "$APP_DIR"
  if [ "$BUILD_MODE" = "development" ]; then
    npx vite build --mode development
  else
    npx vite build --mode production
  fi
  printf '%s' "$HASH" > "$STAMP_FILE"
  log "build complete"
else
  log "inputs unchanged since last build — skipping rebuild"
fi

# ---------------------------------------------------------------------------
# 5. Serve dist/ (or run whatever CMD was passed).
# ---------------------------------------------------------------------------
if [ "$#" -eq 0 ] || [ "$1" = "serve" ]; then
  log "serving $APP_DIR/dist on 0.0.0.0:$PORT"
  exec npx serve -s "$APP_DIR/dist" -l "tcp://0.0.0.0:$PORT" --no-clipboard
else
  log "running custom command: $*"
  exec "$@"
fi
