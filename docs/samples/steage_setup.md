# Staging Environment Setup - Step-by-Step Guide

**Estimated Time**: 1-2 hours
**Status**: Ready to execute

---

## Prerequisites

Before you start, you'll need:
- [ ] Supabase account (https://supabase.com)
- [ ] Vercel account connected to GitHub
- [ ] Git configured locally
- [ ] Node.js 18+ installed
- [ ] PostgreSQL client tools (optional, for manual SQL)

---

## Phase 1: Create Supabase Staging Project (15 mins)

### Step 1.1: Create Staging Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in:
   - **Name**: `rad-report-ai-staging`
   - **Database password**: Generate a strong password (save it!)
   - **Region**: Same as production (or closest available)
4. Click **"Create new project"**
5. Wait for project to initialize (~2 minutes)

### Step 1.2: Get Staging Credentials

Once initialized:

1. Go to **Settings → API**
2. Copy and save:
   ```
   Project URL: https://<project-id>.supabase.co
   Anon Key: <anon-key>
   Service Role Key: <service-role-key>
   ```
3. Go to **Settings → Database**
4. Copy connection string (you may need this for manual migrations)

### Step 1.3: Apply Database Migrations

In Supabase SQL Editor:

1. Click **SQL Editor** in left sidebar
2. Click **New query**
3. Copy and paste each migration file **in order**:

```bash
# 1. Copy contents of supabase/migrations/001_initial_schema.sql
# Paste into SQL editor, click "Run"

# 2. Copy contents of supabase/migrations/002_rls_policies.sql  
# Paste and run

# 3. Copy contents of supabase/migrations/003_storage_policies.sql
# Paste and run

# 4. Copy contents of supabase/migrations/004_organizations.sql
# Paste and run

# 5. Copy contents of supabase/migrations/005_breast_imaging_schema.sql
# Paste and run
```

**Verify**: Go to **Database → Tables** and confirm you see all tables:
- audit_logs ✓
- organizations ✓
- org_members ✓
- patients ✓
- radiology_reports ✓
- treatment_records ✓
- users ✓

### Step 1.4: Create Storage Bucket

1. Click **Storage** in left sidebar
2. Click **Create a new bucket**
3. Name: `reports`
4. Make sure **Public** is UNCHECKED (private bucket)
5. Click **Create bucket**

---

## Phase 2: Deploy to Vercel Staging (30 mins)

### Step 2.1: Create Vercel Environment (Option A: Separate Projects)

**For Backend**:

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import from GitHub: select `rad-report-ai` repository
4. Name: `rad-report-ai-backend-staging`
5. Framework preset: **Other** (Node.js)
6. Build command: `yarn workspace backend build`
7. Install command: `yarn install`
8. Start command: `node dist/index.js` (Vercel doesn't use this, but fill it in)
9. Click **Deploy**

**For Frontend**:

1. Click **"Add New..."** → **"Project"**
2. Import from GitHub: select `rad-report-ai` repository
3. Name: `rad-report-ai-frontend-staging`
4. Framework preset: **Vite**
5. Build command: `yarn workspace frontend build`
6. Install command: `yarn install`
7. Output directory: `frontend/dist`
8. Click **Deploy**

### Step 2.2: Configure Environment Variables

**Backend Staging** (`rad-report-ai-backend-staging`):

1. Go to project settings
2. Click **Environment Variables**
3. Add these for the **Staging** environment:

```env
NODE_ENV=staging
PORT=3001
FRONTEND_URL=https://<your-frontend-staging-domain>
SUPABASE_URL=https://<staging-project-id>.supabase.co
SUPABASE_ANON_KEY=<staging-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<staging-service-role-key>
ANTHROPIC_API_KEY=<your-anthropic-api-key>
ANTHROPIC_MODEL=claude-sonnet-4-6
MAX_FILE_SIZE_MB=40
STORAGE_BUCKET=reports
SENTRY_DSN=<your-sentry-dsn-or-leave-blank>
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
```

**Frontend Staging** (`rad-report-ai-frontend-staging`):

1. Go to project settings
2. Click **Environment Variables**
3. Add for **Staging** environment:

```env
VITE_API_URL=https://<your-backend-staging-domain>
VITE_SUPABASE_URL=https://<staging-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<staging-anon-key>
VITE_SENTRY_DSN=<your-sentry-dsn-or-leave-blank>
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
```

**Important Notes**:
- Replace `<...>` with actual values
- For `VITE_API_URL`: Use the Vercel function URL (shown in Vercel dashboard)
- Keep Sentry DSN blank for now if you don't have one set up
- Redeploy both projects after setting env vars: Click **Redeploy** button

### Step 2.3: Get Staging Domains

After deployment:

1. **Backend**: Go to project → Deployments → Click production → Copy domain
   - Format: `https://rad-report-ai-backend-staging.vercel.app`
2. **Frontend**: Go to project → Deployments → Click production → Copy domain
   - Format: `https://rad-report-ai-frontend-staging.vercel.app`

Update the environment variables above with the actual domains!

---

## Phase 3: Verify Staging Deployment (20 mins)

### Step 3.1: Run Verification Checklist

Follow **STAGING_VERIFICATION.md** step-by-step:

```bash
# From project root
cat STAGING_VERIFICATION.md

# Test health check (copy this into browser or curl):
curl https://<backend-staging-domain>/api/health

# Expected response:
# {
#   "status": "ok",
#   "version": "<git-sha>",
#   "timestamp": "2026-06-13T..."
# }
```

### Step 3.2: Test Key Workflows

1. **Frontend loads**: Open `https://<frontend-staging-domain>`
   - Should see login page
   - No console errors

2. **Create test account**:
   - Click "Sign Up"
   - Enter email/password
   - Should redirect to dashboard

3. **Create test patient**:
   - Dashboard → Patients → Add Patient
   - Fill in form and submit
   - Should see patient in list

4. **Verify audit logging**:
   - Go to Supabase → SQL Editor
   - Run: `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5;`
   - Should see entries from your test actions

### Step 3.3: Fix Issues

If you encounter errors:

1. **Check Vercel logs**:
   - Go to Vercel project
   - Click **Deployments** → latest → **Logs**
   - Look for error messages

2. **Check Supabase logs**:
   - Go to Supabase dashboard
   - Click **Logs** in sidebar
   - Check for database/auth errors

3. **Common issues**:
   - **"Cannot reach backend"**: Frontend `VITE_API_URL` is wrong or backend env vars missing
   - **"Database error"**: Migrations didn't apply correctly
   - **"Storage error"**: Storage bucket not created or policy issue

---

## Phase 4: Merge to Production (10 mins)

### Step 4.1: Review PR #142

1. Go to GitHub → `rad-report-ai` → Pull Requests
2. Find **PR #142**: "P1/P2 Milestones: Error Handling, Audit Logging, and Deployment Docs"
3. Review the changes:
   - Check that error handling is standardized
   - Verify audit logging calls are added
   - Confirm documentation is complete
4. Click **Approve** (if satisfied)

### Step 4.2: Merge PR

1. Click **Merge pull request**
2. Choose **Squash and merge** (cleaner history)
3. Confirm merge
4. Delete branch (optional but clean)

### Step 4.3: Deploy to Production

This depends on your production setup:

**If using Vercel**:
1. Go to production Vercel projects
2. Verify they're connected to `main` branch
3. They should auto-deploy when PR merges
4. Monitor deployments in Vercel dashboard

**Manual deployment**:
1. Pull latest from `main`
2. Follow your production deployment process
3. Set production env vars (same structure as staging)

---

## Phase 5: Verify Production (15 mins)

### Step 5.1: Health Check

```bash
curl https://<production-backend-domain>/api/health

# Should return 200 with version info
```

### Step 5.2: Test Login

1. Open production frontend
2. Login with your test account from staging
3. Dashboard should load
4. Verify data is NOT carried over from staging (should be empty)

### Step 5.3: Quick Smoke Test

1. Create test patient
2. Check audit logs
3. Verify error handling (try invalid operations)

---

## Rollback Plan

If something goes wrong:

1. **Revert PR**: Click "Revert" on PR #142
2. **Redeploy**: Vercel will auto-redeploy from `main`
3. **Investigate**: Check logs and staging to identify issue
4. **Fix**: Make changes, re-test in staging, re-merge

---

## Timeline Estimate

- Phase 1 (Supabase): **15 mins**
- Phase 2 (Vercel): **30 mins**
- Phase 3 (Verify Staging): **20 mins**
- Phase 4 (Merge & Deploy): **10 mins**
- Phase 5 (Verify Production): **15 mins**

**Total: ~90 minutes** (1.5 hours)

---

## Support & Debugging

If you get stuck:

1. **Check STAGING_VERIFICATION.md** - Most common issues covered
2. **Check DEPLOYMENT.md** - Detailed architecture info
3. **Check logs**:
   - Vercel: Dashboard → Deployments → Logs
   - Supabase: Dashboard → Logs
   - Browser Console: Press F12 → Console tab
4. **Check env vars**: Verify all required vars are set correctly

---

## Post-Deployment

After successful production deployment:

- [ ] All health checks passing
- [ ] Users can login
- [ ] Error format is standardized (test with invalid requests)
- [ ] Audit logs are being recorded
- [ ] No console errors in browser
- [ ] Analytics/dashboard load correctly

---

## Checklist

Complete this before you start:

- [ ] Supabase account ready
- [ ] Vercel projects created
- [ ] Git branch `claude/gracious-darwin-t0nr9k` pulled locally
- [ ] Node.js 18+ installed
- [ ] All required API keys gathered

Ready to start? Go to **Phase 1: Create Supabase Staging Project**! 🚀
