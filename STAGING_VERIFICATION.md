# Staging Environment Verification Checklist

Run this checklist after deploying to staging to verify all P1/P2 implementations are working.

## Pre-Flight Checks

- [ ] Staging Supabase project created
- [ ] All migrations (001-005) applied successfully
- [ ] Staging Vercel frontend deployed
- [ ] Staging Vercel backend deployed
- [ ] Environment variables configured for staging

---

## 1. Health Check (#128) ✅

```bash
# Should return 200 with version info
curl -X GET https://<backend-staging>/api/health

# Expected response:
# {
#   "status": "ok",
#   "version": "<git-sha>",
#   "timestamp": "2026-06-13T13:54:37Z"
# }
```

**Pass/Fail**: [ ] ___

---

## 2. Error Format Validation (#134)

### Test 404 Error
```bash
curl -X GET https://<backend-staging>/api/patients/invalid-id \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Expected response (404):
# {
#   "error": {
#     "code": "NOT_FOUND",
#     "message": "Patient not found",
#     "timestamp": "2026-06-13T13:54:37Z"
#   }
# }
```

**Pass/Fail**: [ ] ___

### Test Validation Error
```bash
curl -X POST https://<backend-staging>/api/patients \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"full_name":""}'

# Expected response (422):
# {
#   "error": {
#     "code": "VALIDATION_ERROR",
#     "message": "Invalid patient data",
#     "details": [...]
#   }
# }
```

**Pass/Fail**: [ ] ___

---

## 3. Audit Logging (#133)

### Create Patient and Verify Audit Log
```bash
# 1. Create a test patient
curl -X POST https://<backend-staging>/api/patients \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test Patient",
    "date_of_birth": "1990-01-01",
    "gender": "Male",
    "diagnosis_date": "2024-01-01",
    "cancer_type": "Breast",
    "cancer_stage": "Stage II"
  }'

# Note: Save the patient ID from response

# 2. Query audit_logs in Supabase SQL Editor
SELECT * FROM audit_logs 
WHERE action = 'create_patient' 
ORDER BY created_at DESC 
LIMIT 1;

# Expected: Entry with user_id, action='create_patient', resource_type='patient', resource_id=<patient_id>
```

**Pass/Fail**: [ ] ___

### Verify Audit Log for Update
```bash
# 1. Update patient
curl -X PATCH https://<backend-staging>/api/patients/<patient-id> \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"gender": "Female"}'

# 2. Query audit_logs again
SELECT * FROM audit_logs 
WHERE action = 'update_patient' AND resource_id = '<patient-id>'
ORDER BY created_at DESC 
LIMIT 1;

# Expected: Entry with action='update_patient'
```

**Pass/Fail**: [ ] ___

### Verify Audit Log for Delete
```bash
# 1. Delete patient
curl -X DELETE https://<backend-staging>/api/patients/<patient-id> \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 2. Query audit_logs
SELECT * FROM audit_logs 
WHERE action = 'delete_patient' AND resource_id = '<patient-id>'
ORDER BY created_at DESC 
LIMIT 1;

# Expected: Entry with action='delete_patient'
```

**Pass/Fail**: [ ] ___

---

## 4. API Connectivity (#127)

### Frontend Can Reach Backend
```bash
# In browser console (staging frontend):
fetch('https://<backend-staging>/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)

# Expected: Logs health check response
```

**Pass/Fail**: [ ] ___

### Dashboard Loads with Data
- [ ] Open staging frontend dashboard
- [ ] Verify no console errors
- [ ] Verify patient list loads
- [ ] Verify reports can be viewed
- [ ] Verify analytics render

**Pass/Fail**: [ ] ___

---

## 5. Staging Environment Validation (#131, #132)

### Database Migrations Applied
```bash
# Query all tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

# Expected tables:
# - audit_logs ✓
# - organizations ✓
# - org_members ✓
# - patients ✓
# - radiology_reports ✓
# - treatment_records ✓
# - users ✓
```

**Pass/Fail**: [ ] ___

### RLS Policies Enabled
```bash
# Check RLS policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
ORDER BY tablename;

# Expected: Multiple policies for each table
```

**Pass/Fail**: [ ] ___

### Storage Bucket Configured
```bash
# Check bucket exists and is private
SELECT name, owner, public 
FROM storage.buckets 
WHERE name = 'reports';

# Expected: reports bucket with public=false
```

**Pass/Fail**: [ ] ___

---

## 6. Observability (#130)

### Sentry Errors Captured (Optional)
- [ ] Trigger test error in staging
- [ ] Verify error appears in Sentry dashboard
- [ ] Verify error includes proper context (user_id, request_id)

**Pass/Fail**: [ ] ___

### Function Logs Available
- [ ] Open Vercel dashboard
- [ ] Navigate to Function Logs
- [ ] Verify recent requests appear with status codes

**Pass/Fail**: [ ] ___

---

## Summary

**Total Checks**: 13 (14 if including Sentry)
**Passed**: ___/13
**Failed**: ___/13

### Issues Found

If any checks failed, document them here:

1. _______________
2. _______________
3. _______________

---

## Sign-Off

- **Tested By**: _______________
- **Date**: _______________
- **Environment**: Staging
- **Status**: [ ] All Checks Passed ✅ | [ ] Issues Found ⚠️

---

## Next Steps

- [ ] If all passed → ready for production deployment
- [ ] If issues found → fix in branch, redeploy to staging, re-verify
- [ ] Create GitHub issues for any blockers

---

## Quick Reference

**Staging URLs**:
- Frontend: https://<frontend-staging>/dashboard
- Backend: https://<backend-staging>/api/health
- Supabase: https://supabase.com/dashboard (select staging project)

**Common Commands**:
```bash
# Test endpoint with auth
TOKEN=$(curl -s -X POST https://<supabase-url>/auth/v1/token \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' | jq -r '.access_token')

curl -H "Authorization: Bearer $TOKEN" https://<backend-staging>/api/patients

# Check logs
Vercel dashboard → Settings → Function Logs

# Reset staging data
# Go to Supabase SQL Editor and run: TRUNCATE TABLE audit_logs;
```

---

**Documentation References**:
- See `DEPLOYMENT.md` for setup instructions
- See `MIGRATIONS.md` for database info
- See `P1-P2_STATUS.md` for issue details
- See `IMPLEMENTATION_GUIDE.md` for error patterns
