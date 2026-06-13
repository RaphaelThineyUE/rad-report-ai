# P1/P2 Implementation Guide - Remaining Work

## Status Summary

**Completed**:
- ✅ AppError class + error handler middleware
- ✅ Audit logging service infrastructure  
- ✅ Deployment & migration documentation
- ✅ patientController updated with AppError + audit logging
- ✅ authController updated with AppError + audit logging

**In Progress**:
- 🔄 reportController (needs AppError + audit logging)
- 🔄 treatmentController (needs AppError + audit logging)
- 🔄 aiController (needs audit logging only)
- 🔄 Other controllers (adminController, analyticsController, organizationController)

**Infrastructure Verified**:
- ✅ wrapAuth middleware in place - catches errors from async handlers ✓
- ✅ Error handler middleware will normalize AppError responses ✓
- ✅ Audit logging is fire-and-forget (won't block requests) ✓

---

## Quick Implementation Checklist

### reportController (`backend/src/controllers/reportController.ts`)
Lines to update for AppError (imports + error handling):

```typescript
// Add imports (line 11-13):
import { AppError, Errors } from '../utils/AppError.js';
import { logReportAudit } from '../services/auditService.js';

// Functions to update:
- uploadReport (line 113): Add logReportAudit call + replace error responses
- batchUploadReports (line 176): Same pattern
- createReport (line 359): logReportAudit + AppError
- updateReport (line 443): logReportAudit + AppError
- deleteReport (line 473): logReportAudit + AppError
- processReport (line 559): logReportAudit + AppError
- getReport (line 426): AppError only (read-only)
- getReportSignedUrl (line 325): AppError only (read-only)
- exportReportJson (line 512): AppError only (read-only)
- listReports (line 396): AppError only (read-only)
```

### treatmentController (`backend/src/controllers/treatmentController.ts`)
Similar pattern to patientController:

```typescript
// Add imports:
import { AppError, Errors } from '../utils/AppError.js';
import { logTreatmentAudit } from '../services/auditService.js';

// Note: auditService needs logTreatmentAudit function
// Pattern: logTreatmentAudit(userId, action, treatmentId, token, ip, ua)

// Functions to update:
- createTreatment: logTreatmentAudit + AppError
- updateTreatment: logTreatmentAudit + AppError
- deleteTreatment: logTreatmentAudit + AppError
- getById: AppError only
- listByPatient: AppError only
```

### aiController (`backend/src/controllers/aiController.ts`)
Audit logging only (error handling likely already complete):

```typescript
// Add imports:
import { logAIAudit } from '../services/auditService.js';

// Functions to update:
- analyzeReport: logAIAudit('analyze_report', reportId)
- summarizeReport: logAIAudit('generate_summary', reportId)
- consolidateReports: logAIAudit('consolidate_reports', ?)
- compareTreatments: logAIAudit('compare_treatments', ?)
- detectBiradsTrend: logAIAudit('detect_birads_trend', ?)
- extractQuotes: logAIAudit('extract_quotes', ?)
```

### auditService Update
Need to add missing convenience function (if not already there):

```typescript
export function logTreatmentAudit(
  userId: string,
  action: string,
  treatmentId: string,
  accessToken: string,
  ipAddress?: string,
  userAgent?: string
): void {
  logAudit(
    {
      userId,
      action,
      resourceType: 'treatment',
      resourceId: treatmentId,
      ipAddress,
      userAgent,
    },
    accessToken
  );
}
```

---

## Error Response Pattern

All errors should now use this pattern:

```typescript
// ✅ GOOD - Uses AppError
throw Errors.notFound('Patient');
throw Errors.validation('Invalid input', errors.array());
throw Errors.internal('Database error');

// ❌ OLD - Direct response (REPLACE)
res.status(404).json({ error: 'Patient not found' });
res.status(422).json({ errors: errors.array() });
res.status(500).json({ error: 'Database error' });
```

**Normalized response format** (error handler will format this):
```json
{
  "error": {
    "code": "PATIENT_NOT_FOUND",
    "message": "Patient not found",
    "timestamp": "2026-06-13T07:40:05.123Z"
  }
}
```

---

## Audit Logging Pattern

For write operations (POST, PATCH, DELETE):

```typescript
// After successful operation:
logPatientAudit(req.userId, 'create_patient', patientId, req.accessToken, req.ip, req.get('user-agent'));

// Key points:
// - Call AFTER the operation succeeds
// - Fire-and-forget: doesn't block the response
// - Failures logged but don't affect the main request
// - req.ip and req.get('user-agent') are optional but recommended
```

---

## Testing Verification

After implementing all changes, verify:

1. **Error Format**: Make a failed request and check response format is `{ error: { code, message, timestamp } }`
2. **Audit Logs**: Make a create/update/delete operation, then query `audit_logs` table in Supabase
3. **No Breaking Changes**: Existing clients should still work (error format is evolved, not broken)

Test requests:
```bash
# Test 404 error
curl -X GET http://localhost:3001/api/patients/nonexistent \
  -H "Authorization: Bearer $TOKEN"

# Test validation error  
curl -X POST http://localhost:3001/api/patients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"full_name":""}' # missing required fields

# Test audit log
SELECT * FROM audit_logs WHERE action = 'create_patient' LIMIT 1;
```

---

## Remaining Issues Mapping

| Issue | Status | Implementation |
|-------|--------|-----------------|
| #127 | 📚 Docs | DEPLOYMENT.md complete |
| #128 | ✅ Done | Health endpoint verified |
| #130 | ⏳ Pending | Requires manual Sentry config |
| #131 | 📚 Docs | DEPLOYMENT.md complete |
| #132 | 📚 Docs | MIGRATIONS.md complete |
| #133 | 🔄 In Progress | Infrastructure done, need controller integration |
| #134 | 🔄 In Progress | Infrastructure done, need controller rollout |
| #135 | ✅ Done | Zod schemas already complete |

---

## Token Usage Notes

This implementation spans:
- 3 commits (infrastructure + patientController + this guide)
- ~900 lines added
- ~20 lines modified in existing code

Next phase should focus on:
1. Bulk update of remaining controllers (can be done in parallel)
2. Test suite validation
3. Staging environment setup

---

## File Locations

Key files to reference:
- `backend/src/utils/AppError.ts` — Error class
- `backend/src/services/auditService.ts` — Audit logging
- `backend/src/middleware/errorHandler.ts` — Error normalization
- `backend/src/routes/*.ts` — wrapAuth pattern (error catching)
- `DEPLOYMENT.md` — Staging/production setup
- `MIGRATIONS.md` — Database validation
- `P1-P2_STATUS.md` — Overall progress tracking
