# Backlog

Linear project: [Claude Web App](https://linear.app/makitgo/project/claude-web-app-9a37e5811958/overview)

This document mirrors the full issue structure. Each section maps to a Linear epic (parent issue) and its sub-tasks. Issues are numbered MIG-XX for direct reference.

---

## Milestone 1: Setup & Infrastructure

**Epic MIG-64 — Monorepo & Infrastructure Setup**

| Issue | Title | Labels | Priority |
|---|---|---|---|
| MIG-76 | Initialize Yarn workspace | infra, chore | Urgent |
| MIG-77 | Backend scaffold (Express + TypeScript) | infra, backend, chore | Urgent |
| MIG-78 | Frontend scaffold (Vite + React 18 + TypeScript) | infra, frontend, chore | Urgent |
| MIG-79 | Tailwind CSS + shadcn/ui initialization | infra, frontend, chore | Urgent |
| MIG-80 | Environment configuration (.env files + startup validation) | infra, chore | Urgent |
| MIG-81 | Supabase JS client setup | infra, database, chore | Urgent |
| MIG-82 | Database migrations: 4 SQL schemas | database, chore | Urgent |
| MIG-83 | Enable RLS on all Supabase tables | database, security | Urgent |
| MIG-84 | Supabase Storage bucket 'reports' setup | database, security, privacy | Urgent |
| MIG-85 | Dev scripts: yarn dev (concurrent backend + frontend) | infra, chore | High |

---

## Milestone 2: Authentication & Security

**Epic MIG-65 — Authentication & Access Control**

| Issue | Title | Labels | Priority |
|---|---|---|---|
| MIG-86 | Supabase Auth client setup (frontend + backend) | security, backend, frontend | Urgent |
| MIG-87 | Express middleware: verify Supabase JWT | security, backend | Urgent |
| MIG-88 | Login page | frontend, ux | Urgent |
| MIG-89 | Register page | frontend, ux | Urgent |
| MIG-90 | Auth session provider + onAuthStateChange listener | frontend | Urgent |
| MIG-91 | Protected frontend routes + loading/redirect states | frontend, security | Urgent |
| MIG-92 | Axios JWT interceptor (attach token, redirect on 401) | frontend, security | Urgent |
| MIG-93 | GET /api/auth/me + PATCH /api/auth/me | backend | High |
| MIG-94 | Password reset flow | frontend, backend | High |
| MIG-95 | Profile / account settings page | frontend, ux | High |

**Epic MIG-73 — Security, Compliance & Audit**

| Issue | Title | Labels | Priority |
|---|---|---|---|
| MIG-141 | Redacted application logging | backend, privacy, compliance | Urgent |
| MIG-142 | Audit logs table + schema | database, compliance | Urgent |
| MIG-143 | Audit key user actions | backend, compliance | Urgent |
| MIG-144 | Input validation with express-validator on all routes | backend, security | Urgent |
| MIG-145 | Rate limiting on auth endpoints | backend, security | Urgent |

---

## Milestone 3: Patient Management

**Epic MIG-66 — Patient Management**

| Issue | Title | Labels | Priority |
|---|---|---|---|
| MIG-96 | GET /api/patients + POST /api/patients | backend | Urgent |
| MIG-97 | GET /api/patients/:id + PATCH + DELETE | backend | Urgent |
| MIG-98 | PatientList page | frontend | Urgent |
| MIG-99 | AddPatientDialog | frontend, ux | Urgent |
| MIG-100 | PatientDetail page | frontend, ux | Urgent |
| MIG-101 | usePatients hook + Patient TypeScript types | frontend | Urgent |

---

## Milestone 4: Document Upload & Storage

**Epic MIG-67 — Document Upload & Storage**

| Issue | Title | Labels | Priority |
|---|---|---|---|
| MIG-102 | POST /api/reports/upload (multer → Supabase Storage) | backend, security, privacy | Urgent |
| MIG-103 | GET /api/reports/:id/url — signed PDF URL | backend, security, privacy | Urgent |
| MIG-104 | POST /api/reports + GET + PATCH + DELETE | backend | Urgent |
| MIG-105 | Duplicate detection: UNIQUE(patient_id, filename) + 409 | backend, frontend | Urgent |
| MIG-106 | FileDropzone component | frontend, ux | Urgent |
| MIG-107 | Batch PDF upload | frontend, backend | High |

---

## Milestone 5: AI Processing Pipeline

**Epic MIG-68 — AI Processing Pipeline**

| Issue | Title | Labels | Priority |
|---|---|---|---|
| MIG-108 | pdfService.ts — pdf-parse wrapper | backend, ai | Urgent |
| MIG-109 | claudeService: analyzeReport | ai, backend, medical-safety | Urgent |
| MIG-110 | claudeService: generateSummary | ai, backend, medical-safety | Urgent |
| MIG-111 | claudeService: consolidateReports | ai, backend, medical-safety | Urgent |
| MIG-112 | claudeService: compareTreatments | ai, backend, medical-safety | Urgent |
| MIG-113 | POST /api/reports/process — async processing pipeline | backend, ai | Urgent |
| MIG-114 | AI route endpoints (analyze, summarize, consolidate, compare) | backend, ai | Urgent |
| MIG-115 | Identifier cleanup before model calls | backend, ai, privacy, medical-safety | Urgent |
| MIG-116 | Source quote matching | backend, ai, medical-safety | Urgent |
| MIG-117 | Clinical review notices on all AI outputs | frontend, ai, medical-safety | Urgent |
| MIG-118 | Deterministic BI-RADS trend detection | backend, ai | High |
| MIG-119 | Save processing failure metadata + reprocess failed reports | backend, frontend | High |

---

## Milestone 6: Report UX

**Epic MIG-69 — Report UI & UX**

| Issue | Title | Labels | Priority |
|---|---|---|---|
| MIG-120 | ReportsList + ReportCard components | frontend | Urgent |
| MIG-121 | ReportDetail slide-over panel | frontend, ux | Urgent |
| MIG-122 | ConsolidatedView modal | frontend, ux | Urgent |
| MIG-123 | BI-RADS trend sparkline per patient | frontend, analytics | High |
| MIG-124 | useReports hook + Report TypeScript types | frontend | Urgent |

---

## Milestone 7: Treatments & Timeline

**Epic MIG-70 — Treatments & Patient Timeline**

| Issue | Title | Labels | Priority |
|---|---|---|---|
| MIG-125 | GET/POST/PATCH/DELETE /api/treatments | backend | Urgent |
| MIG-126 | Treatment UI (Treatments tab in PatientDetail) | frontend, ux | Urgent |
| MIG-127 | PatientTimeline component | frontend, ux | Urgent |
| MIG-128 | TreatmentComparison + TreatmentComparisonCharts | frontend, ux, ai, medical-safety | Urgent |

---

## Milestone 8: Analytics & Dashboard

**Epic MIG-71 — Analytics & Home Dashboard**

| Issue | Title | Labels | Priority |
|---|---|---|---|
| MIG-129 | Home page — stat cards + patient selector | frontend, ux | Urgent |
| MIG-130 | Follow-up due reminders widget | frontend, ux | High |
| MIG-131 | PatientAnalytics page — Demographics charts | frontend, analytics | High |
| MIG-132 | PatientAnalytics page — Diagnostic + Treatment charts | frontend, analytics | High |

---

## Milestone 9: App Polish & Design

**Epic MIG-72 — App Polish & Design System**

| Issue | Title | Labels | Priority |
|---|---|---|---|
| MIG-133 | App layout component + sticky nav + user dropdown | frontend, ux | Urgent |
| MIG-134 | Light/dark mode toggle | frontend, ux | High |
| MIG-135 | Framer Motion animations | frontend, ux | Medium |
| MIG-136 | Axios API client + React Query setup | frontend | Urgent |
| MIG-137 | Shared TypeScript types package | infra, frontend, backend | High |
| MIG-138 | HowTo page | frontend, medical-safety | High |
| MIG-139 | Onboarding flow + demo data seed | frontend, ux | Medium |
| MIG-140 | Mobile/tablet responsiveness pass | frontend, ux | Medium |

---

## Milestone 10: Testing & QA

**Epic MIG-74 — Testing & Quality Assurance**

| Issue | Title | Labels | Priority |
|---|---|---|---|
| MIG-146 | Backend API tests (Jest + Supertest) | backend | High |
| MIG-147 | Frontend component tests (Vitest + RTL) | frontend | High |
| MIG-148 | Playwright E2E tests | frontend, backend | High |
| MIG-149 | Manual QA checklist | ux | High |

---

## Post-MVP

**Epic MIG-75 — Multi-tenant Organization Support**

| Issue | Title | Labels | Priority |
|---|---|---|---|
| MIG-150 | Organization data model | database | Medium |
| MIG-151 | Team sharing permissions | frontend, backend | Medium |
| MIG-152 | Admin health dashboard | frontend, backend | Medium |
| MIG-153 | Admin user management | frontend, backend | Medium |
| MIG-154 | Export full record data bundle (ZIP) | frontend, backend | Medium |

---

## Implementation order

Start here and work top to bottom. Each milestone unblocks the next.

1. **MIG-64** Monorepo setup + DB migrations + RLS + Storage bucket
2. **MIG-65 + MIG-73** Supabase Auth + JWT middleware + audit/security foundation
3. **MIG-66** Patient CRUD API + PatientList + AddPatientDialog
4. **MIG-67** PDF upload pipeline + signed URLs + FileDropzone
5. **MIG-68** AI services (pdfService + claudeService + /process endpoint)
6. **MIG-69** Report UX (ReportsList, ReportCard, ReportDetail, ConsolidatedView)
7. **MIG-70** Treatments + Timeline
8. **MIG-71** Home dashboard + Analytics
9. **MIG-72** App polish (layout, dark mode, animations, HowTo, onboarding)
10. **MIG-74** Testing
11. **MIG-75** Post-MVP (org support, admin)
