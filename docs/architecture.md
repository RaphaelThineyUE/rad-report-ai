# Architecture

## Overview

RadReport AI is a monorepo with a Node.js/Express backend and a React frontend, both in TypeScript. All persistence goes through Supabase (PostgreSQL + Storage). AI calls go directly from the backend to Anthropic — the frontend never touches the Anthropic API.

```
Browser (React + Vite)
    │
    │  HTTPS / JWT (Supabase Auth token)
    ▼
Express API (Node.js / TypeScript)  ─────► Anthropic API (Claude)
    │
    ├──► Supabase PostgreSQL (patients, reports, treatments, audit_logs)
    └──► Supabase Storage (PDF files, private bucket)
```

---

## Key architectural decisions

| Decision | Choice | Reason |
|---|---|---|
| Auth | Supabase Auth | Built-in JWT issuance, password reset, session refresh — no custom bcrypt/jsonwebtoken needed |
| File storage | Supabase Storage (private bucket) | Signed URLs for PDF access; files never exposed publicly |
| AI provider | Anthropic Claude only | `claude-sonnet-4-20250514` for all AI calls |
| ORM | Supabase JS client | Typed queries, RLS enforcement at DB level |
| Package manager | pnpm workspaces | Strict hoisting, faster installs, monorepo DX |
| Component lib | shadcn/ui + Tailwind | Composable, accessible, no runtime overhead |
| State/cache | TanStack Query | Server state management, background refetching, optimistic updates |

---

## Request flow — PDF upload and AI processing

```
1. User selects patient, drops PDF in FileDropzone
2. POST /api/reports/upload
   → multer reads buffer, validates MIME + size
   → service-role client uploads to Supabase Storage: {userId}/{patientId}/{filename}
   → returns file_url
3. POST /api/reports
   → creates radiology_reports row (status: pending)
4. POST /api/reports/process
   → sets status = 'processing'
   → downloads PDF buffer from Supabase Storage
   → pdfService.extract(buffer) → raw_text
   → sanitize(raw_text) → strips PII headers
   → claudeService.analyzeReport(sanitizedText) → structured JSON
   → verifySourceQuotes(json, raw_text) → flags hallucinated evidence
   → claudeService.generateSummary(json) → plain-text patient summary
   → updates radiology_reports row with all extracted fields
   → sets status = 'completed' | 'failed'
```

---

## Auth flow

```
Frontend                           Supabase Auth              Backend
   │                                    │                         │
   │── signInWithPassword() ───────────►│                         │
   │◄─ { session: { access_token } } ───│                         │
   │                                    │                         │
   │── API request + Authorization: Bearer <token> ──────────────►│
   │                                    │  supabase.auth.getUser()│
   │                                    │◄────────────────────────│
   │                                    │──── { user } ──────────►│
   │◄──────────────────── response ──────────────────────────────-│
```

The Axios interceptor reads the Supabase session `access_token` from the auth context and attaches it to every request. On 401, it calls `supabase.auth.signOut()` and redirects to `/login`.

---

## Row Level Security

Every table has RLS enabled. The canonical policy pattern:

```sql
-- Users can only SELECT their own rows
CREATE POLICY "owner_select" ON patients
  FOR SELECT USING (auth.uid() = created_by);

-- Users can only INSERT rows they own
CREATE POLICY "owner_insert" ON patients
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Users can only UPDATE their own rows
CREATE POLICY "owner_update" ON patients
  FOR UPDATE USING (auth.uid() = created_by);

-- Users can only DELETE their own rows
CREATE POLICY "owner_delete" ON patients
  FOR DELETE USING (auth.uid() = created_by);
```

The same pattern applies to `radiology_reports`, `treatment_records`, and `audit_logs`.

---

## Storage security

- Bucket `reports` is **private** — no public access
- Storage policies mirror table RLS: users can only read/write under their own `userId` path prefix
- The backend uses the **service-role** Supabase client for uploads (bypasses storage RLS intentionally — the API layer enforces ownership)
- PDF viewing: `GET /api/reports/:id/url` verifies ownership, then calls `supabase.storage.createSignedUrl()` with a 60-minute expiry. The raw storage path is never exposed to the frontend.

---

## Claude AI services

All calls use `claude-sonnet-4-20250514` via `@anthropic-ai/sdk`. Never OpenAI.

| Service function | max_tokens | Output |
|---|---|---|
| `analyzeReport(text)` | 1000 | Structured JSON (BI-RADS, findings, red flags, evidence quotes) |
| `generateSummary(json)` | 1000 | Plain text, 2-4 sentences, patient-friendly |
| `consolidateReports(reports, patient)` | 2000 | Plain text paragraphs, multi-report analysis |
| `compareTreatments(patient, options)` | 1000 | JSON with scored options, overall recommendation, disclaimer |

Evidence quotes returned by `analyzeReport` are verified against `raw_text` substring matches. Unverified (hallucinated) quotes are flagged rather than silently stored.

---

## Deterministic BI-RADS trend

Trend detection does **not** call Claude. It computes from sorted report history:

- `improving` — latest BI-RADS < previous
- `worsening` — latest BI-RADS > previous
- `stable` — all scores equal
- `insufficient_data` — fewer than 2 completed reports

---

## Audit logging

Every sensitive action writes to `audit_logs` asynchronously (fire-and-forget, does not block the request):

- Login / logout
- View patient record
- Create / update / delete patient
- Upload report
- Request signed PDF URL
- Delete report
- Run AI analysis (analyze, consolidate, compare)

---

## Component size limit

All components are capped at 200 lines. Larger components are split into focused sub-components.
