# RadReport AI — Starting Point Prompt

> Generated June 3, 2026. Use this as the initial context prompt when starting a new Claude session, CoWork session, or Claude Code session for this project.

\---

## 1\. Project Overview

Build **RadReport AI** — a full-stack breast cancer radiology analysis platform.

**Core objectives:**

* Secure PDF upload and Claude AI-driven radiology report extraction
* Patient and treatment management
* Actionable analytics and consolidated reporting
* Modern, responsive UI with light/dark mode adhering to medical data privacy standards

**Supabase project:** `ghdgkthminenqniqhjjx`
**Supabase dashboard:** https://supabase.com/dashboard/project/ghdgkthminenqniqhjjx
**Database:** Fresh — no migrations applied yet. All schemas must be created.

\---

## 2\. Tech Stack

NodeJs, React, Typescript

### Backend

|Layer|Choice|
|-|-|
|Runtime|Node.js|
|Framework|Express.js|
|Language|TypeScript|
|Database|Supabase (PostgreSQL)|
|ORM/Query|Supabase JS client (`@supabase/supabase-js`)|
|AI|Anthropic Claude (`@anthropic-ai/sdk`) — **not OpenAI**|
|PDF parsing|`pdf-parse`|
|File upload|`multer`|
|Auth|JWT (`jsonwebtoken`) + bcrypt|
|Validation|`express-validator`|

### Frontend

|Layer|Choice|
|-|-|
|Framework|React 18|
|Language|TypeScript|
|Build tool|Vite|
|Styling|Tailwind CSS|
|Components|shadcn/ui|
|Charts|Recharts|
|Animations|Framer Motion|
|HTTP client|Axios + JWT interceptors|
|State/cache|React Query (TanStack Query)|

### Project Structure

```
radreport-ai/                  ← monorepo root
├── package.json               ← Yarn workspaces config (backend, frontend, shared)
├── .npmrc                     ← optional npm registry configuration
├── .gitignore
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts           ← Express entry point
│       ├── controllers/       ← auth, patients, reports, treatments, ai
│       ├── routes/            ← auth, patients, reports, treatments, ai
│       ├── models/            ← Supabase table type definitions
│       ├── middleware/        ← auth, validation, upload
│       ├── services/          ← claudeService, pdfService, supabaseClient
│       └── utils/
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── components/
        │   ├── reports/       ← FileDropzone, ReportsList, ReportCard, ReportDetail, ConsolidatedView
        │   ├── patient/       ← AddPatientDialog, PatientTimeline, TreatmentComparison, TreatmentComparisonCharts
        │   └── ui/            ← shadcn/ui components
        ├── pages/             ← Layout, Home, PatientList, PatientDetail, PatientAnalytics, HowTo
        ├── hooks/             ← usePatients, useReports, useTreatments
        ├── services/          ← api.ts (Axios instance)
        ├── store/             ← React Query config
        └── types/             ← Patient, Report, Treatment, User interfaces
```

### Dev Environment

* OS: **Windows 11 with WSL2**
* Shell: bash (WSL2)
* Node: v20+
* Package manager: **Yarn** (workspaces)
* Install Yarn: `npm install -g yarn` (once)
* Workspace config: `workspaces` in root `package.json`

\---

## 3\. Database Schemas (Supabase / PostgreSQL)

> The Supabase project is empty. All tables need to be created via migrations.

### `users`

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),
  email TEXT UNIQUE NOT NULL,
  full\_name TEXT,
  password\_hash TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  created\_at TIMESTAMPTZ DEFAULT NOW(),
  updated\_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `patients`

```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),
  created\_by UUID REFERENCES users(id),
  full\_name TEXT NOT NULL,
  date\_of\_birth DATE NOT NULL,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  ethnicity TEXT,
  diagnosis\_date DATE NOT NULL,
  cancer\_type TEXT NOT NULL,
  cancer\_stage TEXT CHECK (cancer\_stage IN ('Stage 0','Stage I','Stage II','Stage III','Stage IV','Unknown')),
  tumor\_size\_cm NUMERIC,
  lymph\_node\_positive BOOLEAN,
  er\_status TEXT CHECK (er\_status IN ('Positive','Negative','Unknown')) DEFAULT 'Unknown',
  pr\_status TEXT CHECK (pr\_status IN ('Positive','Negative','Unknown')) DEFAULT 'Unknown',
  her2\_status TEXT CHECK (her2\_status IN ('Positive','Negative','Unknown')) DEFAULT 'Unknown',
  menopausal\_status TEXT,
  initial\_treatment\_plan TEXT,
  created\_at TIMESTAMPTZ DEFAULT NOW(),
  updated\_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `radiology\_reports`

```sql
CREATE TABLE radiology\_reports (
  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),
  created\_by UUID REFERENCES users(id),
  patient\_id UUID REFERENCES patients(id) NOT NULL,
  filename TEXT NOT NULL,
  file\_url TEXT,
  file\_size INTEGER,
  status TEXT CHECK (status IN ('pending','processing','completed','failed')) DEFAULT 'pending',
  summary TEXT,
  birads\_value INTEGER,
  birads\_confidence TEXT CHECK (birads\_confidence IN ('low','medium','high')),
  birads\_evidence JSONB,
  breast\_density\_value TEXT,
  breast\_density\_evidence JSONB,
  exam\_type TEXT,
  exam\_laterality TEXT,
  exam\_evidence JSONB,
  comparison\_prior\_exam\_date TEXT,
  comparison\_evidence JSONB,
  findings JSONB,
  recommendations JSONB,
  red\_flags JSONB,
  processing\_time\_ms INTEGER,
  raw\_text TEXT,
  created\_at TIMESTAMPTZ DEFAULT NOW(),
  updated\_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (patient\_id, filename)
);
```

### `treatment\_records`

```sql
CREATE TABLE treatment\_records (
  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),
  created\_by UUID REFERENCES users(id),
  patient\_id UUID REFERENCES patients(id),
  treatment\_type TEXT CHECK (treatment\_type IN ('Surgery','Chemotherapy','Radiation','Hormone Therapy','Targeted Therapy','Immunotherapy','Other')),
  treatment\_start\_date DATE NOT NULL,
  treatment\_end\_date DATE,
  medication\_details TEXT,
  treatment\_outcome TEXT CHECK (treatment\_outcome IN ('Complete Response','Partial Response','Stable Disease','Progressive Disease','Recurrence','Remission','Other')),
  side\_effects TEXT,
  follow\_up\_date DATE,
  created\_at TIMESTAMPTZ DEFAULT NOW(),
  updated\_at TIMESTAMPTZ DEFAULT NOW()
);
```

\---

## 4\. API Endpoints

### Auth

```
POST   /api/auth/register
POST   /api/auth/login          → returns JWT (7-day expiry)
GET    /api/auth/me             \[protected]
PATCH  /api/auth/me             \[protected]
```

### Patients (all protected)

```
GET    /api/patients            ?search=\&stage=\&sort=
POST   /api/patients
GET    /api/patients/:id
PATCH  /api/patients/:id
DELETE /api/patients/:id
```

### Reports (all protected)

```
POST   /api/reports/upload      → uploads PDF to Supabase Storage, returns URL
POST   /api/reports             → creates report record (status: pending)
POST   /api/reports/process     → extract PDF text → Claude analysis → update record
GET    /api/reports             ?patient\_id=\&status=
GET    /api/reports/:id
PATCH  /api/reports/:id
DELETE /api/reports/:id
```

### Treatments (all protected)

```
GET    /api/treatments          ?patient\_id=
POST   /api/treatments
GET    /api/treatments/:id
PATCH  /api/treatments/:id
DELETE /api/treatments/:id
```

### AI (all protected)

```
POST   /api/ai/analyze-report       → PDF text → structured Claude extraction
POST   /api/ai/generate-summary     → patient-friendly summary
POST   /api/ai/consolidate-reports  → multi-report analysis
POST   /api/ai/compare-treatments   → scored treatment comparison
```

\---

## 5\. Claude AI Prompts

> Use `claude-sonnet-4-20250514`. All calls via `@anthropic-ai/sdk`. Never use OpenAI.

### Report Analysis

```
System: You are a medical AI assistant specializing in breast radiology report analysis.
        Always respond with valid JSON only. No preamble or markdown.

User: Analyze this breast radiology report and extract structured data.

Report text: {pdf\_text}

Return JSON:
{
  "birads": { "value": 0-6, "confidence": "low|medium|high", "evidence": \["exact quote"] },
  "breast\_density": { "value": "A|B|C|D", "evidence": \["exact quote"] },
  "exam": { "type": "string", "laterality": "string", "evidence": \["exact quote"] },
  "comparison": { "prior\_exam\_date": "string|null", "evidence": \["exact quote"] },
  "findings": \[{ "laterality": "string", "location": "string", "description": "string", "assessment": "string", "evidence": \["exact quote"] }],
  "recommendations": \[{ "action": "string", "timeframe": "string", "evidence": \["exact quote"] }],
  "red\_flags": \["string"]
}
Evidence must be exact quotes from the report. Flag any suspicious findings as red flags.
```

### Patient-Friendly Summary

```
System: You are a compassionate medical communicator. Respond with plain text only, 2-4 sentences.

User: Create a patient-friendly summary explaining key findings, what the BI-RADS score means,
      and what the patient should know next. Be honest but reassuring.

Data: {extracted\_json}
```

### Consolidated Analysis

```
System: You are a senior breast radiologist AI. Respond with plain text paragraphs only.

User: Analyze these multiple breast radiology reports for the same patient.
      Write 3-5 paragraphs covering: overall assessment, disease progression,
      consistent findings, concerning patterns, and recommendations.

Reports: {reports\_array\_json}
Patient: {patient\_json}
```

### Treatment Comparison

```
System: You are an oncology decision-support AI. Respond with valid JSON only.

User: Compare these treatment options for this patient.
      For each option return: score (1-10), efficacy, benefits, side\_effects, duration, considerations.
      Add an overall\_recommendation string and a disclaimer.

Patient: {patient\_json}
Options: {treatment\_options\_array}
```

\---

## 6\. Design System

 
Implement: the designs in this project

Fetch this design file, read its readme, and implement the relevant aspects of the design. https://api.anthropic.com/v1/design/h/2DgN_Xlji8vWFM7J5HUSDw

Implement: the designs in this project

### Component Conventions

* Border radius: `rounded-xl` (12px) cards, `rounded-lg` (10px) inputs/buttons
* Border width: `0.5px` throughout (use `border border-border/50`)
* Card padding: `p-5` / `p-6`
* Shadows: none — flat design, borders only
* Dark mode: full support via Tailwind `dark:` classes + shadcn/ui theming
* Animations: Framer Motion — fade + slide-up on mount, slide-right for slide-over

### Pages \& Key Components

```
Layout.jsx          sticky nav, logo, user dropdown
Home.jsx            stat cards, patient selector, FileDropzone, ReportsList
PatientList.jsx     search/filter table, AddPatientDialog
PatientDetail.jsx   patient header + biomarker badges + tabs
  └─ tabs: Overview | Timeline | Treatments | Comparison
PatientAnalytics.jsx  summary cards, Demographics/Diagnostic/Treatment chart tabs
HowTo.jsx           accordion guides, medical disclaimer

reports/
  FileDropzone.jsx       drag/drop PDF, disabled if no patient selected
  ReportsList.jsx        list with skeleton loader + empty state
  ReportCard.jsx         filename, date, status dot, BI-RADS badge, red flag count
  ReportDetail.jsx       slide-over: red flag banner, BI-RADS hero, exam info,
                         AI summary, findings w/ evidence quotes, recommendations,
                         View PDF / Consolidate / Delete actions
  ConsolidatedView.jsx   modal: agg stats, AI summary, report index, Export JSON

patient/
  AddPatientDialog.jsx             form dialog
  PatientTimeline.jsx              vertical color-coded event timeline
  TreatmentComparison.jsx          up to 5 options input + Claude comparison
  TreatmentComparisonCharts.jsx    scored cards w/ efficacy/side effects/duration
```

\---

## 7\. Security Requirements

### Backend

* Passwords: bcrypt (salt rounds: 12)
* Auth: JWT, 7-day expiry, `Authorization: Bearer <token>` header
* File upload: PDF only, max 20 MB, validate MIME type
* Input validation: `express-validator` on all routes
* RLS: Enable Row Level Security on all Supabase tables

### Frontend

* Store JWT in `localStorage`, clear on logout
* Axios interceptor: attach JWT to every request, redirect to `/login` on 401
* Form validation before submit
* No sensitive data in URL params

\---

## 8\. Implementation Order

1. **Supabase setup** — run all 4 SQL migrations, enable RLS, create storage bucket `reports`
2. **Backend scaffold** — Express + TypeScript, Supabase client, env config

```bash
   # From repo root
  yarn install                          # install all workspaces
  yarn workspace backend dev            # run backend only
  yarn workspace frontend dev           # run frontend only
  yarn dev                              # run both (via root script)
  yarn workspace backend add <pkg>      # add dep to backend
  yarn workspace frontend add <pkg>     # add dep to frontend
   ```

3. **Auth routes** — register, login, me (GET/PATCH)
4. **Patient CRUD routes**
5. **File upload** — multer → Supabase Storage
6. **Report routes** — upload, create, process (pdf-parse → Claude → update)
7. **Treatment routes**
8. **AI service** — all 4 Claude prompt functions
9. **Frontend scaffold** — Vite + React + Tailwind + shadcn/ui init
10. **API client** — Axios instance + JWT interceptor + React Query setup
11. **Layout + routing** — React Router, nav
12. **Home page** — stats, FileDropzone, ReportsList
13. **Report components** — ReportCard, ReportDetail slide-over, ConsolidatedView
14. **Patient pages** — PatientList, AddPatientDialog, PatientDetail tabs
15. **Patient components** — Timeline, TreatmentComparison + charts
16. **Analytics page** — all chart types (Recharts)
17. **HowTo page**
18. **End-to-end test** all flows

\---

## 9\. Environment Variables

### Backend `.env`

```env
PORT=3001
NODE\_ENV=development

# Supabase
SUPABASE\_URL=https://ghdgkthminenqniqhjjx.supabase.co
SUPABASE\_SERVICE\_ROLE\_KEY=<from Supabase dashboard → Settings → API>
SUPABASE\_ANON\_KEY=<from Supabase dashboard → Settings → API>

# Auth
JWT\_SECRET=<generate: openssl rand -base64 48>
JWT\_EXPIRES\_IN=7d

# Anthropic
ANTHROPIC\_API\_KEY=<from console.anthropic.com>
CLAUDE\_MODEL=claude-sonnet-4-20250514

# File upload
MAX\_FILE\_SIZE\_MB=20
STORAGE\_BUCKET=reports
```

### Frontend `.env`

```env
VITE\_API\_URL=http://localhost:3001
```

\---

## 10\. Key Decisions \& Constraints

|Decision|Choice|Reason|
|-|-|-|
|AI provider|Anthropic Claude only|No OpenAI|
|Database|Supabase (PostgreSQL)|Not MongoDB|
|Package manager|Yarn workspaces|Stable monorepo workflow and broad ecosystem support|
|Dev OS|Windows WSL2|All shell commands bash-compatible|
|Language|TypeScript throughout|Both backend and frontend|
|Component lib|shadcn/ui + Tailwind|Not NextUI, not MUI|
|Charts|Recharts|Already in spec|
|Duplicate prevention|UNIQUE(patient\_id, filename) in DB|Block at DB + API level|
|Component size limit|200 lines max per file|Split into sub-components|

\---

## 11\. Developer Notes

* **Never hardcode API keys** — always use env vars
* **Package manager: Yarn** — never use `npm install` directly; use `yarn install` at root or `yarn workspace <pkg> add <dep>`
* **All Claude calls** use `claude-sonnet-4-20250514` and `max\_tokens: 1000` unless consolidation (use `max\_tokens: 2000`)
* **PDF storage**: upload to Supabase Storage bucket `reports`, store public URL in `radiology\_reports.file\_url`
* **Report processing** is async: set status `processing` → parse PDF → call Claude → update record → set `completed` or `failed`
* **Duplicate check**: before upload, query `radiology\_reports` for matching `patient\_id + filename`
* **Medical disclaimer**: always render on TreatmentComparison and HowTo pages
* **RLS**: all tables need policies — users can only read/write their own data (`auth.uid() = created\_by`)

\---

*This document captures the full design, architecture, and implementation spec for RadReport AI as of June 3, 2026. Paste this entire file as the first message in any new Claude, CoWork, or Claude Code session to restore full context.*

