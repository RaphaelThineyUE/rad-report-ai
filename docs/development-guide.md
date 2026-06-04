# Development Guide

## Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- A [Supabase](https://supabase.com) project (project ID: `ghdgkthminenqniqhjjx`)
- An [Anthropic](https://console.anthropic.com) API key

---

## Setup

### 1. Install dependencies

```bash
pnpm install
```

This installs dependencies for all workspaces (root, backend, frontend) in one command.

### 2. Configure environment variables

**Backend** — copy and fill in `backend/.env`:

```env
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=https://ghdgkthminenqniqhjjx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard → Settings → API>
SUPABASE_ANON_KEY=<from Supabase dashboard → Settings → API>

# Anthropic
ANTHROPIC_API_KEY=<from console.anthropic.com>
CLAUDE_MODEL=claude-sonnet-4-20250514

# File upload
MAX_FILE_SIZE_MB=20
STORAGE_BUCKET=reports
```

**Frontend** — copy and fill in `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=https://ghdgkthminenqniqhjjx.supabase.co
VITE_SUPABASE_ANON_KEY=<from Supabase dashboard → Settings → API>
```

### 3. Apply database migrations

Run the SQL in `docs/database-schema.md` via the [Supabase SQL editor](https://supabase.com/dashboard/project/ghdgkthminenqniqhjjx/sql) in this order:

1. Create tables (`users`, `patients`, `radiology_reports`, `treatment_records`, `audit_logs`)
2. Enable RLS and add policies
3. Create Supabase Storage bucket `reports` (private)
4. Add storage policies

### 4. Generate TypeScript types from the DB

```bash
npx supabase gen types typescript \
  --project-id ghdgkthminenqniqhjjx \
  > shared/types/database.ts
```

---

## Running the project

```bash
# Run both backend and frontend concurrently
pnpm dev

# Run backend only (port 3001)
pnpm --filter backend dev

# Run frontend only (port 5173)
pnpm --filter frontend dev
```

---

## Adding dependencies

```bash
# Add to backend
pnpm --filter backend add <package>

# Add to frontend
pnpm --filter frontend add <package>

# Add dev dependency to root
pnpm add -D -w <package>
```

Never use `npm install` directly — always use `pnpm`.

---

## Running tests

```bash
# Backend tests (Jest + Supertest)
pnpm --filter backend test

# Frontend component tests (Vitest + RTL)
pnpm --filter frontend test

# E2E tests (Playwright)
pnpm --filter frontend test:e2e
```

---

## Project conventions

### File size limit
Components and service files should stay under **200 lines**. Split into focused sub-components or utilities when approaching the limit.

### Comments
Only add a comment when the **why** is non-obvious (a hidden constraint, a subtle invariant, a workaround). Don't describe what code does — well-named functions already do that.

### TypeScript
- Strict mode enabled in all tsconfigs
- No `any` — use proper types or `unknown`
- All API response shapes have corresponding TypeScript interfaces in `shared/types/`

### Supabase client usage
- **Backend**: always use the **service-role** client for writes to storage (bypasses storage RLS intentionally; API layer enforces ownership)
- **Backend queries**: use the **anon** client with the user's JWT attached, or the service-role client with explicit `created_by` filters
- **Frontend**: use the **anon** client — RLS enforces data ownership automatically

### Environment variable validation
The backend validates all required env vars on startup and exits if any are missing. Add new required vars to `backend/src/utils/validateEnv.ts`.

### PHI handling
- Never log patient names, DOBs, emails, or report content
- Never include PHI in error messages returned to the client
- Strip PII from PDF text before sending to Claude (see `pdfService.sanitize()`)

---

## Local Supabase (optional)

For fully offline development, you can run Supabase locally:

```bash
npx supabase start
```

This requires Docker. Update `.env` files to point at the local Supabase URL (`http://127.0.0.1:54321`).

---

## VS Code recommended extensions

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Hero
- REST Client (for `.http` files in `docs/`)
