# Batch PDF Upload Implementation - Milestone 4

## Overview

This document describes the implementation of batch PDF upload functionality for the RAD Report AI application. This feature allows users to upload multiple radiology PDFs simultaneously with comprehensive error handling, retry capabilities, and progress tracking.

## Architecture

### Frontend Components

#### 1. FileDropzone Component (`frontend/src/components/ui/FileDropzone.tsx`)

A reusable drag-and-drop file input component supporting:

- **Drag and Drop**: Users can drag PDFs directly onto the component
- **Click to Browse**: Traditional file picker interface
- **Multiple File Support**: Accept multiple PDF files at once
- **Visual Feedback**: Highlight on drag-over, disabled state styling
- **Accessibility**: Proper ARIA labels and keyboard support

**Key Features:**
- HIPAA-aligned encryption messaging
- Real-time visual feedback
- Accessible input handling
- Support for file type validation

**Usage:**
```tsx
<FileDropzone
  accept="application/pdf"
  multiple={true}
  onFilesSelected={(files) => handleFiles(files)}
/>
```

#### 2. BatchUploadDrawer Component (`frontend/src/components/drawers/BatchUploadDrawer.tsx`)

A comprehensive upload management interface supporting:

- **File Selection**: Display selected files with sizes
- **Progress Tracking**: Individual file upload progress bars
- **Status Management**: Real-time status updates for each file
- **Error Handling**: Clear error messages with retry options
- **Multi-Stage Processing**: Visual indication of uploading → extracting → done stages
- **Batch Summary**: Final summary of successful and failed uploads

**Key Features:**
```
Stages:
- idle: Initial state, ready for file selection
- uploading: Files being encrypted and uploaded
- extracting: AI extraction of findings
- done: All operations complete
```

**File States:**
```typescript
interface FileUploadState {
  file: File;
  stage: 'idle' | 'uploading' | 'extracting' | 'done';
  progress: number; // 0-100
  error: string | null;
}
```

### Backend API

#### Upload Endpoint: `POST /api/reports/upload`

**Purpose**: Handle PDF file upload and storage

**Request**:
- Content-Type: multipart/form-data
- Fields:
  - `file`: PDF file (required, max 20MB)
  - `patient_id`: UUID of patient (required)

**Response** (200):
```json
{
  "file_url": "user-id/patient-id/timestamp-filename.pdf",
  "filename": "mammo_2026-06.pdf",
  "file_size": 2400000
}
```

**Error Responses**:
- 400: Missing file
- 422: Invalid file type (non-PDF) or missing patient_id
- 409: Duplicate filename for patient
- 500: Storage or database failure

**Features**:
- Multipart file handling via multer
- Unique path generation: `{userId}/{patientId}/{timestamp}-{normalized_filename}`
- Filename normalization (removes special characters)
- Duplicate detection using UNIQUE constraint on (patient_id, filename)

#### Create Report Endpoint: `POST /api/reports`

**Purpose**: Create database record for uploaded file

**Request**:
```json
{
  "patient_id": "uuid",
  "filename": "mammo_2026-06.pdf",
  "file_url": "user-id/patient-id/timestamp-filename.pdf",
  "file_size": 2400000
}
```

**Response** (201):
```json
{
  "id": "report-id",
  "patient_id": "patient-id",
  "filename": "mammo_2026-06.pdf",
  "file_url": "user-id/patient-id/timestamp-filename.pdf",
  "file_size": 2400000,
  "status": "pending",
  "created_by": "user-id",
  "created_at": "2026-06-04T...",
  "updated_at": "2026-06-04T..."
}
```

### Data Flow

```
User selects files
    ↓
FileDropzone validates PDFs
    ↓
BatchUploadDrawer manages state
    ↓
For each file:
  1. Upload to storage (POST /api/reports/upload)
  2. Create database record (POST /api/reports)
  3. Track progress and errors
    ↓
Mark as extracting → done
    ↓
Display summary and allow retry if needed
```

## Features

### 1. Parallel Upload

- Multiple files upload concurrently
- Each file has independent progress tracking
- Individual file errors don't block others
- `Promise.all()` waits for all uploads to complete

**Implementation:**
```typescript
const uploadPromises = selectedFiles.map(async (fileState) => {
  // Upload and create report for each file
  await uploadFile(fileState);
});

await Promise.all(uploadPromises);
```

### 2. Progress Tracking

**Individual File Progress:**
- Shows upload percentage (0-100%) per file
- Visual progress bar for each file
- Real-time updates using `onUploadProgress` in axios

**Overall Progress:**
- During extraction phase: Average progress across all files
- Simulated AI extraction progress

### 3. Error Handling

**Error Detection:**
- Network errors
- Duplicate filename detection (409 status)
- File validation errors (422 status)
- Storage failures (500 status)

**Error Recovery:**
- Graceful degradation: Failed files don't stop other uploads
- Clear error messages displayed per file
- Retry button appears for failed uploads
- Error state resets on retry

### 4. Duplicate Detection

**Detection Strategy:**
- Server-side UNIQUE constraint on (patient_id, filename)
- Pre-upload duplicate check possible (optional optimization)
- Returns 409 Conflict status code

**Database Schema:**
```sql
CREATE UNIQUE INDEX idx_patient_filename 
ON radiology_reports(patient_id, filename)
WHERE deleted_at IS NULL;
```

### 5. State Management

Using React hooks (useState):

```typescript
const [fileStates, setFileStates] = useState<Map<string, FileUploadState>>(new Map());
const [stage, setStage] = useState<Stage>('idle');
const [overallProgress, setOverallProgress] = useState(0);
```

**File State Updates:**
- Map-based storage for O(1) lookups
- Immutable updates using new Map()
- Automatic re-render on state changes

## Usage

### From Topbar Upload Button

1. User clicks "Upload report" in topbar
2. BatchUploadDrawer opens with FileDropzone
3. User selects multiple PDFs (drag-and-drop or click)
4. Files appear in list with remove option
5. User clicks "Upload X files" button
6. Progress bars show individual file status
7. After uploading completes, extraction phase starts
8. User can click "View Reports" when done

### From Patient Reports Tab

Alternative: Direct upload in ReportsTab component (existing implementation)

## Testing

### Test Coverage

#### Frontend Tests (`frontend/src/test/batchUpload.test.ts`)

1. **File Selection**: Multiple PDF validation, rejection of invalid types
2. **Progress Tracking**: Individual and overall progress calculations
3. **Error Handling**: Individual failures, duplicate detection, retry mechanism
4. **Parallel Upload**: Concurrent file processing, result ordering
5. **State Management**: File list, individual updates, counters
6. **File Validation**: Size limits, type checking, empty files

#### Backend Tests (`backend/src/test/reportUpload.test.ts`)

1. **File Validation**: MIME type, size limits, filename normalization
2. **Duplicate Detection**: Same patient, different patients, case sensitivity
3. **Storage Paths**: Unique generation, user/patient isolation
4. **Database Operations**: Concurrent inserts, unique constraints
5. **Error Responses**: Proper HTTP status codes and messages
6. **Security**: Authentication requirements, access control
7. **Batch Operations**: Concurrent uploads, partial failures

### Running Tests

**Frontend:**
```bash
cd frontend
npm run test
```

**Backend:**
```bash
cd backend
npm run test
```

## Configuration

### Environment Variables

**Backend** (`.env`):
```
MAX_FILE_SIZE_MB=20
STORAGE_BUCKET=reports
VITE_API_URL=http://localhost:3001
```

**Frontend** (`.env.local`):
```
VITE_API_URL=http://localhost:3001
```

## Security Considerations

### HIPAA Compliance

1. **Encryption in Transit**: HTTPS/TLS for all uploads
2. **Encryption at Rest**: Supabase Storage encryption
3. **Access Control**: User authentication required, patient-level isolation
4. **Audit Logging**: All upload operations logged with user ID
5. **Data Retention**: Reports managed per organization policies

### Authentication

- All endpoints require valid JWT token
- User ID extracted from token and used in storage paths
- Patient access validated before operations

### Validation

- File type validation (PDF only)
- File size limits enforced
- Filename normalization to prevent path traversal
- SQL injection prevention via parameterized queries

## Performance

### Optimization Strategies

1. **Parallel Uploads**: Multiple files upload concurrently (not sequentially)
2. **Memory Efficient**: Stream handling via multer memoryStorage
3. **Progress Feedback**: Real-time UI updates without blocking
4. **Database Efficiency**: Batch operations where possible

### Limitations

- Max 5-10 concurrent uploads recommended (adjustable per server capacity)
- Max 20MB per file (configurable)
- Client-side state limited to browser memory

## Error Recovery

### Scenarios Handled

1. **Duplicate Filename**
   - Error: "A report with this filename already exists for the patient"
   - Recovery: User must rename file and retry

2. **Invalid File Type**
   - Error: "Only PDF uploads are supported"
   - Recovery: Select valid PDF file

3. **File Too Large**
   - Error: Implicit via size validation
   - Recovery: User must reduce file size

4. **Network Timeout**
   - Error: Axios timeout error
   - Recovery: Retry button appears for failed files

5. **Storage Failure**
   - Error: "Failed to upload report file"
   - Recovery: Retry operation

6. **Database Failure**
   - Error: "Failed to create report"
   - Recovery: Retry operation

## Future Enhancements

1. **Pre-Upload Verification**: Check for duplicates before uploading
2. **Batch Size Limits**: Enforce max files per batch (e.g., 10 files)
3. **Resume Capability**: Resume interrupted uploads
4. **Compression**: Compress PDFs before upload (optional)
5. **Bulk Operations**: Batch delete/move reports
6. **Scheduling**: Schedule uploads for off-peak hours
7. **Analytics**: Track upload patterns and performance metrics

## Integration Points

### React Query

Used for managing API mutations:
- `useCreateReport()`: Create single report
- `useBatchUpload()`: (Optional) Dedicated batch hook

### Supabase

- Storage bucket: `reports`
- Authentication: JWT tokens
- Database: radiology_reports table

### Axios

HTTP client with:
- Request interceptors for auth tokens
- Response interceptors for error handling
- Upload progress events

## Troubleshooting

### Issue: Files not uploading

**Check:**
1. Network connectivity
2. Authentication token valid
3. Patient ID correct
4. Files are valid PDFs
5. File sizes within limits

### Issue: Duplicate detected incorrectly

**Check:**
1. Case sensitivity (normalized to lowercase)
2. Special characters (normalized to underscores)
3. Database query constraints

### Issue: Progress not updating

**Check:**
1. Browser console for errors
2. Network tab for request status
3. Server logs for processing delays

## References

- [Component Implementation](../frontend/src/components/drawers/BatchUploadDrawer.tsx)
- [API Endpoint](../backend/src/controllers/reportController.ts)
- [Test Suite](../frontend/src/test/batchUpload.test.ts)
- [Backend Tests](../backend/src/test/reportUpload.test.ts)

---

**Last Updated**: 2026-06-04
**Status**: Implementation Complete
**Version**: 1.0
