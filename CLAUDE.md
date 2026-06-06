# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install all workspace dependencies (run from root)
yarn install

# Run backend + frontend concurrently
yarn dev
# Backend: http://localhost:3001 | Frontend: http://localhost:5173

# Run a single workspace
yarn workspace backend dev
yarn workspace frontend dev

# Build
yarn build

# Lint
yarn lint

# Backend tests (Jest + Supertest)
yarn workspace backend test

# Frontend unit/component tests (Vitest + React Testing Library)
yarn workspace frontend test
yarn workspace frontend test:watch          # watch mode

# Frontend E2E tests (Playwright) — requires frontend/.env.e2e.local
yarn workspace frontend test:e2e

# Add a dependency (never use npm install)
yarn workspace backend add <pkg>
yarn workspace frontend add <pkg>
yarn add -D -W <pkg>                        # root dev dependency
```

## Architecture

Yarn workspaces monorepo: `backend/` (Express/Node.js/TS), `frontend/` (React/Vite/TS), `shared/` (shared TypeScript types).

```
Browser (React + Vite)
    │  HTTPS / JWT (Supabase Auth token via Axios interceptor)
    ▼
Express API (Node.js / TypeScript)  ────► Anthropic Claude (backend only)
    │
    ├──► Supabase PostgreSQL (patients, reports, treatments, audit_logs)
    └──► Supabase Storage (PDF files, private bucket)
```

**The frontend never calls Anthropic directly.** All AI calls go through the backend.

### Auth flow

`AuthContext` (`frontend/src/contexts/AuthContext.tsx`) holds the Supabase session. The Axios client in `frontend/src/lib/api.ts` reads `session.access_token` and attaches it as `Authorization: Bearer` on every request. On 401, it calls `supabase.auth.signOut()` and redirects to `/login`.

### Backend service clients

- **Service-role client** (`supabaseClient.ts` — `supabaseAdmin`) — used for Storage uploads and any write that bypasses RLS intentionally. The API layer enforces ownership.
- **Anon client** — used for queries with the user's JWT attached, so RLS enforces data access automatically.

### TanStack Query hooks

All server state lives in `frontend/src/hooks/`: `usePatients`, `useReports`, `useTreatments`, `useBiRadsTrend`. Components never call the API directly.

### AI services (`backend/src/services/claudeService.ts`)

All calls use `claude-sonnet-4-20250514`. PDF text is sanitized by `pdfService.sanitize()` to strip PII before any Anthropic call. Evidence quotes returned by `analyzeReport` are verified against raw text to flag hallucinations. BI-RADS trend detection is deterministic — no Claude call.

### Audit logging

Sensitive actions write to `audit_logs` asynchronously (fire-and-forget). Actions include: login/logout, view patient, create/update/delete patient, upload report, request signed PDF URL, delete report, all AI analysis calls.

### E2E tests (Playwright)

Located in `frontend/tests/`. Auth credentials come from `frontend/.env.e2e.local` (gitignored — see `.env.e2e.example`). `auth.setup.ts` authenticates once and saves browser storage state to `playwright/.auth/user.json`. Authenticated tests (`chromium-auth` project) depend on that setup completing first. Unauthenticated tests (`chromium` project) run only `auth-flow.spec.ts`.

## Conventions

- **200-line limit** for all components and service files. Split into focused sub-components or utilities when approaching it.
- **No `any`** — use proper types or `unknown`. Strict mode is on in all tsconfigs.
- **Path alias** — `@/` maps to `frontend/src/`.
- **Shared types** — all API response shapes live in `shared/types/index.ts`.
- **Environment validation** — add new required backend env vars to `backend/src/utils/validateEnv.ts` (the server exits on startup if any are missing).
- **PHI** — never log patient names, DOBs, emails, or report content; never include PHI in error responses returned to the client.
- **Supabase migrations** — SQL files in `supabase/migrations/` must be applied in order (001 → 002 → 003) via the Supabase SQL editor.
