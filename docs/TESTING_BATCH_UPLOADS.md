# Testing Batch PDF Upload Functionality

## Quick Start

This guide provides step-by-step instructions for testing the batch PDF upload feature implemented in Milestone 4.

## Prerequisites

1. Backend running: `npm run dev` (from `/backend`)
2. Frontend running: `npm run dev` (from `/frontend`)
3. Supabase connected and configured
4. Sample PDF files for testing

## Manual Testing

### Test 1: Single File Upload

**Steps:**
1. Navigate to Patient Details page
2. Click "Upload report" button in topbar
3. Drag and drop a single PDF onto FileDropzone
4. Click "Upload 1 file" button
5. Observe progress bar update to 100%
6. Wait for "Extracting findings..." phase
7. Click "View Reports" when done

**Expected Results:**
- File appears in list with size
- Progress bar fills smoothly
- Report appears in patient's Reports tab with "pending" status
- No errors displayed

---

### Test 2: Multiple File Upload (Batch)

**Steps:**
1. Click "Upload report" button
2. Select 3-5 PDF files at once (drag multiple or multi-select in picker)
3. Verify all files appear in the file list
4. Click "Upload X files" button
5. Observe individual progress bars for each file
6. Wait for extraction phase
7. Verify all files reach "done" status

**Expected Results:**
- All files upload in parallel
- Individual progress bars show independent progress
- Extraction phase shows overall progress
- All files marked as "done"
- "3 reports extracted" message appears
- Reports appear in Reports tab

---

### Test 3: Duplicate File Detection

**Steps:**
1. Upload a file (e.g., `mammo_2026-06.pdf`)
2. Click "Upload report" again
3. Try uploading the same filename for the same patient
4. Observe error message

**Expected Results:**
- Upload fails with 409 Conflict status
- Error message: "A report with this filename already exists for the patient"
- File marked with error icon
- "Retry Failed" button appears
- Other files continue uploading

---

### Test 4: Large File Upload

**Steps:**
1. Create a test PDF file (15-20 MB)
2. Attempt to upload this file
3. Observe progress bar behavior
4. Wait for completion

**Expected Results:**
- File uploads successfully
- Progress bar updates throughout upload
- File size displayed as "X.XX MB" format
- Upload completes within reasonable time (2-5 minutes for 20MB)

---

### Test 5: Invalid File Type

**Steps:**
1. Click "Upload report"
2. Try to select a non-PDF file (JPG, TXT, etc.)
3. Select it (if allowed)
4. Observe rejection or error

**Expected Results:**
- Non-PDF files are rejected by backend
- Error message: "Only PDF uploads are supported"
- File marked with error icon
- Other files can still be retried

---

### Test 6: Error Recovery with Retry

**Steps:**
1. Upload multiple files, intentionally trigger an error:
   - Disconnect internet, or
   - Use a duplicate filename, or
   - Use very large file
2. Observe error message for affected file
3. Click "Retry Failed" button
4. Watch file retry upload

**Expected Results:**
- Failed file(s) marked with error icon
- Error message displayed clearly
- Retry button enables after any failures
- Retry attempts upload again
- Success after retry (if issue resolved)

---

### Test 7: Drag and Drop

**Steps:**
1. Click "Upload report"
2. Drag and drop multiple PDF files onto the dropzone
3. Verify files appear in the list
4. Proceed with upload

**Expected Results:**
- Dropzone highlights on drag-over
- "Drop PDFs here" text appears
- Files detected and added to list
- No file picker needed

---

### Test 8: Click to Browse

**Steps:**
1. Click "Upload report"
2. Click "Choose files" button
3. Select multiple files from file picker
4. Verify files appear in list

**Expected Results:**
- File picker opens
- Multiple files can be selected
- Files appear in upload list
- Upload proceeds normally

---

### Test 9: Remove Files Before Upload

**Steps:**
1. Select 3 files
2. Hover over first file
3. Click "X" button to remove
4. Verify file is removed from list
5. Upload remaining 2 files

**Expected Results:**
- Only 2 files uploaded
- Removed file is gone from list
- Count updated to "2 files selected"
- Upload button shows correct count

---

### Test 10: Cancel Upload

**Steps:**
1. Start uploading multiple files
2. Click "Cancel" button while uploading
3. Wait to see what happens

**Expected Results:**
- Upload drawer closes
- In-flight requests may complete or cancel (browser dependent)
- Partially uploaded files may or may not appear in reports
- No errors in console

---

## Automated Testing

### Run Frontend Tests

```bash
cd frontend
npm run test
```

Tests cover:
- File selection and validation
- Progress tracking
- Error handling and duplicates
- Parallel processing
- State management
- UI rendering

### Run Backend Tests

```bash
cd backend
npm run test
```

Tests cover:
- File validation (MIME type, size)
- Duplicate detection
- Storage path generation
- Database operations
- Error responses
- Security checks

---

## Performance Testing

### Test: Upload Speed

**Setup:**
1. Prepare test files of various sizes:
   - 1 MB file
   - 5 MB file
   - 10 MB file
   - 20 MB file

**Test:**
1. Upload each file individually
2. Note start and end time
3. Calculate throughput: file_size / duration

**Expected Results:**
- 1 MB file: < 1 second
- 5 MB file: 2-3 seconds
- 10 MB file: 4-6 seconds
- 20 MB file: 8-12 seconds

(Actual times depend on network speed)

### Test: Parallel Upload Performance

**Setup:**
1. Prepare 5 test files (2-3 MB each)

**Test:**
1. Upload all 5 files simultaneously
2. Note total time to completion
3. Compare with sequential upload time

**Expected Results:**
- Parallel time: ~3-5 seconds (upload time for one file)
- Sequential time: ~15-25 seconds (5x single file time)
- Parallel should be 3-5x faster

---

## Edge Cases

### Edge Case 1: Empty File

**Steps:**
1. Create empty PDF file (0 bytes)
2. Attempt to upload

**Expected Result:**
- Either rejected or accepted (depends on validation)
- No crash, graceful handling

### Edge Case 2: Very Long Filename

**Steps:**
1. Create PDF with 200+ character filename
2. Upload

**Expected Result:**
- Filename normalized and stored
- File paths remain valid
- No database errors

### Edge Case 3: Special Characters in Filename

**Steps:**
1. Create PDFs with names:
   - `report @ 2026-06.pdf`
   - `report #final!.pdf`
   - `report (backup).pdf`

**Expected Result:**
- Filenames normalized (special chars replaced with underscores)
- Files upload successfully
- Normalized names stored in database

### Edge Case 4: Duplicate Upload to Different Patient

**Steps:**
1. Upload `report.pdf` to Patient A
2. Upload same `report.pdf` to Patient B
3. Verify both succeed

**Expected Result:**
- Both uploads succeed
- Duplicates allowed across different patients
- Database has 2 separate records

---

## Monitoring & Debugging

### Browser Developer Tools

**Network Tab:**
- Monitor requests to `/api/reports/upload`
- Check response status codes
- Verify Content-Type headers
- Review request/response payloads

**Console:**
- Watch for JavaScript errors
- Verify API responses logged
- Check for auth token presence

### Server Logs

**Backend Logs:**
```bash
# If using pm2:
pm2 logs backend

# Or directly:
npm run dev 2>&1 | tee backend.log
```

Look for:
- Upload requests received
- Duplicate detection logs
- Storage operation status
- Database query results

### Database Inspection

**Check uploaded reports:**
```sql
SELECT * FROM radiology_reports 
WHERE patient_id = 'YOUR_PATIENT_ID' 
ORDER BY created_at DESC;
```

**Verify UNIQUE constraint:**
```sql
SELECT * FROM radiology_reports 
WHERE patient_id = 'PATIENT_ID' 
AND filename = 'FILENAME';
```

---

## Troubleshooting Issues

### Issue: Upload button doesn't appear

**Diagnosis:**
- Check if viewing patient details page
- Verify authentication status
- Check browser console for errors

**Fix:**
- Ensure logged in
- Refresh page
- Check network connectivity

### Issue: Files not appearing after upload

**Diagnosis:**
- Check backend logs for errors
- Verify storage bucket exists
- Check database for report records

**Fix:**
- Restart backend
- Verify Supabase connection
- Check firewall/CORS settings

### Issue: Duplicate errors appearing

**Diagnosis:**
- Check if filenames actually duplicate
- Verify patient ID is correct
- Check database for existing records

**Fix:**
- Rename files with unique names
- Upload to different patient
- Delete existing report and retry

### Issue: Very slow uploads

**Diagnosis:**
- Check network speed
- Monitor server CPU/memory
- Check for database bottlenecks

**Fix:**
- Reduce file size
- Check server resources
- Optimize database queries

---

## Test Data Files

### Creating Test PDFs

**Using Python:**
```python
from reportlab.pdfgen import canvas

def create_test_pdf(filename, size_kb):
    c = canvas.Canvas(filename)
    pages = size_kb // 10  # ~10KB per page
    for i in range(pages):
        c.drawString(100, 750, f"Test Report - Page {i+1}")
        c.showPage()
    c.save()

# Create test files
create_test_pdf("small.pdf", 100)    # 100 KB
create_test_pdf("medium.pdf", 2000)  # 2 MB
create_test_pdf("large.pdf", 15000)  # 15 MB
```

**Using macOS Preview:**
1. Open any PDF
2. File → Export as PDF
3. Adjust quality to vary file size

---

## Checklist

- [ ] Single file uploads work
- [ ] Multiple file batch uploads work
- [ ] Progress bars display correctly
- [ ] Duplicates are detected and rejected
- [ ] Large files upload successfully
- [ ] Invalid file types are rejected
- [ ] Error messages are clear
- [ ] Retry mechanism works
- [ ] Drag and drop works
- [ ] Cancel works
- [ ] File removal works
- [ ] Reports appear after upload
- [ ] Extraction phase completes
- [ ] No console errors
- [ ] Performance is acceptable

---

## Reporting Issues

When reporting issues, include:

1. **Steps to reproduce**
2. **Expected vs actual behavior**
3. **Screenshot/video if applicable**
4. **Browser/OS info**
5. **Network/server logs**
6. **Database state**

---

**Last Updated**: 2026-06-04
