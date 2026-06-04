# RadReport AI

Full-stack breast radiology analysis platform built with a pnpm workspace:

- `backend/` — Express + TypeScript + Supabase + Anthropic Claude
- `frontend/` — React + Vite + Tailwind + React Query
- `supabase/migrations/` — initial schema, RLS, and storage setup

## Quick start

```bash
corepack enable
corepack prepare pnpm@10.11.1 --activate
pnpm install
pnpm dev
```

## Workspace commands

```bash
pnpm lint
pnpm build
pnpm test
pnpm --filter backend dev
pnpm --filter frontend dev
```
