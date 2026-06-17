# RadReport AI

AI-powered radiology report analysis platform for breast cancer care. Radiologists and oncologists upload PDFs, and Claude extracts structured findings (BI-RADS, density, recommendations, red flags), generates patient-friendly summaries, consolidates multi-report histories, and compares treatment options — all with full PHI protection and clinical review notices.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui |
| State / cache | TanStack Query (React Query) |
| HTTP client | Axios (JWT interceptor) |
| Animations | Framer Motion |
| Charts | Recharts |
| Backend | Node.js, Express.js, TypeScript |
| Auth | Supabase Auth (JWT, password reset, session refresh) |
| Database | Supabase (PostgreSQL) with Row Level Security |
| File storage | Supabase Storage (private bucket, signed URLs) |
| AI | Anthropic Claude (`claude-sonnet-4-20250514`) |
| PDF parsing | pdf-parse |
| Package manager | Yarn workspaces (monorepo) |

---

## Project Structure

```
rad-report-ai/
├── backend/                  # Express API (TypeScript)
│   ├── src/
│   │   ├── controllers/      # Route handlers
│   │   ├── routes/           # Express routers
│   │   ├── middleware/       # Auth, validation, rate-limiting
│   │   ├── services/         # pdfService, claudeService, supabaseClient
│   │   └── utils/            # validateEnv, audit logger
│   ├── .env
│   └── package.json
├── frontend/                 # React + Vite app (TypeScript)
│   ├── src/
│   │   ├── components/       # Shared UI components
│   │   ├── pages/            # Route-level pages
│   │   ├── hooks/            # usePatients, useReports, useAuth
│   │   ├── lib/              # Axios client, React Query config
│   │   └── types/            # Frontend-specific types
│   ├── .env
│   └── package.json
├── shared/
│   └── types/                # Shared TypeScript interfaces (Patient, Report, Treatment)
├── docs/                     # Project documentation
│   ├── architecture.md
│   ├── api-reference.md
│   ├── database-schema.md
│   ├── development-guide.md
│   └── backlog.md
├── package.json              # Yarn workspaces config
└── package.json
```

---

## Quick Start

```bash
# Install all dependencies (root + backend + frontend)
yarn install

# Configure environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Fill in Supabase URL, keys, and Anthropic API key

# Run both servers concurrently
yarn dev
# Backend: http://localhost:3001
# Frontend: http://localhost:5173
```

See [docs/development-guide.md](docs/development-guide.md) for full setup instructions including database migrations and Supabase Storage configuration.

---

## Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                         Browser (User)                              │
└────────────────────────────────────────────────────────────────────┘
                           │
                    ▼ HTTPS / JWT Token
┌────────────────────────────────────────────────────────────────────┐
│          Frontend (React + Vite)                                    │
│  Vercel: https://app.example.com                                   │
│  - Authentication (Supabase Auth)                                  │
│  - Patient CRUD UI                                                 │
│  - Report Upload & Analysis UI                                     │
│  - Analytics & Dashboards                                          │
│  - TanStack Query for server state                                 │
└────────────────────────────────────────────────────────────────────┘
                           │
         ▼ Axios + Authorization Bearer Token
┌────────────────────────────────────────────────────────────────────┐
│       Backend API (Node.js / Express)                              │
│  Vercel Functions: https://api.example.com                         │
│  - /api/auth (login, signup, session)                              │
│  - /api/patients (CRUD + export)                                   │
│  - /api/reports (upload, analyze, export)                          │
│  - /api/ai (Claude analysis - de-identified)                       │
│  - /api/analytics (aggregated dashboard data)                      │
│  - /api/admin (health, monitoring)                                 │
└────────────────────────────────────────────────────────────────────┘
                           │
          ├─────────────────────┬────────────────────┐
          │                     │                    │
          ▼                     ▼                    ▼
    ┌──────────────┐   ┌──────────────┐   ┌───────────────────┐
    │  Supabase    │   │  Supabase    │   │ Anthropic Claude  │
    │  PostgreSQL  │   │  Storage     │   │ API (Backend Only) │
    │  (RLS)       │   │  (Private)   │   │ (De-identified)   │
    │              │   │              │   │                   │
    │ - patients   │   │ - PDF files  │   │ - Report analysis │
    │ - reports    │   │ - signed URLs│   │ - Summary gen.    │
    │ - treatments │   │              │   │ - Comparisons     │
    │ - audit_logs │   │              │   │ - BI-RADS trend   │
    └──────────────┘   └──────────────┘   └───────────────────┘
```

**Key Features**:
- **Full Stack**: React frontend → Express backend → Supabase + Claude AI
- **Auth**: Supabase JWT, Row-Level Security enforces data ownership
- **AI**: Claude processes de-identified clinical data only (backend)
- **Storage**: Private S3-like bucket for PDFs, accessed via signed URLs
- **Audit**: All sensitive actions logged for compliance

---

## Documentation

| Document | Description |
|---|---|
| [CONTRIBUTING.md](CONTRIBUTING.md) | Setup, branching, commits, testing, PR process |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Production & staging setup (Vercel + Supabase) |
| [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) | Pre-flight, staging validation, production rollout, rollback |
| [docs/architecture.md](docs/architecture.md) | Detailed system overview, request flows, auth, RLS, AI services |
| [docs/api-reference.md](docs/api-reference.md) | All API endpoints with request/response shapes |
| [docs/database-schema.md](docs/database-schema.md) | SQL schemas, RLS policies, Storage bucket policies |
| [docs/development-guide.md](docs/development-guide.md) | Local dev setup, env vars, running tests, conventions |
| [docs/backlog.md](docs/backlog.md) | Full Linear issue list by milestone and epic |

---

## Security & Compliance

- **Row Level Security**: All Supabase tables enforce ownership policies — users can only access their own data
- **Private storage**: PDFs stored in a private Supabase bucket; access via 60-minute signed URLs only
- **PHI protection**: Patient identifiers stripped from PDF text before any Anthropic API call; never logged
- **Audit logging**: Sensitive actions (login, view patient, upload, delete, AI analysis) written to `audit_logs`
- **Rate limiting**: Auth endpoints protected with `express-rate-limit`
- **Input validation**: All routes validated with `express-validator`

---

## Medical Disclaimer

All AI-generated outputs (report analysis, patient summaries, treatment comparisons) are for informational purposes only and **must be reviewed by a qualified radiologist or oncologist before any clinical use**. This software does not provide medical advice, diagnosis, or treatment.

---

## License

MIT
