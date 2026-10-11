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
