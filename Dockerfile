# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Build stage: Node 24 + pnpm. Toolchain never reaches the runtime image.
# ---------------------------------------------------------------------------
FROM node:24-alpine AS build

WORKDIR /app

# Corepack provides the pnpm version pinned in package.json ("packageManager").
RUN corepack enable

# Install dependencies first so the pnpm store is reused across source-only
# changes.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# The container build uses same-origin API paths, so no VITE_API_BASE_URL is
# baked into the bundle.
ENV VITE_API_BASE_URL=""
RUN pnpm build

# ---------------------------------------------------------------------------
# Runtime stage: nginx serving the static SPA and proxying /api.
# No Node.js, no pnpm.
# ---------------------------------------------------------------------------
FROM nginx:stable-alpine-slim AS runtime

# nginx.conf is a template: the proxy target is substituted at container start.
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker/proxy-target.envsh /docker-entrypoint.d/05-proxy-target.envsh
COPY --from=build /app/dist /usr/share/nginx/html

RUN chmod +x /docker-entrypoint.d/05-proxy-target.envsh

# Runtime configuration for the upstream the proxy forwards /api to.
ENV BACKEND_URL=http://backend:8080 \
    LISTEN_PORT=8080

EXPOSE 8080
