# Deployment & Testing Guide - Issues #20, #21, #23

## Overview
This guide covers deploying the organization/team sharing features and improved UX to production via Vercel, with comprehensive testing.

## Pre-Deployment Checklist

### ✅ Code Quality
- [x] Backend compiles successfully (`yarn workspace backend build`)
- [x] Frontend compiles successfully (`yarn workspace frontend build`)
- [x] TypeScript type checking passes
- [x] No compilation errors or warnings

### ✅ Build Artifacts
- [x] Backend dist folder created: `/backend/dist/`
- [x] Frontend dist folder created: `/frontend/dist/`
- [x] All source maps generated for debugging

### ✅ Code Changes
- [x] Database migration created: `supabase/migrations/004_organizations.sql`
- [x] Backend organization controller implemented
- [x] Backend organization routes registered
- [x] Frontend Teams page created
- [x] Frontend Add Patient form refactored with tabs
- [x] Navigation updated with Teams link
- [x] All changes backward compatible

## Deployment Steps

### Step 1: Apply Database Migration

```bash
# Option A: Via Supabase Dashboard
1. Go to https://app.supabase.com
2. Select the rad-report-ai project
3. Go to SQL Editor
4. Create new query
5. Paste contents of: supabase/migrations/004_organizations.sql
6. Click "Run" to apply migration

# Option B: Via Supabase CLI (if configured locally)
cd supabase
supabase db push
```

**Expected Result**: 
- New tables created: `organizations`, `organization_members`
- Foreign keys added to `patients`, `radiology_reports`, `treatment_records`, `audit_logs`
- RLS policies applied to organization tables
- Indexes created for performance

### Step 2: Deploy Backend to Vercel

```bash
# Method 1: Via Git Push (if Vercel is connected to GitHub)
git push origin main
# Vercel will automatically deploy on push to main branch

# Method 2: Via Vercel CLI (manual deployment)
cd backend
vercel deploy --prod
```

**Expected Result**:
- Backend endpoint deployed and live
- Environment variables configured (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY)
- Health check passes: `GET /health` returns `{ status: 'ok' }`
- New organization endpoints available at `/api/organizations`

### Step 3: Deploy Frontend to Vercel

```bash
# Method 1: Via Git Push
git push origin main

# Method 2: Via Vercel CLI
cd frontend
vercel deploy --prod
```

**Expected Result**:
- Frontend deployed and live
- SPA loads without errors
- All routes accessible
- Teams page available at `/teams`
- Add Patient dialog works with new tabbed form

## Post-Deployment Verification

### 1. Health Checks (5 minutes)

```bash
# Check backend health
curl https://your-backend.vercel.app/health

# Check frontend loads
curl https://your-frontend.vercel.app/
# Should return HTML with <title>RadReport AI</title>
```

### 2. Database Connectivity (10 minutes)

- [ ] Login to frontend with valid credentials
- [ ] Verify no database connection errors in console
- [ ] Check network tab - API calls to `/api/` endpoints succeed

### 3. Organization Feature Tests (15 minutes)

**Test 3.1: Create Organization**
```
1. Login to app
2. Navigate to Settings > Teams
3. Click "Create Organization"
4. Fill form: Name="Test Org 1", Description="Testing"
5. Submit
Expected: Organization appears in list, owned by current user
```

**Test 3.2: List Organizations**
```
1. Navigate to /teams
2. Should see "Test Org 1" in dropdown
Expected: Organization appears with member count = 1 (you)
```

**Test 3.3: Invite Team Member**
```
1. In Teams page, select "Test Org 1"
2. Click "Invite Member"
3. Enter email: clinician@example.com, Role: Clinician
4. Submit
Expected: Member added to list with "Clinician" role (if user exists in system)
```

**Test 3.4: Update Member Role**
```
1. In member list, find invited member
2. Change role dropdown to "Admin"
3. Save
Expected: Member role updates in list and database
```

**Test 3.5: Remove Member**
```
1. Click "Remove" on a member
2. Confirm deletion
Expected: Member removed from list
```

### 4. Patient Management with Organizations (10 minutes)

**Test 4.1: Create Patient in Organization**
```
1. Navigate to /patients
2. Click "Add Patient"
3. Fill required fields (Basic Info tab)
4. Switch to Cancer Details tab
5. Fill required fields there
6. Switch to Biomarkers tab
7. Select optional biomarker values
8. Switch to Treatment tab
9. Enter treatment plan
10. Submit
Expected: Patient created, form tabs work smoothly, patient appears in list
```

**Test 4.2: Verify Form UX**
```
1. Open Add Patient dialog
2. Verify all tabs are visible: Basic Info, Cancer Details, Biomarkers, Treatment
3. Click through each tab
4. Enter data in each tab
5. Switch between tabs
Expected: Data persists when switching tabs, no data loss, clean layout
```

### 5. Role-Based Access Control (15 minutes)

**Test 5.1: Viewer Cannot Edit**
```
1. Create second test user account (if possible)
2. First user: Create org, invite second user as "Viewer"
3. First user: Create a patient in the organization
4. Second user: Login
5. Second user: Navigate to patient
Expected: Patient visible but Edit button disabled/not visible
```

**Test 5.2: Clinician Can Edit**
```
1. First user: Change second user role to "Clinician"
2. Second user: Refresh patient page
3. Second user: Edit patient
Expected: Edit button enabled, can modify patient data
```

**Test 5.3: Non-Member Cannot See**
```
1. Create third test user
2. Third user: Login
3. Third user: Navigate to /patients
Expected: Cannot see organization's patients, only own
```

### 6. Audit Logging (5 minutes)

**Test 6.1: Team Actions Logged**
```
1. Perform these actions:
   - Create organization
   - Invite member
   - Update member role
   - Remove member
2. Check database audit_logs table for these actions
Expected: All actions logged with organization_id, timestamp, user_id
```

### 7. Error Handling (10 minutes)

**Test 7.1: Invalid Role**
```
POST /api/organizations/{orgId}/members/invite
Body: { email: "user@test.com", role: "invalid-role" }
Expected: 400 Bad Request with error message
```

**Test 7.2: Unauthorized Access**
```
1. Get organization ID from User A's organization
2. Login as User B
3. Try to update User A's organization: PATCH /api/organizations/{orgId}
Expected: 403 Forbidden (not owner)
```

**Test 7.3: Duplicate Invite**
```
1. Invite user@example.com to organization
2. Try to invite same email again
Expected: 400 Bad Request - "User is already a member"
```

### 8. Backward Compatibility (5 minutes)

**Test 8.1: Existing Data Access**
```
1. Verify patients created before this deployment still accessible
2. Verify reports still visible
3. Verify treatments still accessible
Expected: All existing data works as before (org_id is NULL, RLS allows access)
```

## Rollback Plan

If critical issues are found in production:

### Immediate Actions
1. **Disable new features** by routing `/api/organizations` to error handler
2. **Revert frontend** deployment to previous version
3. **Preserve data** - don't drop database tables

### Rollback Steps
```bash
# 1. Revert to previous backend version in Vercel
vercel rollback

# 2. Revert to previous frontend version
vercel rollback

# 3. If database issues, database migration is safe to keep 
#    (org_id columns have defaults, don't affect existing queries)
```

## Monitoring

### Health Metrics to Track
- [ ] Backend uptime (should be >99.9%)
- [ ] API response times (should be <200ms for organization queries)
- [ ] Database query performance (check Supabase logs)
- [ ] Error rates (should be <0.1% for new endpoints)
- [ ] User adoption (count organizations created)

### Logs to Monitor
```bash
# Backend error logs
vercel logs [backend-project]

# Database logs
supabase logs --project-ref=[project-id]

# Frontend errors (via Sentry if configured)
https://sentry.io/organizations/[org]/issues/
```

## Testing Checklist Summary

### Critical Path (30 minutes)
- [ ] Organization creation works
- [ ] Member invitation works
- [ ] Add Patient form displays all tabs
- [ ] Role-based access control enforced
- [ ] Existing data still accessible

### Extended Testing (1-2 hours)
- [ ] All API endpoints respond correctly
- [ ] Error handling works as expected
- [ ] Audit logs created for team actions
- [ ] UI is responsive and functional
- [ ] No console errors or warnings
- [ ] Authentication still works correctly

### Production Certification
Once all tests pass:
- [ ] Mark PR as "Ready for Review"
- [ ] Request review from team
- [ ] After approval, merge to main
- [ ] Deploy to production
- [ ] Monitor for 24 hours
- [ ] Document any issues found

## Contacts & Support

For deployment issues:
- Check Vercel deployment logs: https://vercel.com/dashboard
- Check Supabase logs: https://app.supabase.com
- Review database migrations: https://app.supabase.com/project/[id]/sql/migrations

---

**Deployment Date**: 2026-06-06
**PR**: https://github.com/RaphaelThineyUE/rad-report-ai/pull/24
**Features**: Organizations (#20), Team Sharing (#21), Form UX (#23)
