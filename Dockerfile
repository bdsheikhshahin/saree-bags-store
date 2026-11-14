# syntax=docker/dockerfile:1
# ============================================================================
# E-commerce monorepo — production image (Next.js storefront + Express API)
#
# One image, two ways to run it:
#   1. Single container (default CMD): runs BOTH the API and the web app via
#      ./start.sh. Good for a quick test or a tiny VPS.
#   2. docker-compose.yml: builds this same image twice and overrides the
#      command per service, so the API and the web app each run as their own
#      container (PID 1 = the app itself, with its own healthcheck).
#      This is the recommended production setup.
#
# Why not a process supervisor (supervisord / pm2)? The compose setup above
# already gives one process per container, which is the Docker-native way and
# keeps logs, restarts and healthchecks separate. start.sh is only a
# convenience for the single-container case, so we avoid adding a supervisor
# dependency to the image.
#
# IMPORTANT — NEXT_PUBLIC_* variables are baked into the web app AT BUILD
# TIME (Next.js inlines them into the JavaScript sent to the browser).
# Changing NEXT_PUBLIC_API_URL after the image is built does nothing until
# you rebuild. Pass them as build args (see docker-compose.yml).
# ============================================================================

# --- Stage 1: dependencies -------------------------------------------------
FROM node:20-bookworm-slim AS deps
WORKDIR /app

# Copy only the manifests first so `npm ci` is cached until a dependency
# actually changes.
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

# Full install (including devDependencies) — the build stage needs
# TypeScript and Next.js.
RUN npm ci --no-audit --no-fund

# --- Stage 2: build ---------------------------------------------------------
FROM node:20-bookworm-slim AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time variables for the storefront. Defaults are the local-dev values;
# override with --build-arg (docker-compose.yml does this from your shell).
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_GTM_ID=
ARG NEXT_PUBLIC_GA_CONSENT_DEFAULT=denied
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    NEXT_PUBLIC_GTM_ID=${NEXT_PUBLIC_GTM_ID} \
    NEXT_PUBLIC_GA_CONSENT_DEFAULT=${NEXT_PUBLIC_GA_CONSENT_DEFAULT}

# Build shared types first (the API imports them), then the API, then web.
RUN npm run build --workspace=@ecommerce/shared \
 && npm run build --workspace=@ecommerce/api \
 && npm run build --workspace=@ecommerce/web

# --- Stage 3: run -----------------------------------------------------------
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Non-root user: the apps never run as root inside the container.
RUN groupadd --system appgroup && useradd --system --gid appgroup appuser

# Production-only dependencies (no TypeScript, no test tooling).
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

# Built output from the build stage. next.config.mjs is required at runtime
# by `next start`.
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/public ./apps/web/public
COPY --from=build /app/apps/web/next.config.mjs ./apps/web/next.config.mjs
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

USER appuser
EXPOSE 3000 4000

# API health endpoint. (The web app has no /health route; compose checks it
# separately by fetching the homepage.)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:4000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Default: run BOTH services in this one container (see start.sh).
# docker-compose.yml overrides this per service.
CMD ["./start.sh"]
