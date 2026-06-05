# RAD-M8-2: Audit Logging for Sensitive User Actions

## Overview

The Audit Service (RAD-M8-2) logs all sensitive user actions to the `audit_logs` table with automatic PHI (Protected Health Information) redaction. This ensures compliance with HIPAA and enables forensic analysis of all protected data access and modifications.

## Architecture

### Components

1. **auditService.ts** - Service layer with functions to log specific actions
2. **auditLogger.ts** - Utility for PHI redaction and metadata sanitization
3. **004_audit_logs_metadata.sql** - Database migration adding metadata column
4. **Controllers** - Integration points in report, patient, and auth controllers

### Data Flow

```
Controller Action
  ↓
audit Service Function
  ↓
redactMetadata (PHI removal)
  ↓
Supabase audit_logs table
```

## Sensitive Actions Logged

### 1. File Uploads
**Action**: `FILE_UPLOAD`  
**Endpoint**: `POST /api/reports/upload`  
**Metadata**:
- `filename`: Original PDF filename
- `patient_id`: UUID of patient
- `file_size_bytes`: Size in bytes
- `timestamp`: When upload occurred

### 2. Report Views
**Action**: `REPORT_VIEW`  
**Endpoint**: `GET /api/reports/:id`  
**Metadata**:
- `report_id`: UUID of viewed report
- `patient_id`: UUID of associated patient
- `timestamp`: When report was accessed

### 3. Report Deletion
**Action**: `REPORT_DELETE`  
**Endpoint**: `DELETE /api/reports/:id`  
**Metadata**:
- `report_id`: UUID of deleted report
- `patient_id`: UUID of associated patient
- `reason`: Deletion reason
- `timestamp`: When deletion occurred

### 4. Patient Data Changes
**Action**: `PATIENT_CREATE` | `PATIENT_UPDATE` | `PATIENT_DELETE`  
**Endpoint**: `POST /api/patients` | `PATCH /api/patients/:id` | `DELETE /api/patients/:id`  
**Metadata**:
- `patient_id`: UUID of patient
- `changes`: List of modified fields (for UPDATE)
- `timestamp`: When change occurred

### 5. AI Processing
**Action**: `REPORT_PROCESS`  
**Endpoint**: `POST /api/reports/:id/process`  
**Metadata**:
- `report_id`: UUID of processed report
- `patient_id`: UUID of associated patient
- `status`: 'started' | 'completed' | 'failed'
- `processing_time_ms`: Duration in milliseconds
- `birads_value`: Extracted BI-RADS value (if completed)
- `error`: Error message (if failed)
- `timestamp`: When processing occurred

### 6. Account Deletion
**Action**: `AUTH_ACCOUNT_DELETE`  
**Endpoint**: `DELETE /api/auth/me`  
**Metadata**:
- `user_id`: UUID of deleted user
- `timestamp`: When deletion occurred

### 7. Password Changes
**Action**: `AUTH_PASSWORD_CHANGE`  
**Endpoint**: `PATCH /api/auth/me` (password field)  
**Metadata**:
- `user_id`: UUID of user
- `timestamp`: When password was changed

### 8. Email Changes
**Action**: `AUTH_EMAIL_CHANGE`  
**Endpoint**: `PATCH /api/auth/me` (email field)  
**Metadata**:
- `user_id`: UUID of user
- `timestamp`: When email was changed

## PHI Redaction

The `redactMetadata` function automatically redacts:

1. **Dates**: Dates in YYYY-MM-DD, MM/DD/YYYY, MM-DD-YYYY formats → `[REDACTED-DATE]`
2. **Emails**: Any email address → `[REDACTED-EMAIL]`
3. **Phone numbers**: US and international formats → `[REDACTED-PHONE]`
4. **Names**: Common name patterns → `[REDACTED-NAME]`
5. **API Keys**: Tokens, secrets, passwords → `[REDACTED-API-KEY]`
6. **SSNs**: 9-digit social security numbers → `[REDACTED-SSN]`
7. **Sensitive Keys**: Fields named password, token, secret, key, pdf, text, content, or prompt → `[REDACTED]`

### Example: PHI Redaction

**Before**:
```json
{
  "filename": "Patient_John_Doe_2024-01-15.pdf",
  "patient_id": "abc-123",
  "file_size_bytes": 1024000
}
```

**After**:
```json
{
  "filename": "Patient_[REDACTED-NAME]_[REDACTED-DATE].pdf",
  "patient_id": "abc-123",
  "file_size_bytes": 1024000
}
```

## Database Schema

### audit_logs Table

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes for Performance

```sql
CREATE INDEX audit_logs_user_id_created_at ON audit_logs (user_id, created_at DESC);
CREATE INDEX audit_logs_action_created_at ON audit_logs (action, created_at DESC);
CREATE INDEX audit_logs_resource_action ON audit_logs (resource_type, action);
```

## API Usage Examples

### Logging a File Upload
```typescript
import { logUpload } from '@/services/auditService';

await logUpload(
  userId,
  'mammogram.pdf',
  patientId,
  1024000,
  req.ip,
  req.get('user-agent')
);
```

### Logging a Report View
```typescript
import { logView } from '@/services/auditService';

await logView(
  userId,
  reportId,
  patientId,
  req.ip,
  req.get('user-agent')
);
```

### Logging Patient Changes
```typescript
import { logPatientChange } from '@/services/auditService';

await logPatientChange(
  userId,
  patientId,
  'UPDATE',
  {
    cancer_stage: { old: 'Stage II', new: 'Stage III' }
  },
  req.ip,
  req.get('user-agent')
);
```

## Compliance Features

### HIPAA Requirements Met
- ✓ User identification and authentication tracking
- ✓ Comprehensive action logging (CRUD operations)
- ✓ Timestamp and IP address recording
- ✓ Automatic PHI redaction
- ✓ Immutable audit trail (append-only)
- ✓ Retention policy (configurable via database)
- ✓ Access control (requires authorized user context)

### Best Practices
1. **Always pass request context** (IP, user-agent) for compliance
2. **Never log unredacted PHI** in metadata
3. **Log before and after states** for updates when possible
4. **Include meaningful timestamps** for all actions
5. **Validate user permissions** before logging sensitive data access

## Testing

Run audit service tests:
```bash
npm test backend/src/test/auditService.test.ts
```

### Test Coverage
- File upload logging with correct metadata
- Report view logging with timestamp
- Report deletion logging with reason
- Patient create/update/delete logging
- Report processing (success and failure) logging
- Account actions (password, email, deletion) logging
- PHI redaction in all metadata
- Error handling for Supabase failures

## Migration Steps

1. **Apply migration**:
   ```bash
   supabase db push
   ```
   This adds the `metadata` column to `audit_logs` table.

2. **Deploy updated controllers**:
   - `reportController.ts` - logs uploads, views, deletes, processing
   - `patientController.ts` - logs patient CRUD operations
   - `authController.ts` - logs password and account changes

3. **Verify audit trail**:
   ```sql
   SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
   ```

## Querying Audit Logs

### Get all uploads by a user
```sql
SELECT * FROM audit_logs 
WHERE action = 'FILE_UPLOAD' 
AND user_id = '...'
ORDER BY created_at DESC;
```

### Get all report deletions
```sql
SELECT * FROM audit_logs 
WHERE action = 'REPORT_DELETE' 
ORDER BY created_at DESC;
```

### Get patient modifications
```sql
SELECT * FROM audit_logs 
WHERE resource_type = 'patient' 
AND user_id = '...'
ORDER BY created_at DESC;
```

### Get account security events
```sql
SELECT * FROM audit_logs 
WHERE action IN ('AUTH_PASSWORD_CHANGE', 'AUTH_EMAIL_CHANGE', 'AUTH_ACCOUNT_DELETE')
ORDER BY created_at DESC;
```

## Error Handling

The audit service gracefully handles failures:

1. **Database errors**: Logged but don't block the main operation
2. **Invalid user context**: Audit log still created with available info
3. **Supabase connection issues**: Error logged, operation continues

```typescript
// Audit logging errors don't block the response
await logUpload(...).catch(err => {
  logger.error('Audit logging failed', { error: err.message });
  // Operation continues normally
});
```

## Security Considerations

1. **PHI Redaction**: All personally identifiable information is automatically redacted
2. **Immutable Records**: Audit logs are append-only (no updates/deletes)
3. **Access Control**: RLS policies can restrict who can query audit logs
4. **Sensitive Fields**: Any field name containing 'password', 'token', 'secret', 'key', 'pdf', 'text', 'content', or 'prompt' is completely redacted
5. **IP Logging**: Helps detect unauthorized access patterns
6. **User Agent**: Tracks device and browser information

## Related Modules

- **M8-1**: audit_logs table creation and RLS policies
- **M8-3**: auditLogger utility with PHI redaction functions
- **M8-2**: This module - integration with controllers

## Troubleshooting

### Audit logs not appearing
- Check that migration 004 has been applied
- Verify SUPABASE_SERVICE_ROLE_KEY is set
- Check browser console and server logs for errors
- Ensure audit log calls are not wrapped in try-catch blocks that silently fail

### PHI not being redacted
- Check redactMetadata function is being called
- Verify PHI patterns in auditLogger.ts match your data format
- Test redactMetadata function directly in tests

### Performance issues
- Use indexed queries (user_id, action, created_at)
- Implement retention policy (delete logs older than 90 days)
- Archive old logs to separate table if needed

## Future Enhancements

1. Real-time alerts for suspicious activities
2. Audit log retention policies
3. Compliance reporting dashboard
4. Webhook notifications for critical events
5. Advanced threat detection using ML
