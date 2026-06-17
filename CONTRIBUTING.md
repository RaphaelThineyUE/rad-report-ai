# Contributing to RadReport AI

Thank you for considering contributing to RadReport AI! This guide will help you understand our development workflow, code standards, and contribution process.

---

## Table of Contents

1. [Development Setup](#development-setup)
2. [Project Structure](#project-structure)
3. [Branching & Commits](#branching--commits)
4. [Testing Requirements](#testing-requirements)
5. [Pull Request Process](#pull-request-process)
6. [Code Conventions](#code-conventions)
7. [Common Tasks](#common-tasks)

---

## Development Setup

### Prerequisites

- **Node.js**: v18+ (check with `node --version`)
- **Yarn**: v3.6+ (install with `npm install -g yarn@3.6.0`)
- **Git**: Latest version
- **Supabase account**: For local database setup (optional but recommended)
- **Anthropic API key**: For Claude integration testing

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/rad-report-ai.git
cd rad-report-ai

# Install all workspace dependencies
yarn install

# Copy environment variable templates
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Fill in required environment variables
# - SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
# - ANTHROPIC_API_KEY
```

### Running Locally

```bash
# Run backend + frontend concurrently
yarn dev
# Backend: http://localhost:3001 | Frontend: http://localhost:5173

# Or run individually
yarn workspace backend dev
yarn workspace frontend dev
```

### Database Setup

If using a local Supabase instance:

```bash
# Start local Supabase (requires Docker)
supabase start

# Apply migrations
supabase migration list
supabase db pull  # if remote already has migrations
```

For full instructions, see [docs/development-guide.md](docs/development-guide.md).

---

## Project Structure

This is a **Yarn workspaces monorepo**:

```
rad-report-ai/
├── backend/               # Express API (Node.js, TypeScript)
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── routes/        # Express routers
│   │   ├── services/      # Business logic (Claude, PDF, Supabase)
│   │   ├── middleware/    # Auth, validation, rate-limiting
│   │   └── utils/         # Helpers (env validation, audit logging)
│   ├── tests/             # Jest + Supertest tests
│   ├── .env.example       # Template (never commit .env)
│   └── package.json
│
├── frontend/              # React + Vite (TypeScript)
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route-level pages
│   │   ├── hooks/         # React hooks (usePatients, useReports, etc.)
│   │   ├── lib/           # Utilities (API client, React Query setup)
│   │   ├── contexts/      # React contexts (AuthContext)
│   │   └── types/         # Frontend-specific types
│   ├── tests/             # Vitest + React Testing Library tests
│   ├── tests/e2e/         # Playwright E2E tests
│   ├── .env.example       # Template
│   └── package.json
│
├── shared/                # Shared TypeScript types
│   └── types/
│       └── index.ts       # API response shapes, Patient, Report, etc.
│
├── supabase/              # Database migrations + RLS policies
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_rls_policies.sql
│       ├── 003_storage_policies.sql
│       └── 004_organizations.sql
│
├── docs/                  # Documentation
│   ├── architecture.md
│   ├── api-reference.md
│   ├── development-guide.md
│   └── database-schema.md
│
├── CLAUDE.md              # Claude Code guidance
├── CONTRIBUTING.md        # This file
├── DEPLOYMENT.md          # Deployment & staging setup
└── package.json           # Root workspace config
```

---

## Branching & Commits

### Branch Naming

Use **feature/**, **fix/**, **docs/**, or **refactor/** prefixes:

```bash
# Feature branch
git checkout -b feature/add-patient-export

# Bug fix
git checkout -b fix/pdf-parsing-error

# Documentation
git checkout -b docs/update-deployment-guide

# Refactor
git checkout -b refactor/consolidate-auth-middleware
```

### Commit Messages

Follow conventional commits format (simplified):

```
<type>: <short description>

<optional body with details>
```

**Types**:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `refactor:` Code restructuring (no feature change)
- `test:` Test additions or updates
- `chore:` Dependencies, tooling, config

**Examples**:

```
feat: add patient export to CSV

Implements POST /api/patients/:id/export endpoint with Zod validation.
Adds test coverage for export with various patient states.

fix: handle malformed PDF headers gracefully

Catches pdf-parse errors and returns 400 with descriptive message
instead of 500 server error.

docs: update deployment checklist for production

Added pre-flight checks and rollback procedures.
```

### Commit Best Practices

- **Keep commits atomic** — one logical change per commit
- **Never force-push to main** — always create a new PR
- **Sign commits if possible** — `git commit -S`
- **Don't commit** `.env`, `node_modules`, `dist/`, `.DS_Store`, auth tokens

---

## Testing Requirements

### All PRs must pass:

1. **Linting**
   ```bash
   yarn lint
   ```

2. **Backend Tests (Jest + Supertest)**
   ```bash
   yarn workspace backend test
   ```

3. **Frontend Tests (Vitest + React Testing Library)**
   ```bash
   yarn workspace frontend test
   yarn workspace frontend test:watch  # for development
   ```

4. **Frontend E2E Tests (Playwright)** — if modifying UI flows
   ```bash
   # Requires frontend/.env.e2e.local (see .env.e2e.example)
   yarn workspace frontend test:e2e
   ```

### Test Coverage Expectations

- **Backend services** (claudeService, deidentify, etc.): ≥80% coverage
- **Frontend hooks** (usePatients, useReports, etc.): ≥70% coverage
- **API routes**: All success + error paths tested
- **Critical flows** (auth, report upload, AI analysis): Full E2E coverage

### Writing Tests

**Backend Example (Jest)**:
```typescript
import request from 'supertest';
import app from '../index';

describe('GET /api/health', () => {
  it('should return 200 with status ok', async () => {
    const res = await request(app)
      .get('/api/health')
      .expect(200);

    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('version');
  });
});
```

**Frontend Example (Vitest)**:
```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PatientCard from '../PatientCard';

describe('PatientCard', () => {
  it('displays patient name', () => {
    render(<PatientCard patient={{ id: '1', full_name: 'Jane Doe' }} />);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });
});
```

---

## Pull Request Process

### Before Creating a PR

1. **Pull latest main**
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Run all checks locally**
   ```bash
   yarn lint
   yarn workspace backend test
   yarn workspace frontend test
   yarn build
   ```

3. **Test in the app manually** (if UI changes)
   ```bash
   yarn dev
   # Test the feature in http://localhost:5173
   ```

### Creating a PR

1. **Push your branch**
   ```bash
   git push -u origin feature/your-feature-name
   ```

2. **Open PR on GitHub** with:
   - **Title**: One-line description of the change
   - **Description**: Follow the template below
   - **Link any related issues**: e.g., "Closes #140"

### PR Description Template

```markdown
## Description
Brief explanation of what this PR does and why.

## Changes
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Ran `yarn lint`
- [ ] Ran `yarn workspace backend test`
- [ ] Ran `yarn workspace frontend test`
- [ ] Tested manually (if UI changes)
- [ ] Updated docs (if needed)

## Related Issues
Closes #<issue_number>
```

### PR Review Expectations

- **Target reviewer**: Listed in CODEOWNERS (if defined)
- **Response time**: 24-48 hours
- **Status checks**: All GitHub Actions must pass
- **Approval required**: At least 1 approval before merge

### Merging

- Rebase and squash commits if many small ones
- Delete branch after merge (GitHub does this automatically)

---

## Code Conventions

### TypeScript

- **No `any`** — use `unknown` or proper types
- **Strict mode enabled** in all tsconfigs
- **Path alias**: `@/` maps to `frontend/src/`

```typescript
// Good
function parseReport(data: unknown): Report {
  if (!isReport(data)) throw new Error('Invalid report');
  return data;
}

// Bad
function parseReport(data: any): any {
  return data;
}
```

### File Size Limits

- **Components**: ≤200 lines (split into sub-components if larger)
- **Service files**: ≤200 lines (split into focused utilities)
- **Controllers**: ≤150 lines per handler
- **Routes**: ≤100 lines

### Naming Conventions

```typescript
// Components (PascalCase)
PatientCard.tsx, ReportAnalyzer.tsx

// Hooks (camelCase with 'use' prefix)
usePatients.ts, useReports.ts

// Services/utilities (camelCase)
claudeService.ts, deidentify.ts

// Shared types (no separate file if <10 lines)
shared/types/index.ts

// Constants (SCREAMING_SNAKE_CASE if exported)
const MAX_FILE_SIZE_MB = 40;
```

### Imports & Exports

```typescript
// Prefer named exports
export const usePatients = () => { ... };
export const PatientCard: React.FC<Props> = () => { ... };

// Default exports only for pages/routes
export default Dashboard;

// Group imports: external, internal, types
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PatientCard } from '@/components';
import type { Patient } from 'shared/types';
```

### Environment Variables

Add new required backend env vars to `backend/src/utils/validateEnv.ts`:

```typescript
const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  SUPABASE_URL: z.string().url(),
  ANTHROPIC_API_KEY: z.string(),
  // ... add new vars here
});
```

Frontend env vars must start with `VITE_` to be exposed to Vite:

```
VITE_API_URL=http://localhost:3001/api
VITE_SUPABASE_URL=https://xyz.supabase.co
```

### PHI & Security

- **Never log** patient names, DOBs, emails, report content, or other PHI
- **Never return** PHI in error responses to the frontend
- **Always de-identify** before sending to Anthropic Claude
- See `backend/src/services/deidentify.ts` for details

### Comments & Documentation

```typescript
// Explain the "why", not the "what"
// Good:
// We batch updates to reduce database load during peak hours
const batchSize = 100;

// Bad:
// Set batch size to 100
const batchSize = 100;
```

For public APIs, use JSDoc:

```typescript
/**
 * Analyzes a radiology report and extracts structured findings.
 * @param reportText - Raw PDF text (de-identified before processing)
 * @param patientId - Patient ID for audit logging
 * @returns Promise<AnalysisResult> with BI-RADS, findings, recommendations
 * @throws Error if Claude API fails or text is invalid
 */
export async function analyzeReport(
  reportText: string,
  patientId: string
): Promise<AnalysisResult> {
  // ...
}
```

---

## Common Tasks

### Adding a New API Endpoint

1. **Create controller** in `backend/src/controllers/newFeatureController.ts`
2. **Create route** in `backend/src/routes/newFeature.ts`
3. **Mount route** in `backend/src/index.ts`
4. **Add type** in `shared/types/index.ts`
5. **Test it** with Jest + Supertest
6. **Document it** in [API-DOCUMENTATION.md](API-DOCUMENTATION.md)

Example:
```typescript
// routes/newFeature.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as controller from '../controllers/newFeatureController';

const router = Router();

/**
 * GET /api/new-feature/:id
 * Fetch a new feature by ID
 */
router.get('/:id', requireAuth, controller.getFeature);

export default router;
```

### Adding a New Frontend Component

1. **Create component** in `frontend/src/components/MyComponent.tsx`
2. **Keep it ≤200 lines** (split into sub-components if larger)
3. **Add prop types** at the top
4. **Export from index** in `frontend/src/components/index.ts`
5. **Write tests** in `frontend/src/components/__tests__/MyComponent.test.tsx`
6. **Use it** in a page

```typescript
// components/MyComponent.tsx
import React from 'react';

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, onAction }) => {
  return <div onClick={onAction}>{title}</div>;
};
```

### Adding a New Database Table

1. **Create migration** in `supabase/migrations/005_*.sql`
2. **Add RLS policy** in same migration file
3. **Add type** in `shared/types/index.ts`
4. **Apply locally** with `supabase db push`
5. **Commit** and document in [docs/database-schema.md](docs/database-schema.md)

### Updating Dependencies

```bash
# Add backend dependency
yarn workspace backend add lodash

# Add frontend dependency
yarn workspace frontend add react-hook-form

# Add root dev dependency
yarn add -D -W prettier

# Never use `npm install` — always use `yarn`
```

### Running Migrations in Production

See [DEPLOYMENT.md](DEPLOYMENT.md#applying-database-migrations).

### Debugging

**Backend**:
```bash
# Run with verbose logging
NODE_DEBUG=* yarn workspace backend dev

# Inspect with Chrome DevTools
node --inspect-brk ./node_modules/.bin/jest
```

**Frontend**:
```bash
# React DevTools browser extension
# Redux DevTools (if using Redux)
# Network tab in Chrome DevTools for API debugging
```

---

## Questions?

- Check existing documentation in [docs/](docs/)
- Review [CLAUDE.md](CLAUDE.md) for architecture details
- Ask in GitHub Discussions or Slack

Thank you for contributing! 🎉
