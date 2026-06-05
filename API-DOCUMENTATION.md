# RAD Report AI - API Documentation

## Overview

Comprehensive API endpoints for radiology report processing, analysis, and clinical decision support. All endpoints require authentication and implement clinical disclaimers for AI-generated content.

---

## Authentication

All endpoints require Bearer token authentication:

```bash
Authorization: Bearer YOUR_AUTH_TOKEN
```

---

## AI Processing Endpoints

### **1. Analyze Report (MIG-109, MIG-114)**

Analyze raw radiology report text using Claude AI.

```
POST /api/ai/analyze
```

**Request:**
```json
{
  "report_text": "String containing the full radiology report text"
}
```

**Response:**
```json
{
  "analysis": {
    "summary": "Concise 1-2 sentence summary of key findings",
    "birads_value": 2,
    "birads_confidence": "high",
    "breast_density_value": "B",
    "exam_type": "screening",
    "exam_laterality": "bilateral",
    "comparison_prior_exam_date": null,
    "findings": [
      {
        "laterality": "bilateral",
        "location": "all quadrants",
        "description": "Heterogeneously dense tissue",
        "assessment": "benign",
        "evidence": ["Dense breast tissue noted throughout"]
      }
    ],
    "recommendations": [
      {
        "action": "Continue routine screening",
        "timeframe": "Annual",
        "evidence": ["BI-RADS 2 category"]
      }
    ],
    "red_flags": [],
    "raw_analysis": "Full Claude response text",
    "clinical_disclaimer": "⚠️ CLINICAL REVIEW REQUIRED: This analysis is AI-generated..."
  },
  "original_text_length": 1250
}
```

**Status Codes:**
- `200 OK`: Analysis successful
- `422 Unprocessable Entity`: Missing/invalid report_text
- `500 Internal Server Error`: Analysis failed

**Error Response:**
```json
{
  "error": "Analysis failed",
  "details": "Error message details"
}
```

**Notes:**
- Automatically redacts personally identifiable information (PII) before analysis
- Includes clinical disclaimer in all responses (legal compliance)
- Processing time: 3-8 seconds

---

### **2. Generate Summary (MIG-109, MIG-114)**

Generate a patient-friendly summary from report text.

```
POST /api/ai/summarize
```

**Request:**
```json
{
  "report_text": "String containing the full radiology report text"
}
```

**Response:**
```json
{
  "summary": "One-paragraph patient-friendly summary of the key findings and recommendations",
  "clinical_disclaimer": "⚠️ CLINICAL REVIEW REQUIRED: This analysis is AI-generated...",
  "original_text_length": 1250
}
```

**Status Codes:**
- `200 OK`: Summary generated successfully
- `422 Unprocessable Entity`: Missing/invalid report_text
- `500 Internal Server Error`: Generation failed

**Notes:**
- Automatically redacts PII before analysis
- Generates patient-friendly language (layperson terminology)
- Processing time: 2-5 seconds

---

### **3. Consolidate Reports (MIG-111)**

Consolidate multiple patient reports into a comprehensive overview.

```
POST /api/ai/consolidate
```

**Request:**
```json
{
  "patient_id": "UUID of the patient"
}
```

**Response:**
```json
{
  "patient_id": "UUID",
  "report_count": 3,
  "consolidation": {
    "overall_summary": "Synthesis of all reports showing progression",
    "key_trends": [
      "BI-RADS score stable over 2 years",
      "Breast density consistent"
    ],
    "overall_birads": 2,
    "clinical_implications": "Patient profile suggests continued routine screening",
    "clinical_disclaimer": "⚠️ CLINICAL REVIEW REQUIRED..."
  }
}
```

**Status Codes:**
- `200 OK`: Consolidation successful
- `404 Not Found`: Patient not found
- `422 Unprocessable Entity`: Fewer than 2 reports found
- `500 Internal Server Error`: Consolidation failed

**Requirements:**
- Patient must have at least 2 completed reports
- All reports must have extracted text (raw_text field)

---

### **4. Compare Treatments (MIG-112)**

Compare treatment options against radiology findings.

```
POST /api/ai/compare-treatments
```

**Request:**
```json
{
  "patient_id": "UUID of the patient",
  "report_id": "UUID of the specific report to analyze"
}
```

**Response:**
```json
{
  "patient_id": "UUID",
  "report_id": "UUID",
  "treatment_count": 2,
  "comparison": {
    "treatment_responses": [
      {
        "treatment_type": "Observation",
        "assessment": "Consistent with low-risk BI-RADS 2 findings"
      }
    ],
    "recommendations": [
      "Continue current monitoring protocol",
      "Annual screening mammography"
    ],
    "evidence_summary": "Evidence supporting recommendations",
    "clinical_disclaimer": "⚠️ CLINICAL REVIEW REQUIRED..."
  }
}
```

**Status Codes:**
- `200 OK`: Comparison successful
- `404 Not Found`: Report not found
- `422 Unprocessable Entity`: No treatments found for patient
- `500 Internal Server Error`: Comparison failed

---

### **5. Detect BI-RADS Trend (MIG-118)**

Analyze BI-RADS score trends over time.

```
POST /api/ai/birads-trend
```

**Request:**
```json
{
  "patient_id": "UUID of the patient"
}
```

**Response:**
```json
{
  "patient_id": "UUID",
  "report_count": 3,
  "birads_history": [
    { "value": 2, "date": "2024-06-04T10:00:00Z" },
    { "value": 2, "date": "2023-06-05T10:00:00Z" },
    { "value": 1, "date": "2022-06-06T10:00:00Z" }
  ],
  "trend": {
    "trend": "stable",
    "direction": "none",
    "significance": "low",
    "clinical_note": "BI-RADS assessment has remained consistent"
  }
}
```

**Status Codes:**
- `200 OK`: Trend analysis successful
- `404 Not Found`: Patient not found
- `422 Unprocessable Entity`: Fewer than 2 reports with BI-RADS values
- `500 Internal Server Error`: Trend detection failed

**Trend Values:**
- `improving`: Lower BI-RADS scores over time (better prognosis)
- `worsening`: Higher BI-RADS scores over time (needs attention)
- `stable`: Consistent BI-RADS scores
- `insufficient_data`: Cannot determine trend

---

### **6. Extract Source Quotes (MIG-116)**

Verify AI findings against original report text.

```
POST /api/ai/quotes
```

**Request:**
```json
{
  "report_id": "UUID of the report",
  "findings": [
    "Finding 1 from the analysis",
    "Finding 2 from the analysis"
  ]
}
```

**Response:**
```json
{
  "report_id": "UUID",
  "quotes": {
    "Bilateral breast tissue is heterogeneously dense": [
      "On mammographic examination, bilateral breast tissue is heterogeneously dense, which may obscure small lesions."
    ],
    "No suspicious masses identified": [
      "No suspicious mass or architectural distortion is identified."
    ]
  }
}
```

**Status Codes:**
- `200 OK`: Quote extraction successful
- `404 Not Found`: Report not found
- `422 Unprocessable Entity`: Missing or invalid findings array
- `500 Internal Server Error`: Quote extraction failed

**Notes:**
- Returns verified quotes from the original report text
- Uses multi-strategy matching (exact phrase, then fuzzy keyword matching)
- Prevents hallucinated or unsourced claims

---

## Report Processing Endpoints

### **7. Single File Upload**

Upload a single PDF report.

```
POST /reports/upload
```

**Request:** (multipart/form-data)
```
file: <PDF file>
patient_id: UUID
```

**Response:**
```json
{
  "file_url": "user-id/patient-id/timestamp-filename.pdf",
  "filename": "mammogram_2024.pdf",
  "file_size": 2458624
}
```

**Status Codes:**
- `200 OK`: File uploaded successfully
- `400 Bad Request`: No file provided
- `409 Conflict`: File with this name already exists
- `422 Unprocessable Entity`: Invalid file type or missing patient_id
- `500 Internal Server Error`: Upload failed

---

### **8. Batch Upload Reports (MIG-67)**

Upload multiple PDF reports at once. Allows up to 50 files per batch.

```
POST /reports/batch-upload
```

**Request:** (multipart/form-data)
```
files: [<PDF file 1>, <PDF file 2>, ...]
patient_id: UUID
```

**Response:**
```json
{
  "patient_id": "UUID",
  "total_files": 3,
  "successful": 2,
  "failed": 1,
  "results": [
    {
      "filename": "mammo_2024_06.pdf",
      "status": "success",
      "file_url": "user-id/patient-id/timestamp-mammo_2024_06.pdf",
      "file_size": 2458624
    },
    {
      "filename": "mammo_2024_05.pdf",
      "status": "success",
      "file_url": "user-id/patient-id/timestamp-mammo_2024_05.pdf",
      "file_size": 2341567
    },
    {
      "filename": "ultrasound.pdf",
      "status": "error",
      "error": "Only PDF files are supported"
    }
  ]
}
```

**Status Codes:**
- `200 OK`: Batch processed (check results array for per-file status)
- `400 Bad Request`: No files provided
- `422 Unprocessable Entity`: Missing patient_id or too many files
- `500 Internal Server Error`: Batch processing failed

**Limits:**
- Maximum 50 files per batch
- Maximum 100MB per file (configurable)
- Only PDF format supported
- Duplicate filenames rejected per patient

**Processing:**
1. Each file validated independently
2. Files processed sequentially to avoid rate limits
3. Errors in one file don't affect others
4. Returns detailed results for each file
5. Reports created with status="pending" (ready for processing)

**Example Usage:**

```bash
curl -X POST http://localhost:3000/reports/batch-upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "patient_id=550e8400-e29b-41d4-a716-446655440000" \
  -F "files=@mammo_2024_06.pdf" \
  -F "files=@mammo_2024_05.pdf" \
  -F "files=@mammo_2024_04.pdf"
```

**JavaScript Example:**

```typescript
const formData = new FormData();
formData.append('patient_id', patientId);
formData.append('files', file1);
formData.append('files', file2);
formData.append('files', file3);

const response = await fetch('http://localhost:3000/reports/batch-upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const { successful, failed, results } = await response.json();
console.log(`Uploaded: ${successful}/${successful + failed} files`);
```

---

### **9. Process Report (Upload & Analyze)**

Upload a PDF report and trigger automatic analysis.

```
POST /reports/:id/process
```

**Parameters:**
- `id` (path): UUID of the report record

**Response:**
```json
{
  "report": {
    "id": "UUID",
    "patient_id": "UUID",
    "status": "completed",
    "summary": "Generated summary",
    "birads_value": 2,
    "birads_confidence": "high",
    "findings": [...],
    "recommendations": [...],
    "red_flags": [],
    "processing_time_ms": 5234,
    "raw_text": "Extracted PDF text"
  },
  "processing_time_ms": 5234,
  "birads_trend": {
    "trend": "stable",
    "direction": "none",
    "significance": "low",
    "clinical_note": "..."
  }
}
```

**Status Codes:**
- `200 OK`: Processing successful
- `404 Not Found`: Report not found
- `422 Unprocessable Entity`: Invalid PDF or missing data
- `500 Internal Server Error`: Processing failed

**Processing Steps:**
1. Download PDF from storage
2. Validate PDF integrity
3. Extract text (MIG-108)
4. Redact PII (MIG-115)
5. Analyze with Claude (MIG-109)
6. Generate summary
7. Detect trends
8. Save results to database

---

## Safety & Compliance Features

### **PII Redaction (MIG-115)**

All text processing includes automatic redaction of:
- Medical Record Numbers (MRN)
- Social Security Numbers (SSN)
- Dates of Birth (DOB)
- Phone numbers
- Email addresses
- Patient IDs
- Insurance/Policy numbers
- Names and facility names

**Strategy:** Dual-layer redaction
1. Deterministic regex patterns (always works)
2. Claude NLP for context-aware name detection (if API available)

### **Clinical Disclaimers (MIG-117)**

All AI-generated responses include:
```
⚠️ CLINICAL REVIEW REQUIRED: This analysis is AI-generated and 
must be reviewed by a qualified radiologist. Do not use as a 
substitute for professional medical judgment. All recommendations 
should be verified against the original report and clinical context.
```

### **Citation Verification (MIG-116)**

AI findings are verified against the original report text to prevent hallucinations:
- Exact phrase matching
- Fuzzy keyword matching
- Returns actual quotes from the report
- Confidence levels for matched citations

---

## Error Handling

All endpoints return structured error responses:

```json
{
  "error": "Human-readable error message",
  "details": "Additional technical details (optional)"
}
```

**Common Errors:**

| Error | Status | Meaning |
|-------|--------|---------|
| `Report not found` | 404 | The specified report/patient doesn't exist |
| `Missing report_text` | 422 | Required field is missing or empty |
| `Invalid PDF` | 422 | Uploaded file is not a valid PDF |
| `Analysis failed` | 500 | Claude API error or processing failure |
| `No completed reports` | 422 | Patient has insufficient data for analysis |

---

## Rate Limiting & Performance

**Recommended Limits:**
- Analysis endpoint: 1 request per 10 seconds per user
- Consolidation: 1 request per minute (computationally intensive)
- Trend detection: 1 request per minute

**Performance Baselines:**
- Analyze report: 3-8 seconds
- Generate summary: 2-5 seconds
- Consolidate reports: 5-15 seconds (depends on report count)
- Detect trend: 2-8 seconds

---

## Code Examples

### **JavaScript/TypeScript**

```typescript
// Analyze a report
const response = await fetch('http://localhost:3000/api/ai/analyze', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    report_text: reportContent
  })
});

const { analysis } = await response.json();
console.log(`BI-RADS: ${analysis.birads_value}`);
console.log(`Disclaimer: ${analysis.clinical_disclaimer}`);
```

### **curl**

```bash
curl -X POST http://localhost:3000/api/ai/analyze \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "report_text": "Your mammography report text here..."
  }'
```

### **Python**

```python
import requests

response = requests.post(
  'http://localhost:3000/api/ai/analyze',
  headers={
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
  },
  json={'report_text': report_content}
)

analysis = response.json()['analysis']
print(f"BI-RADS: {analysis['birads_value']}")
```

---

## Implementation Status

| Endpoint | MIG | Status | Features |
|----------|-----|--------|----------|
| POST /reports/upload | - | ✅ Complete | Single file upload |
| POST /reports/batch-upload | 67 | ✅ Complete | Batch upload (up to 50 files) |
| GET /reports/:id/url | - | ✅ Complete | Signed URL generation |
| POST /reports/:id/process | 108, 109, 115, 116, 117 | ✅ Complete | Full AI pipeline |
| POST /api/ai/analyze | 109, 114 | ✅ Complete | PII redaction, disclaimers |
| POST /api/ai/summarize | 109, 114 | ✅ Complete | PII redaction, disclaimers |
| POST /api/ai/consolidate | 111 | ✅ Complete | Multi-report synthesis |
| POST /api/ai/compare-treatments | 112 | ✅ Complete | Evidence-based comparison |
| POST /api/ai/birads-trend | 118 | ✅ Complete | Trend analysis |
| POST /api/ai/quotes | 116 | ✅ Complete | Citation verification |

---

## Next Steps (MIG-67 onwards)

- **MIG-67**: Document upload & batch processing
- **MIG-69**: Report UI components
- **MIG-70**: Patient timeline visualization
- **MIG-71**: Analytics dashboard

For more information, see the Linear project roadmap.
