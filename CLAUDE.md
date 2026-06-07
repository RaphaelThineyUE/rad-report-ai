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

The Claude model is configurable via the `ANTHROPIC_MODEL` env var (default `claude-sonnet-4-6`); `claudeService.ts` is the single source of truth for model selection. Structured responses (analyze/consolidate/compare/BI-RADS-trend) are validated with Zod via `client.messages.parse()` + `zodOutputFormat()`; the schemas live in `backend/src/services/aiSchemas.ts`. PII is redacted by `cleanupIdentifiers()` in `claudeService.ts` before downstream use. Evidence quotes returned by `analyzeReport` are verified against raw text to flag hallucinations.

### Audit logging

Sensitive actions write to `audit_logs` asynchronously (fire-and-forget). Actions include: login/logout, view patient, create/update/delete patient, upload report, request signed PDF URL, delete report, all AI analysis calls.

### E2E tests (Playwright)

Located in `frontend/tests/`. Auth credentials come from `frontend/.env.e2e.local` (gitignored — see `.env.e2e.example`). `auth.setup.ts` authenticates once and saves browser storage state to `playwright/.auth/user.json`. Authenticated tests (`chromium-auth` project) depend on that setup completing first. Unauthenticated tests (`chromium` project) run only `auth-flow.spec.ts`.

## Backend API routes (`backend/src/routes/`, mounted at `/api/...`)

Each file has a docblock listing every endpoint — read the file directly for details. Quick map:

- **`/auth`** — register, login, `me` (get/patch), forgot/reset password. Rate-limited via `authRateLimiter`.
- **`/patients`** — CRUD + `GET /:id/export` (full bundle export). Full clinical validation on create/update.
- **`/reports`** — `POST /upload` (single PDF, multer memory storage), `POST /batch-upload` (≤50 PDFs), `GET /:id/url` (signed Storage URL), `GET /:id/export` (JSON), `POST /:id/process` (trigger AI), plus standard CRUD.
- **`/treatments`** — CRUD; validates `treatment_type` (Surgery/Chemotherapy/Radiation/Hormone Therapy/...) and outcome/date.
- **`/ai`** — `analyze`, `summarize`, `consolidate` (per-patient), `compare-treatments`, `birads-trend` (deterministic, no Claude call), `quotes` (evidence extraction). All proxy to `claudeService`.
- **`/analytics`** — `GET /` (aggregated dashboard data), `GET /export/csv`.
- **`/admin`** — `GET /health`, `GET /users`, `GET /users/:userId`. Role check enforced in `adminController`.
- **`/organizations`** — CRUD + `GET /:orgId/members` (multi-tenant org/team support).

All routers require `requireAuth` except the public auth endpoints.

## Frontend routes (`frontend/src/App.tsx`, pages in `frontend/src/pages/`)

Public: `/login`, `/signup`, `/forgot-password`, `/reset-password`.
Protected (behind `ProtectedRoute` + `AppShell`): `/dashboard`, `/worklist`, `/patients`, `/analytics`, `/patient-analytics`, `/admin-dashboard`, `/admin-users`, `/teams`, `/howto`, `/settings`. Unknown paths redirect to `/dashboard`.

## Database (`supabase/migrations/`, apply in order)

- **001_initial_schema** — core tables: `users` (mirrors `auth.users`), `patients`, `radiology_reports`, `treatments`, `audit_logs`.
- **002_rls_policies** — Row Level Security: users can only access rows they created (enforced via the anon client + JWT).
- **003_storage_policies** — private `reports` Storage bucket; users can upload only to their own path prefix.
- **004_organizations** — `organizations` + `org_members` tables for multi-tenant team support (org-scoped RLS via `org_members_select` policy — watch for self-referencing recursion, see commit history).

Key `Patient` fields: `full_name`, `date_of_birth`, `gender`, `cancer_type`, `cancer_stage` (Stage 0–IV/Unknown), `tumor_size_cm`, `er_status`/`pr_status`/`her2_status` (Positive/Negative/Unknown). Key `RadiologyReport` fields: `status` (pending/processing/completed/failed), `birads_value` (0–6), `birads_confidence`, `findings`, `recommendations`, `red_flags` — each AI-derived field pairs with an `*_evidence` array of source quotes for hallucination verification. Full shapes in `shared/types/index.ts`.

## Conventions

- **200-line limit** for all components and service files. Split into focused sub-components or utilities when approaching it.
- **No `any`** — use proper types or `unknown`. Strict mode is on in all tsconfigs.
- **Path alias** — `@/` maps to `frontend/src/`.
- **Shared types** — all API response shapes live in `shared/types/index.ts`.
- **Environment validation** — add new required backend env vars to `backend/src/utils/validateEnv.ts` (the server exits on startup if any are missing).
- **PHI** — never log patient names, DOBs, emails, or report content; never include PHI in error responses returned to the client.
- **Supabase migrations** — SQL files in `supabase/migrations/` must be applied in order (001 → 002 → 003) via the Supabase SQL editor.

-**PR** - always make sure the PR is in a ready to view state before alerting me to review it, I don't want it to be in draft form.
