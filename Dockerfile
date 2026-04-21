# syntax=docker/dockerfile:1.6
# =============================================================================
#  Portfolio Docker image
# -----------------------------------------------------------------------------
#  The image bundles Node + the full source so the entrypoint can rebuild the
#  static site when the user mounts a custom content.default.json or
#  environment.{development,production}.js at /config/*.
#
#  Mount points (all optional):
#    /config/content.default.json        → overrides src/config/content.default.json
#    /config/environment.production.js   → overrides src/config/environment.production.js
#    /config/environment.development.js  → overrides src/config/environment.development.js
#    /public-assets                      → merged into /app/public/assets at startup
#
#  Environment variables: see docker-compose.yml / RELEASE.md for the full list.
# =============================================================================

# ---- Stage 1: install deps + prebuild with default (Jon Doe) content --------
FROM node:20-alpine AS builder
WORKDIR /app

# Install build deps first for better layer caching.
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# Copy everything; .dockerignore keeps node_modules, dist, .env etc out.
COPY . .

# Swap in the Jon Doe defaults so the image has a valid content.default.json
# and env files baked in even if the user never mounts anything.
RUN cp docker/defaults/content.default.json      src/config/content.default.json      && \
    cp docker/defaults/environment.development.js src/config/environment.development.js && \
    cp docker/defaults/environment.production.js  src/config/environment.production.js

# Pre-build so a `docker run` with no config mounted starts fast.
ARG BUILD_MODE=production
RUN npm run build

# ---- Stage 2: runtime -------------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app

# `serve` is a small static file server. Tini handles PID 1 signal forwarding.
RUN apk add --no-cache tini && \
    npm install --global --no-audit --no-fund serve@14

# Copy the full app from the builder (source + node_modules + prebuilt dist).
COPY --from=builder /app /app

# Keep a pristine copy of the defaults so the entrypoint can always fall back.
RUN mkdir -p /app/docker/defaults && \
    cp /app/src/config/content.default.json       /app/docker/defaults/content.default.json       && \
    cp /app/src/config/environment.development.js /app/docker/defaults/environment.development.js && \
    cp /app/src/config/environment.production.js  /app/docker/defaults/environment.production.js

# Entrypoint must be executable.
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Drop to a non-root user for serving. The node:alpine image ships `node` uid 1000.
RUN chown -R node:node /app
USER node

ENV PORT=8080 \
    BUILD_MODE=production \
    CONFIG_DIR=/config \
    PUBLIC_ASSETS_DIR=/public-assets \
    NODE_ENV=production

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -q -O /dev/null http://localhost:${PORT}/ || exit 1

ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["serve"]
