# API Reference

Base URL: `http://localhost:3001` (development)

All protected routes require `Authorization: Bearer <supabase_access_token>`.

Validation errors return `422` with `{ errors: [{ field, message }] }`.
Auth errors return `401`. Not found or unauthorized returns `404`.

---

## Auth

### `POST /api/auth/register`

Delegates to `supabase.auth.signUp()`.

**Body**
```json
{ "email": "string", "password": "string", "full_name": "string" }
```

**Response** `201`
```json
{ "user": { "id": "uuid", "email": "string" }, "session": { "access_token": "string" } }
```

---

### `POST /api/auth/login`

Delegates to `supabase.auth.signInWithPassword()`.

**Body**
```json
{ "email": "string", "password": "string" }
```

**Response** `200`
```json
{ "user": { "id": "uuid", "email": "string" }, "session": { "access_token": "string" } }
```

---

### `GET /api/auth/me` `[protected]`

Returns the authenticated user's profile.

**Response** `200`
```json
{ "id": "uuid", "email": "string", "full_name": "string", "role": "user|admin" }
```

---

### `PATCH /api/auth/me` `[protected]`

Updates display name or email via `supabase.auth.updateUser()`.

**Body** (all optional)
```json
{ "full_name": "string", "email": "string" }
```

---

## Patients `[all protected]`

### `GET /api/patients`

**Query params:** `search` (full_name contains), `stage` (cancer_stage), `sort` (`created_at` | `full_name`)

**Response** `200` — array of patient objects

---

### `POST /api/patients`

**Body** — all required fields:
```json
{
  "full_name": "string",
  "date_of_birth": "YYYY-MM-DD",
  "diagnosis_date": "YYYY-MM-DD",
  "cancer_type": "string",
  "gender": "Male|Female|Other",
  "cancer_stage": "Stage 0|Stage I|Stage II|Stage III|Stage IV|Unknown",
  "er_status": "Positive|Negative|Unknown",
  "pr_status": "Positive|Negative|Unknown",
  "her2_status": "Positive|Negative|Unknown"
}
```

**Response** `201` — created patient object

---

### `GET /api/patients/:id`

**Response** `200` — patient object

---

### `PATCH /api/patients/:id`

Partial update — any subset of patient fields.

---

### `DELETE /api/patients/:id`

**Response** `204`

---

## Reports `[all protected]`

### `POST /api/reports/upload`

Multipart form upload. Field name: `file`. PDF only, max 20 MB.

**Response** `200`
```json
{ "file_url": "string", "filename": "string", "file_size": 12345 }
```

**Errors:** `409` if `{ patient_id, filename }` already exists.

---

### `GET /api/reports/:id/url`

Returns a 60-minute signed URL for secure PDF viewing.

**Response** `200`
```json
{ "signed_url": "string", "expires_at": "ISO datetime" }
```

---

### `POST /api/reports`

Creates a report record with `status: pending`.

**Body**
```json
{ "patient_id": "uuid", "filename": "string", "file_url": "string", "file_size": 12345 }
```

**Response** `201` — report object

---

### `POST /api/reports/process`

Triggers async PDF text extraction → Claude analysis → DB update.

**Body**
```json
{ "report_id": "uuid" }
```

**Response** `202`
```json
{ "status": "processing" }
```

Processing result is written to the report record. Poll `GET /api/reports/:id` for `status = completed | failed`.

---

### `POST /api/reports/:id/reprocess`

Re-triggers processing for a `failed` report. Resets status to `pending`.

---

### `GET /api/reports`

**Query params:** `patient_id` (required), `status` (optional)

---

### `GET /api/reports/:id`

Returns full report object including all AI-extracted fields.

---

### `PATCH /api/reports/:id`

Partial update of report fields.

---

### `DELETE /api/reports/:id`

Deletes the report record and removes the file from Supabase Storage.

**Response** `204`

---

## Treatments `[all protected]`

### `GET /api/treatments`

**Query params:** `patient_id` (required)

---

### `POST /api/treatments`

**Body**
```json
{
  "patient_id": "uuid",
  "treatment_type": "Surgery|Chemotherapy|Radiation|Hormone Therapy|Targeted Therapy|Immunotherapy|Other",
  "treatment_start_date": "YYYY-MM-DD",
  "treatment_end_date": "YYYY-MM-DD",
  "medication_details": "string",
  "treatment_outcome": "Complete Response|Partial Response|Stable Disease|Progressive Disease|Recurrence|Remission|Other",
  "side_effects": "string",
  "follow_up_date": "YYYY-MM-DD"
}
```

---

### `GET /api/treatments/:id` | `PATCH /api/treatments/:id` | `DELETE /api/treatments/:id`

Standard CRUD. `DELETE` returns `204`.

---

## AI `[all protected]`

All AI endpoints include a `disclaimer` field in the response reminding that outputs require clinical review.

### `POST /api/ai/analyze-report`

**Body**
```json
{ "report_id": "uuid" }
```

**Response** `200`
```json
{
  "birads": { "value": 3, "confidence": "high", "evidence": ["exact quote"] },
  "breast_density": { "value": "C", "evidence": ["exact quote"] },
  "exam": { "type": "Mammogram", "laterality": "Bilateral", "evidence": ["exact quote"] },
  "comparison": { "prior_exam_date": "2024-01-15", "evidence": ["exact quote"] },
  "findings": [{ "laterality": "Left", "location": "Upper outer quadrant", "description": "...", "assessment": "...", "evidence": ["exact quote"] }],
  "recommendations": [{ "action": "6-month follow-up", "timeframe": "6 months", "evidence": ["exact quote"] }],
  "red_flags": ["Rapid interval change from prior exam"],
  "disclaimer": "This analysis is AI-generated and must be reviewed by a qualified radiologist before clinical use."
}
```

---

### `POST /api/ai/generate-summary`

**Body**
```json
{ "report_id": "uuid" }
```

**Response** `200`
```json
{
  "summary": "Your mammogram shows...",
  "disclaimer": "..."
}
```

---

### `POST /api/ai/consolidate-reports`

**Body**
```json
{ "patient_id": "uuid", "report_ids": ["uuid", "uuid"] }
```

**Response** `200`
```json
{
  "analysis": "Multi-paragraph plain text consolidation...",
  "disclaimer": "..."
}
```

---

### `POST /api/ai/compare-treatments`

**Body**
```json
{
  "patient_id": "uuid",
  "options": ["Surgery + adjuvant chemo", "Hormone therapy alone", "Watch and wait"]
}
```

**Response** `200`
```json
{
  "comparisons": [
    {
      "option": "Surgery + adjuvant chemo",
      "score": 8,
      "efficacy": "High for Stage II ER+ tumors",
      "benefits": "...",
      "side_effects": "...",
      "duration": "6–8 months",
      "considerations": "..."
    }
  ],
  "overall_recommendation": "Based on the patient profile...",
  "disclaimer": "..."
}
```
