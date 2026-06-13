# Deployment Guide

## Overview
This document covers deploying rad-report-ai to production and staging environments with Vercel and Supabase.

## Architecture
```
Browser (React + Vite)
    ↓ HTTPS / JWT Token
Frontend (Vercel)
    ↓ API calls with Authorization header
Backend API (Vercel Functions / Node.js)
    ↓ SQL + Auth
Supabase (PostgreSQL + Auth + Storage)
```

## Production Deployment Setup

### Prerequisites
- Vercel account with project created
- Supabase project (production)
- Supabase project (staging) — separate from production
- GitHub repository connected to Vercel

### 1. Supabase Project (Production)

#### Create Project
1. Go to https://supabase.com/dashboard
2. Create new project (or use existing)
3. Note the project URL and API keys:
   - Project URL: `https://<project-id>.supabase.co`
   - Anon key: Public key (safe to expose in frontend)
   - Service role key: Private key (backend only)

#### Apply Migrations
```bash
# Using Supabase CLI
supabase link --project-ref <project-id>
supabase db push

# Or manually via SQL editor:
# 1. Open Supabase dashboard → SQL Editor
# 2. Run 001_initial_schema.sql
# 3. Run 002_rls_policies.sql
# 4. Run 003_storage_policies.sql
# 5. Run 004_organizations.sql
# 6. Run 005_breast_imaging_schema.sql
```

#### Create Storage Bucket
1. Supabase dashboard → Storage
2. Create bucket named `reports` (must match STORAGE_BUCKET env var)
3. Make it **private** (not public)
4. No additional policies needed (RLS in 003_storage_policies.sql handles access)

#### Enable Auth
1. Supabase dashboard → Authentication
2. Configure providers (Email + Password is already configured)
3. Note: SMTP must be configured for password reset emails

### 2. Vercel Frontend Deployment

#### Environment Variables
Create `.env.production` or set in Vercel dashboard:

```env
# Frontend Environment
VITE_API_URL=https://<backend-vercel-domain>/api
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_SENTRY_DSN=<your-sentry-dsn>
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1

# Build-time Sentry source map upload (optional)
SENTRY_AUTH_TOKEN=<your-sentry-auth-token>
SENTRY_ORG=<your-sentry-org>
SENTRY_PROJECT=<your-sentry-project>
```

#### Deploy
```bash
# Via Vercel CLI
vercel --prod

# Or via GitHub: push to main → automatic deployment
```

### 3. Vercel Backend Deployment

The backend is deployed as Vercel Functions (serverless Node.js). See `backend/index.ts` for the entry point.

#### Environment Variables (Backend)
Set in Vercel dashboard under "Settings → Environment Variables":

```env
# Server
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://<frontend-vercel-domain>

# Supabase
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>

# Anthropic / Claude
ANTHROPIC_API_KEY=<your-anthropic-api-key>
ANTHROPIC_MODEL=claude-sonnet-4-6

# File Upload
MAX_FILE_SIZE_MB=40
STORAGE_BUCKET=reports

# Sentry
SENTRY_DSN=<your-sentry-dsn>
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1

# Git version tagging (auto-populated by Vercel)
VERCEL_GIT_COMMIT_SHA=<auto>
```

#### Deploy
```bash
# Via GitHub: push to main → automatic deployment
# Or via Vercel CLI: vercel --prod
```

### 4. Verify Production Setup

#### Health Check
```bash
curl https://<backend-vercel-domain>/api/health
# Expected: { "status": "ok", "version": "<git-sha>", "timestamp": "2026-06-13T..." }
```

#### Frontend Connectivity
1. Open https://<frontend-vercel-domain>/dashboard
2. Check browser console for network errors
3. Verify API calls succeed (Network tab in DevTools)
4. Dashboard should load real patient data

#### Monitoring
- Sentry dashboard for error tracking
- Vercel analytics for function performance
- Supabase dashboard for database queries

---

## Staging Deployment Setup

### Overview
Staging is a **full copy** of production for testing:
- Separate Supabase project
- Separate Vercel environment
- Separate frontend domain
- Production-like configuration

### Steps

#### 1. Create Staging Supabase Project
1. Supabase dashboard → Create new project
2. Name: `<project>-staging`
3. Repeat all migration and setup steps from **Production Deployment** section
4. Note the project ID and keys

#### 2. Create Staging Vercel Environment
```bash
# Create preview environment for staging branch
# Option A: Create branch in GitHub (e.g., `staging`)
#   → Vercel auto-creates preview deployment

# Option B: Manual Vercel project
vercel --project <project-id> --scope <scope>
```

#### 3. Configure Staging Environment Variables
In Vercel dashboard, create a **Staging environment** with:

```env
# Same structure as production, but pointing to staging Supabase
VITE_API_URL=https://<backend-staging-domain>/api
VITE_SUPABASE_URL=https://<staging-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<staging-anon-key>

FRONTEND_URL=https://<frontend-staging-domain>
SUPABASE_URL=https://<staging-project-id>.supabase.co
SUPABASE_ANON_KEY=<staging-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<staging-service-role-key>
```

#### 4. Test Staging
```bash
# Health check
curl https://<backend-staging-domain>/api/health

# Load dashboard
open https://<frontend-staging-domain>/dashboard

# Run E2E tests against staging (if available)
yarn workspace frontend test:e2e --baseURL https://<frontend-staging-domain>
```

---

## Issue #127: Fix Production API Connectivity

### Symptom
- Frontend shows "Network Error" in console
- Dashboard and analytics display zero data
- API calls to `/api/...` fail with CORS or connection errors

### Root Causes
1. `VITE_API_URL` not set or incorrect in frontend `.env.production`
2. `FRONTEND_URL` not set or incorrect in backend (breaks CORS allow-list)
3. Supabase URL/keys missing or mismatched between frontend and backend
4. Backend not deployed or health check failing

### Checklist
- [ ] `VITE_API_URL` set to backend Vercel domain
- [ ] Backend `FRONTEND_URL` set to frontend Vercel domain
- [ ] `SUPABASE_URL` matches between frontend and backend
- [ ] `VITE_SUPABASE_ANON_KEY` and backend `SUPABASE_ANON_KEY` are identical
- [ ] `SUPABASE_SERVICE_ROLE_KEY` present in backend (never expose to frontend)
- [ ] `/api/health` returns 200
- [ ] Browser DevTools shows no CORS errors
- [ ] Frontend can fetch `/api/health`

### Debug Steps
```bash
# 1. Check backend is running
curl https://<backend-domain>/api/health

# 2. Check CORS headers
curl -H "Origin: https://<frontend-domain>" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS https://<backend-domain>/api/health

# 3. Check frontend can resolve API URL
# In browser console:
fetch('https://<backend-domain>/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

---

## Issue #131: Create Full Staging Environment

### Checklist
- [ ] Staging Supabase project created (001-005 migrations applied)
- [ ] Staging Storage bucket configured
- [ ] Staging Vercel frontend deployed with correct env vars
- [ ] Staging Vercel backend deployed with correct env vars
- [ ] `/api/health` on staging returns 200
- [ ] Staging frontend can load dashboard with real data
- [ ] E2E tests pass against staging

### Related Issues
- #127: Fix Production API Connectivity
- #128: Add Backend Health Check Endpoint (✅ Done)
- #130: Enable Vercel Observability + Error Logging
- #132: Validate All Database Migrations
