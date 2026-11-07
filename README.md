# photo-manager-frontend

Vue 3 SPA for the photo-manager project (photographer album sharing).
Single-tenant, learning project. Separate repo from the backend.

## Stack

- Vue 3.5 with Composition API and `<script setup>` + TypeScript. Always use this style;
  do not use Options API.
- Vite 8, Vue Router 5, Pinia 4.
- Package manager: pnpm (ver `pnpm-lock.yaml`); no usar `npm`.
- Linting: oxlint + ESLint + Prettier (`pnpm lint`, `pnpm format`).

## Commands

- Dev server: `pnpm dev` (http://localhost:5173)
- Build + type-check: `pnpm build`
- Lint (fix): `pnpm lint`
- Format: `pnpm format`

A task is only done when `pnpm build` passes.

## API access

- Base URL comes from `VITE_API_BASE_URL` (see `.env`); in development a Vite proxy may
  be used instead to avoid CORS.
- The backend HTTP contract is the single source of truth; it lives in the backend repo.

## OpenSpec

- Artifacts live in the parent umbrella repo (`../openspec/`); do not copy them here.

---

# Full local stack (Docker Compose)

The frontend, the backend and PostgreSQL run together as three Compose
services. The Compose file lives in the **backend** repo, because that is where
the database definitions and volumes already are.

## Prerequisites

- Docker with the Compose plugin (`docker compose version`).
- Both repositories checked out **as siblings**, in this layout:

  ```
  <parent-dir>/
  ├── photo-manager-backend/     # Compose file, API
  └── photo-manager-frontend/    # this repository, SPA
  ```

  Compose builds the frontend from `../photo-manager-frontend`. If the sibling
  directory is missing or renamed, the frontend build fails.

- Port `8080` free on the host (change it with `FRONTEND_PORT`).
- Port `5432` free **on the loopback interface** of the host (the database is
  published on `127.0.0.1` only).

## Start

From the backend repository root:

```sh
cd ../photo-manager-backend
docker compose up --build
```

`docker compose up` builds the images only when needed; `--build` forces a
rebuild of both application images.

The frontend is then available at:

- <http://localhost:8080> from the host itself.
- `http://<host-lan-ip>:8080` from any other device of the same network.

To publish on a different host port:

```sh
FRONTEND_PORT=9090 docker compose up --build
```

### What is published on the host

| Service   | Host binding                 | From the host | From other LAN devices |
| --------- | ---------------------------- | ------------- | ---------------------- |
| frontend  | `0.0.0.0:8080` (all ifaces)  | yes           | **yes**                |
| backend   | none (Compose network only)  | via proxy     | no                     |
| postgres  | `127.0.0.1:5432` (loopback)  | yes           | no                     |

Only the **frontend** is reachable from other devices of the LAN. The database
keeps its port on the loopback interface so that host-local tools keep
working (`./gradlew bootRun`, the Vite dev server, `psql`), but it is **not**
reachable from other LAN devices and cannot be used to bypass the frontend.

## Access from another device of the LAN

The **frontend** is the only application service published on the host, and it
also acts as the API proxy. The browser therefore talks to the same origin
(`http://<host-lan-ip>:8080`) and calls the API through the relative `/api`
paths; the host address is **never** configured inside the application.

The backend and PostgreSQL are **not** reachable from the other
devices: the backend has no published port at all, and the database is bound
to `127.0.0.1` on the host. Another device of the LAN can only use the
frontend.

Steps on the other device:

1. Find the LAN address of the host, for example `hostname -I` on Linux or
   `ipconfig` on Windows.
2. Open `http://<host-lan-ip>:8080` in the browser.
3. Log in with the seeded admin account; the session cookie works normally
   because the request is same-origin.

The stack seeds a single admin account on first start:

- email: `admin@photomanager.local`
- password: `changeme`

These are **development-only** credentials for a local, trusted LAN. Change
them before using the stack anywhere else; they are not suitable for
production.

If the page does not load, the host firewall is probably blocking the incoming
connection. Allow the frontend port (8080 by default) for the local network,
for example on UFW:

```sh
sudo ufw allow 8080/tcp
```

Do not forward that port from the Internet; this stack is meant for a trusted
LAN.

## Architecture of the containerised flow


```
                         host                          LAN devices
                          │
  browser ──http://<host-lan-ip>:8080──────────────────────────▶
                          │
                   frontend (nginx)  0.0.0.0:8080
                          │  /api/*  (same origin)
                          ▼
                    backend (Spring Boot)  no published port
                           |
                           v
                       postgres
                   127.0.0.1:5432
                   (loopback only)
```
- The backend declares no published port; it is reachable only from the Compose
  network.
- PostgreSQL publishes its port on the host loopback interface, so
  host-local tools can use it but LAN devices cannot reach it.
- The Compose network DNS name `postgres` is passed to the backend
  as `POSTGRES_HOST`.
- The proxy forwards the original `Host` header (host **and** port) as
  `Host` and `X-Forwarded-Host`. The backend compares that authority with the
  browser's `Origin` header to decide whether a request is same-origin, so the
  proxied request is treated as same-origin and no CORS allowance is needed for
  the LAN address of the host.

## Runtime configuration of the proxy target

The upstream the proxy forwards `/api` to is set when the container starts, via
the `BACKEND_URL` environment variable. The Compose file interpolates it, so it
can be set from the shell or from a `.env` file next to `docker-compose.yml`:

```sh
BACKEND_URL=http://backend:8080 docker compose up
```

```sh
# photo-manager-backend/.env
BACKEND_URL=http://backend:8080
```

The default is `http://backend:8080`, the Compose DNS name of the backend
service. The value is not compiled into the bundle, so the same frontend image
can be pointed at a different backend without rebuilding it. Only the address is
configured there; no credentials or secrets belong in it.

## Docker image

`Dockerfile` builds in two stages:

1. `node:24-alpine` installs the dependencies with pnpm (via Corepack) and
   builds the SPA.
2. `nginx:stable-alpine-slim` serves the static files and proxies `/api`.

The runtime image contains no Node.js, no pnpm and no build cache.

The Nginx configuration is a template (`docker/nginx.conf.template`) rendered at
container start by the nginx entrypoint, so `BACKEND_URL` and `LISTEN_PORT` are
resolved at runtime.

## Persistence

- PostgreSQL data lives in the `postgres-data` named volume.
- Photo bytes live in `../photo-manager-backend/var/storage`, bind-mounted into
  the backend container. The host directory must be readable and writable by the
  container user.

The backend container runs as a non-root user whose uid/gid are set at build
time (`APP_UID` / `APP_GID`, both defaulting to `1000`). They must match the
owner of `var/storage` on the host, otherwise the container cannot write the
photo bytes and the uploads fail with an access error. On a host where that
directory belongs to a different user, override them when starting the stack:

```sh
APP_UID=$(id -u) APP_GID=$(id -g) docker compose up --build
```

## Stop the stack

```sh
docker compose down
```

This stops and removes the containers but **keeps** the database volumes and the
photo directory, so the data survives.

To also delete the database volumes (this **destroys** all albums, photos and
events):

```sh
docker compose down -v
```

## Local development without Docker

The Vite dev server keeps calling the backend directly, as before:

```sh
cd ../photo-manager-backend && docker compose up -d postgres
./gradlew bootRun          # API on http://localhost:8080

cd ../photo-manager-frontend
pnpm dev                   # SPA on http://localhost:5173
```

`VITE_API_BASE_URL` (see `.env`) points the browser at the API directly; the
backend allows that origin through `CORS_ALLOWED_ORIGINS`.

The database published on `127.0.0.1:5432` is the one
the host-local `bootRun` backend and the Vite dev server connect to. Because
it is bound to the loopback interface, it stays usable from the host while
remaining unreachable from other devices of the LAN.
