#!/bin/bash

# GitHub Issues Creation Script
# Creates all 75 Linear issues as GitHub issues (excluding completed MIG-129/130/131/132)
# Usage: ./create_github_issues.sh

set -e

OWNER="raphaelthineyue"
REPO="rad-report-ai"

echo "Creating GitHub issues for rad-report-ai repository..."
echo "Repository: $OWNER/$REPO"
echo ""

# Counter for tracking progress
CREATED=0

# Milestone 1: Setup & Infrastructure (10 issues)
echo "Creating Milestone 1: Setup & Infrastructure (10 issues)..."
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-76: Initialize Yarn workspace" --body "Set up Yarn monorepo workspace structure with root package.json" --label "infrastructure,chore" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-77: Backend scaffold (Express + TypeScript)" --body "Initialize Express server with TypeScript, structured routing, and middleware" --label "infrastructure,backend,chore" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-78: Frontend scaffold (Vite + React 18 + TypeScript)" --body "Create React 18 app with Vite and TypeScript configuration" --label "infrastructure,frontend,chore" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-79: Tailwind CSS + shadcn/ui initialization" --body "Configure Tailwind CSS and integrate shadcn/ui component library" --label "infrastructure,frontend,chore" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-80: Environment configuration (.env files + startup validation)" --body "Set up environment variable validation for backend startup" --label "infrastructure,chore" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-81: Supabase JS client setup" --body "Initialize Supabase client in both frontend and backend" --label "infrastructure,database,chore" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-82: Database migrations: 4 SQL schemas" --body "Create SQL migrations for patients, reports, treatments, and audit logs" --label "database,chore" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-83: Enable RLS on all Supabase tables" --body "Configure Row Level Security policies on all database tables" --label "database,security" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-84: Supabase Storage bucket 'reports' setup" --body "Create and configure 'reports' storage bucket with RLS" --label "database,security,privacy" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-85: Dev scripts: yarn dev (concurrent backend + frontend)" --body "Configure concurrent development scripts for backend and frontend" --label "infrastructure,chore" && ((CREATED++))

# Milestone 2: Authentication & Security (15 issues)
echo "Creating Milestone 2: Authentication & Security (15 issues)..."
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-86: Supabase Auth client setup (frontend + backend)" --body "Set up Supabase Auth with client and server integration" --label "security,backend,frontend" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-87: Express middleware: verify Supabase JWT" --body "Create middleware to verify JWT tokens from Supabase" --label "security,backend" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-88: Login page" --body "Create user login page with email/password authentication" --label "frontend,ux" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-89: Register page" --body "Create user registration/signup page" --label "frontend,ux" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-90: Auth session provider + onAuthStateChange listener" --body "Implement React context for auth state management and listening" --label "frontend" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-91: Protected frontend routes + loading/redirect states" --body "Create protected routes and handle auth state transitions" --label "frontend,security" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-92: Axios JWT interceptor (attach token, redirect on 401)" --body "Set up Axios interceptor for JWT token management and 401 handling" --label "frontend,security" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-93: GET /api/auth/me + PATCH /api/auth/me" --body "Implement auth endpoints for getting and updating user profile" --label "backend" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-94: Password reset flow" --body "Implement password reset request and confirmation flow" --label "frontend,backend" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-95: Profile / account settings page" --body "Create user settings page for profile information" --label "frontend,ux" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-141: Redacted application logging" --body "Implement logging without exposing PII or sensitive data" --label "backend,privacy,compliance" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-142: Audit logs table + schema" --body "Create audit_logs table schema for tracking user actions" --label "database,compliance" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-143: Audit key user actions" --body "Log patient access, report uploads, and AI analysis requests" --label "backend,compliance" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-144: Input validation with express-validator on all routes" --body "Add validation middleware to all API endpoints" --label "backend,security" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-145: Rate limiting on auth endpoints" --body "Implement rate limiting for login and signup endpoints" --label "backend,security" && ((CREATED++))

# Milestone 3: Patient Management (6 issues)
echo "Creating Milestone 3: Patient Management (6 issues)..."
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-96: GET /api/patients + POST /api/patients" --body "Create API endpoints for listing and creating patients" --label "backend" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-97: GET /api/patients/:id + PATCH + DELETE" --body "Implement patient detail, update, and delete endpoints" --label "backend" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-98: PatientList page" --body "Create page to display list of patients with search and filters" --label "frontend" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-99: AddPatientDialog" --body "Create modal dialog for adding new patients with full form" --label "frontend,ux" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-100: PatientDetail page" --body "Create detail page for viewing patient information and records" --label "frontend,ux" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-101: usePatients hook + Patient TypeScript types" --body "Create React Query hook and TypeScript interfaces for patients" --label "frontend" && ((CREATED++))

# Milestone 4: Document Upload & Storage (6 issues)
echo "Creating Milestone 4: Document Upload & Storage (6 issues)..."
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-102: POST /api/reports/upload (multer → Supabase Storage)" --body "Implement PDF upload endpoint with multer and Supabase storage" --label "backend,security,privacy" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-103: GET /api/reports/:id/url — signed PDF URL" --body "Create endpoint for generating signed URLs to PDF reports" --label "backend,security,privacy" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-104: POST /api/reports + GET + PATCH + DELETE" --body "Implement CRUD endpoints for radiology reports" --label "backend" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-105: Duplicate detection: UNIQUE(patient_id, filename) + 409" --body "Add database constraint and API handling for duplicate reports" --label "backend,frontend" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-106: FileDropzone component" --body "Create drag-and-drop file upload component" --label "frontend,ux" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-107: Batch PDF upload" --body "Implement batch upload capability for multiple PDFs" --label "frontend,backend" && ((CREATED++))

# Milestone 5: AI Processing Pipeline (12 issues)
echo "Creating Milestone 5: AI Processing Pipeline (12 issues)..."
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-108: pdfService.ts — pdf-parse wrapper" --body "Create service to extract text from PDF files" --label "backend,ai" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-109: claudeService: analyzeReport" --body "Implement Claude API call for analyzing radiology reports" --label "ai,backend,medical-safety" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-110: claudeService: generateSummary" --body "Implement Claude API call for generating report summaries" --label "ai,backend,medical-safety" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-111: claudeService: consolidateReports" --body "Implement Claude API call for consolidating multiple reports" --label "ai,backend,medical-safety" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-112: claudeService: compareTreatments" --body "Implement Claude API call for comparing treatment options" --label "ai,backend,medical-safety" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-113: POST /api/reports/process — async processing pipeline" --body "Create async endpoint for processing reports with Claude" --label "backend,ai" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-114: AI route endpoints (analyze, summarize, consolidate, compare)" --body "Create API endpoints for all AI analysis functions" --label "backend,ai" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-115: Identifier cleanup before model calls" --body "Sanitize PII from reports before sending to Claude" --label "backend,ai,privacy,medical-safety" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-116: Source quote matching" --body "Verify AI-generated quotes against source documents" --label "backend,ai,medical-safety" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-117: Clinical review notices on all AI outputs" --body "Add medical disclaimer notices to AI-generated content" --label "frontend,ai,medical-safety" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-118: Deterministic BI-RADS trend detection" --body "Implement BI-RADS trend analysis logic" --label "backend,ai" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-119: Save processing failure metadata + reprocess failed reports" --body "Handle and log processing failures with retry capability" --label "backend,frontend" && ((CREATED++))

# Milestone 6: Report UX (5 issues)
echo "Creating Milestone 6: Report UX (5 issues)..."
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-120: ReportsList + ReportCard components" --body "Create components for displaying reports in list format" --label "frontend" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-121: ReportDetail slide-over panel" --body "Create slide-over panel for viewing report details" --label "frontend,ux" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-122: ConsolidatedView modal" --body "Create modal for viewing consolidated report analysis" --label "frontend,ux" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-123: BI-RADS trend sparkline per patient" --body "Add sparkline visualization of BI-RADS trends per patient" --label "frontend,analytics" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-124: useReports hook + Report TypeScript types" --body "Create React Query hook and TypeScript interfaces for reports" --label "frontend" && ((CREATED++))

# Milestone 7: Treatments & Timeline (4 issues)
echo "Creating Milestone 7: Treatments & Timeline (4 issues)..."
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-125: GET/POST/PATCH/DELETE /api/treatments" --body "Implement CRUD endpoints for treatment records" --label "backend" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-126: Treatment UI (Treatments tab in PatientDetail)" --body "Create treatment management UI in patient detail view" --label "frontend,ux" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-127: PatientTimeline component" --body "Create timeline visualization of patient medical history" --label "frontend,ux" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-128: TreatmentComparison + TreatmentComparisonCharts" --body "Create treatment comparison view and chart visualizations" --label "frontend,ux,ai,medical-safety" && ((CREATED++))

# Milestone 8: Analytics & Dashboard - SKIPPED (MIG-129/130/131/132 completed in this session)
echo "Skipping Milestone 8: Analytics & Dashboard (MIG-129/130/131/132 - completed in this session)"

# Milestone 9: App Polish & Design (8 issues)
echo "Creating Milestone 9: App Polish & Design (8 issues)..."
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-133: App layout component + sticky nav + user dropdown" --body "Create main app layout with header navigation and user menu" --label "frontend,ux" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-134: Light/dark mode toggle" --body "Implement light/dark mode with theme persistence" --label "frontend,ux" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-135: Framer Motion animations" --body "Add page transitions and micro-interactions with Framer Motion" --label "frontend,ux" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-136: Axios API client + React Query setup" --body "Configure Axios client and React Query for data fetching" --label "frontend" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-137: Shared TypeScript types package" --body "Create shared types package for frontend/backend type consistency" --label "infra,frontend,backend" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-138: HowTo page" --body "Create help/tutorial page with usage instructions" --label "frontend,medical-safety" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-139: Onboarding flow + demo data seed" --body "Implement onboarding flow and seed demo data" --label "frontend,ux" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-140: Mobile/tablet responsiveness pass" --body "Ensure all components are responsive on mobile devices" --label "frontend,ux" && ((CREATED++))

# Milestone 10: Testing & QA (4 issues)
echo "Creating Milestone 10: Testing & QA (4 issues)..."
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-146: Backend API tests (Jest + Supertest)" --body "Write comprehensive API tests for backend endpoints" --label "backend" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-147: Frontend component tests (Vitest + RTL)" --body "Write component tests for frontend with Vitest and React Testing Library" --label "frontend" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-148: Playwright E2E tests" --body "Write end-to-end tests covering key user workflows" --label "frontend,backend" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-149: Manual QA checklist" --body "Create comprehensive manual QA checklist for testing" --label "ux" && ((CREATED++))

# Post-MVP: Multi-tenant Organization Support (5 issues)
echo "Creating Post-MVP: Multi-tenant Organization Support (5 issues)..."
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-150: Organization data model" --body "Create database schema for multi-tenant organizations" --label "database" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-151: Team sharing permissions" --body "Implement team-based access control and sharing" --label "frontend,backend" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-152: Admin health dashboard" --body "Create admin dashboard showing system health metrics" --label "frontend,backend" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-153: Admin user management" --body "Create admin interface for managing users and permissions" --label "frontend,backend" && ((CREATED++))
gh issue create --owner "$OWNER" --repo "$REPO" --title "MIG-154: Export full record data bundle (ZIP)" --body "Implement data export functionality for complete patient records" --label "frontend,backend" && ((CREATED++))

echo ""
echo "=========================================="
echo "GitHub Issues Creation Complete!"
echo "=========================================="
echo "Total issues created: $CREATED"
echo "Repository: $OWNER/$REPO"
echo ""
echo "Note: Excluded from creation (completed in this session):"
echo "  - MIG-129: Home page — stat cards + patient selector"
echo "  - MIG-130: Follow-up due reminders widget"
echo "  - MIG-131: PatientAnalytics page — Demographics charts"
echo "  - MIG-132: PatientAnalytics page — Diagnostic + Treatment charts"
echo ""
