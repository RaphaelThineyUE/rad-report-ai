# Implementation TODO List

## Status: Ready for Parallel Development

Use this list to assign tasks to developers. Tasks are marked with:
- **independent** — can start anytime
- **depends on** — blocked until prerequisite done
- **parallelizable** — can work in parallel with others

---

## Phase 1: Foundation (Prerequisite for Later Work)

### [ ] 1.1 Model Pinning — validateEnv.ts
- **Owner**: Developer A
- **Status**: Independent
- **Scope**: ~30 min
- **Tasks**:
  - [ ] Open `backend/src/utils/validateEnv.ts`
  - [ ] Add JSDoc comment documenting new optional `ANTHROPIC_MODEL` env var (defaults to `claude-sonnet-4-6`)
  - [ ] No code changes needed (validation only checks required vars)
  - [ ] Commit: "docs: document ANTHROPIC_MODEL environment variable"

### [ ] 1.2 Model Pinning — claudeService.ts
- **Owner**: Developer A
- **Status**: Independent
- **Scope**: ~15 min
- **Tasks**:
  - [ ] Open `backend/src/services/claudeService.ts`
  - [ ] Find all hardcoded `claude-3-5-sonnet-20241022` references
  - [ ] Replace with: `process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6'`
  - [ ] Update docstring (line 2): remove false claims about model versions
  - [ ] Run `yarn workspace backend test` — must pass
  - [ ] Commit: "refactor: make Claude model version configurable via ANTHROPIC_MODEL"

### [ ] 1.3 Model Pinning — CLAUDE.md Documentation
- **Owner**: Developer A
- **Status**: Independent (can be done in parallel with 1.1–1.2)
- **Scope**: ~15 min
- **Tasks**:
  - [ ] Open `CLAUDE.md`
  - [ ] Find section "AI services (backend/src/services/claudeService.ts)"
  - [ ] Remove claim about `claude-sonnet-4-20250514`
  - [ ] Replace with: "Model is configurable via `ANTHROPIC_MODEL` env var (default: `claude-sonnet-4-6`). See `claudeService.ts` for exact model selection logic."
  - [ ] Remove claim about `pdfService.sanitize()` (doesn't exist)
  - [ ] Commit: "docs: fix model references to point to single source of truth"
- **Verification**:
  - [ ] No references to `claude-3-5-sonnet` or `claude-sonnet-4-20250514` in CLAUDE.md
  - [ ] `claudeService.ts` is cited as source of truth

---

## Phase 2: Cleanup (Parallel with Phase 1)

### [ ] 2.1 Dependency Cleanup — Identify Unused Packages
- **Owner**: Developer A (or B in parallel)
- **Status**: Independent
- **Scope**: ~10 min
- **Tasks**:
  - [ ] Open `frontend/package.json`
  - [ ] Verify these 9 packages exist and are unused:
    - [ ] `lucide-react`
    - [ ] `@radix-ui/react-dialog`
    - [ ] `@radix-ui/react-dropdown-menu`
    - [ ] `@radix-ui/react-popover`
    - [ ] `@radix-ui/react-select`
    - [ ] `@radix-ui/react-slot`
    - [ ] `@radix-ui/react-tooltip`
    - [ ] `@radix-ui/primitive`
    - [ ] `class-variance-authority`
  - [ ] Confirm by grepping `frontend/src` for imports of each package — should find zero

### [ ] 2.2 Dependency Cleanup — Remove Unused Packages
- **Owner**: Developer A (or B)
- **Status**: Independent (after 2.1)
- **Scope**: ~5 min
- **Tasks**:
  - [ ] Delete the 9 packages from `frontend/package.json`
  - [ ] Run `yarn install` from root
  - [ ] Verify `yarn.lock` is updated
  - [ ] Run `yarn workspace frontend build` — must pass
  - [ ] Run `yarn workspace frontend test` — must pass
  - [ ] Commit: "build: remove 9 unused frontend packages (lucide-react, radix-ui, CVA)"

---

## Phase 3: SDK Upgrade (Prerequisite for Structured Outputs & De-Identification)

### [ ] 3.1 SDK Upgrade — Update Dependencies
- **Owner**: Developer A
- **Status**: Depends on Phase 1 complete (for clean sequencing)
- **Scope**: ~10 min
- **Tasks**:
  - [ ] Open `backend/package.json`
  - [ ] Update `@anthropic-ai/sdk` from `^0.32.1` to latest
  - [ ] Add `"zod"` (latest major version)
  - [ ] Run `yarn install` from root
  - [ ] Verify no import errors in `backend/src/**/*.ts`
  - [ ] Run `yarn workspace backend test` — must pass
  - [ ] Commit: "build: upgrade anthropic SDK to latest, add zod for structured outputs"
- **Verification**:
  - [ ] `import Anthropic from '@anthropic-ai/sdk'` still works
  - [ ] `import { z } from 'zod'` is available
  - [ ] No TypeScript errors in backend

---

## Phase 4: Structured Outputs (Parallel after Phase 3)

### [ ] 4.1 Create Zod Schemas — New File
- **Owner**: Developer B
- **Status**: Depends on 3.1 SDK upgrade complete
- **Scope**: ~1 hour
- **Tasks**:
  - [ ] Create `backend/src/services/aiSchemas.ts`
  - [ ] Define Zod schema `ReportAnalysisSchema`
    - [ ] findings: string[] (array of clinical findings)
    - [ ] clinical_significance: string
    - [ ] recommendations: string[]
  - [ ] Define Zod schema `SummarySchema`
    - [ ] summary: string
    - [ ] clinical_disclaimer: string
  - [ ] Define Zod schema `ConsolidationSchema`
    - [ ] temporal_trends: string
    - [ ] key_findings: string[]
    - [ ] disease_evolution: string
  - [ ] Define Zod schema `TreatmentComparisonSchema`
    - [ ] alignment_score: number (0–100)
    - [ ] recommendations: string[]
    - [ ] confidence: string
  - [ ] Define Zod schema `BiRadsSchema`
    - [ ] trend: 'increasing' | 'stable' | 'decreasing'
    - [ ] key_changes: string[]
    - [ ] clinical_significance: string
  - [ ] Add JSDoc comments to each schema
  - [ ] Commit: "feat: add Zod schemas for AI response validation"

### [ ] 4.2 Refactor analyzeReport() — Use Structured Output
- **Owner**: Developer B
- **Status**: Depends on 4.1 schemas complete
- **Scope**: ~30 min
- **Tasks**:
  - [ ] Open `backend/src/services/claudeService.ts`
  - [ ] Find `analyzeReport()` function
  - [ ] Replace regex JSON extraction with `messages.parse()` + `zodOutputFormat(ReportAnalysisSchema)`
  - [ ] Return typed result and update return type annotation
  - [ ] Add unit test: valid schema input, verify parse succeeds
  - [ ] Add unit test: invalid schema input, verify parse fails with `ZodError`
  - [ ] Run `yarn workspace backend test` — must pass
  - [ ] Commit: "refactor: use Zod structured output for analyzeReport()"

### [ ] 4.3 Refactor generateSummary() — Use Structured Output
- **Owner**: Developer B (or A in parallel)
- **Status**: Depends on 4.1 schemas complete
- **Scope**: ~20 min
- **Identical pattern to 4.2**: Replace regex with `zodOutputFormat(SummarySchema)`
- **Commit**: "refactor: use Zod structured output for generateSummary()"

### [ ] 4.4 Refactor consolidateReports() — Use Structured Output
- **Owner**: Developer B (or A)
- **Status**: Depends on 4.1 schemas complete
- **Scope**: ~20 min
- **Identical pattern to 4.2**: Replace regex with `zodOutputFormat(ConsolidationSchema)`
- **Commit**: "refactor: use Zod structured output for consolidateReports()"

### [ ] 4.5 Refactor compareTreatments() — Use Structured Output
- **Owner**: Developer A (or B)
- **Status**: Depends on 4.1 schemas complete
- **Scope**: ~20 min
- **Identical pattern to 4.2**: Replace regex with `zodOutputFormat(TreatmentComparisonSchema)`
- **Commit**: "refactor: use Zod structured output for compareTreatments()"

### [ ] 4.6 Refactor detectBiradsTrend() — Use Structured Output
- **Owner**: Developer A (or B)
- **Status**: Depends on 4.1 schemas complete
- **Scope**: ~20 min
- **Note**: This function is currently deterministic (no AI call); refactor to return `BiRadsSchema`-compliant object
- **Commit**: "refactor: return Zod-validated BiRadsSchema from detectBiradsTrend()"

### [ ] 4.7 Verify Structured Outputs — Integration Test
- **Owner**: Developer B
- **Status**: Depends on 4.2–4.6 complete
- **Scope**: ~30 min
- **Tasks**:
  - [ ] Run `yarn workspace backend test` — all tests pass
  - [ ] Verify schema validation tests have >80% coverage
  - [ ] Manual test: Call each AI endpoint (`POST /api/analyze`, `/api/summary`, etc.)
  - [ ] Verify response JSON matches schema (DevTools Network tab or Postman)
  - [ ] Commit: "test: verify all AI responses validate against Zod schemas"

---

## Phase 5: De-Identification (Parallel after Phase 3)

### [ ] 5.1 Add wink-nlp Dependency
- **Owner**: Developer A (or B)
- **Status**: Depends on 3.1 SDK upgrade (for clean merge)
- **Scope**: ~5 min
- **Tasks**:
  - [ ] Run: `yarn workspace backend add wink-nlp`
  - [ ] Verify `backend/package.json` updated and `yarn.lock` locked
  - [ ] Commit: "build: add wink-nlp for local NER-based de-identification"

### [ ] 5.2 Create De-Identification Module
- **Owner**: Developer A (or B)
- **Status**: Depends on 5.1 dependency add complete
- **Scope**: ~1.5 hours
- **Tasks**:
  - [ ] Create `backend/src/services/deidentify.ts`
  - [ ] Implement `deidentify(text: string): Promise<string>` function
  - [ ] **Regex layer** (first pass):
    - [ ] MRN pattern → `[MRN]`
    - [ ] SSN pattern: `/\b\d{3}-\d{2}-\d{4}\b/g` → `[SSN]`
    - [ ] DOB patterns (common formats) → `[DATE OF BIRTH]`
    - [ ] Phone patterns → `[PHONE]`
    - [ ] Email patterns → `[EMAIL]`
  - [ ] **NER layer** (second pass, using wink-nlp):
    - [ ] Initialize wink-nlp and POS tagger
    - [ ] Tokenize text
    - [ ] Detect PERSON tokens (proper nouns, human names)
    - [ ] Detect FACILITY tokens (organization names, hospital names)
    - [ ] Replace detected entities with `[PATIENT NAME]` or `[FACILITY]`
  - [ ] Add JSDoc with examples showing before/after redaction
  - [ ] Commit: "feat: add local de-identification using wink-nlp NER"

### [ ] 5.3 Refactor cleanupIdentifiers() — Use Local De-Identification
- **Owner**: Developer A
- **Status**: Depends on 5.2 deidentify module complete
- **Scope**: ~30 min
- **Tasks**:
  - [ ] Open `backend/src/services/claudeService.ts`
  - [ ] Find `cleanupIdentifiers()` function
  - [ ] Replace two-pass approach (regex + Anthropic) with single-pass call to `deidentify()`
  - [ ] Remove all Anthropic API calls from this function
  - [ ] Verify all callers (`analyzeReportText`, `generateReportSummary`, etc.) properly `await` the result
  - [ ] Run `yarn workspace backend test` — must pass
  - [ ] Commit: "refactor: move de-identification to local NER, remove Anthropic call"

### [ ] 5.4 Update De-Identification Documentation
- **Owner**: Developer A
- **Status**: Depends on 5.3 refactor complete
- **Scope**: ~20 min
- **Tasks**:
  - [ ] Update `backend/src/controllers/aiController.ts` JSDoc (lines 2–7): local NER + regex, no PHI sent to Anthropic
  - [ ] Update `backend/src/controllers/reportController.ts` similar JSDoc comments
  - [ ] Update `CLAUDE.md`: remove `pdfService.sanitize()` reference, point to `deidentify()`
  - [ ] Commit: "docs: update de-identification documentation to reflect local NER approach"

### [ ] 5.5 Add De-Identification Unit Tests
- **Owner**: Developer A (or B)
- **Status**: Depends on 5.2 module complete
- **Scope**: ~1 hour
- **Tasks**:
  - [ ] Create `backend/src/services/__tests__/deidentify.test.ts`
  - [ ] **Regex layer tests**: MRN, SSN, phone, email, DOB redaction
  - [ ] **NER layer tests**: name redaction, facility redaction, multiple entities
  - [ ] **Edge cases**: empty string, all-caps text, mixed case with abbreviations
  - [ ] Run tests: `yarn workspace backend test -- deidentify.test.ts` — all pass
  - [ ] Commit: "test: add unit tests for de-identification (regex + NER layers)"

### [ ] 5.6 Update Critical Path Tests
- **Owner**: Developer A (or B)
- **Status**: Depends on 5.3 refactor complete
- **Scope**: ~30 min
- **Tasks**:
  - [ ] Open `backend/src/test/critical-path.test.ts`
  - [ ] Verify test fixtures no longer contain real PHI (names, facilities)
  - [ ] If they do, update fixtures to use placeholder names redacted by NER
  - [ ] Run tests: `yarn workspace backend test -- critical-path.test.ts` — all pass
  - [ ] Commit: "test: update critical-path fixtures to use de-identified names"

---

## Phase 6: Final Verification & Integration (After All Phases)

### [ ] 6.1 Full Build & Test Suite
- **Owner**: Either developer
- **Status**: Depends on phases 1–5 complete
- **Scope**: ~20 min
- **Tasks**:
  - [ ] Run: `yarn install` (from root)
  - [ ] Run: `yarn lint` — zero errors
  - [ ] Run: `yarn build` — both workspaces succeed
  - [ ] Run: `yarn workspace backend test` — all pass (>80% coverage)
  - [ ] Run: `yarn workspace frontend test` — all pass
  - [ ] Commit: "ci: verify full build and test suite passes"

### [ ] 6.2 Manual Integration Test
- **Owner**: Either developer
- **Status**: Depends on 6.1 build success
- **Scope**: ~30 min
- **Tasks**:
  - [ ] Start dev server: `yarn dev`
  - [ ] Log in with test credentials (from `.env.e2e.local`)
  - [ ] Upload a sample PDF (with fake PHI: names, facility names)
  - [ ] Verify `/api/analyze` returns structured output (not regex JSON)
  - [ ] Check server logs: no real PHI logged
  - [ ] Test each AI endpoint:
    - [ ] POST `/api/analyze` (analyzeReportText)
    - [ ] POST `/api/summary` (generateReportSummary)
    - [ ] POST `/api/consolidate` (consolidatePatientReports)
    - [ ] POST `/api/compare-treatments` (comparePatientTreatments)
    - [ ] POST `/api/birads-trend` (detectPatientBiradsTrend)
    - [ ] POST `/api/extract-quotes` (extractReportQuotes)
  - [ ] Confirm all endpoints return 200 and valid response shapes

### [ ] 6.3 Merge & Document
- **Owner**: Project lead (or either developer)
- **Status**: Depends on 6.2 integration test pass
- **Scope**: ~15 min
- **Tasks**:
  - [ ] Merge all feature branches into `main`
  - [ ] Update release notes with summary of changes
  - [ ] Tag release: `v<major>.<minor>.<patch>`
  - [ ] Final commit: "release: structured outputs, local de-id, configurable models, dependency cleanup"

---

## Summary: Tasks by Owner

### Developer A (Primary Lead)
1. **Phase 1**: All 3 model pinning tasks (1.1–1.3) ~1 hour
2. **Phase 2**: Dependency cleanup (2.1–2.2) ~15 min
3. **Phase 3**: SDK upgrade (3.1) ~10 min
4. **Phase 4**: Structured outputs (4.1–4.6, split with B) ~2 hours
5. **Phase 5**: De-identification (5.1–5.6, split with B) ~3 hours
6. **Phase 6**: Final integration (6.1–6.3) ~1 hour

### Developer B (Secondary)
1. **Phase 2**: Dependency cleanup (if parallel with A) ~15 min
2. **Phase 4**: Structured outputs (4.1–4.7, split with A) ~2 hours
3. **Phase 5**: De-identification (5.1–5.6, split with A) ~3 hours
4. **Phase 6**: Final integration (6.1–6.3, if parallel) ~1 hour

**Optimal parallelization**: Start both developers on Phase 1 (A) + Phase 2 (B) → SDK upgrade (A) → Then split Phases 4 & 5 with independent sub-tasks.

---

## Commit Message Convention

All commits should follow the pattern (aligned with Conventional Commits):

```
<type>(<scope>): <subject>
```

**Types**: `feat`, `refactor`, `fix`, `docs`, `test`, `build`
**Scope**: e.g., `ai-service`, `deidentify`, `dependencies`, `docs`
**Subject**: Present tense, max 50 chars

**Examples**:
- `feat(deidentify): add wink-nlp NER for local de-identification`
- `refactor(ai-service): use Zod structured outputs for analyzeReport`
- `docs(claude): fix model references to point to single source of truth`
- `build(dependencies): upgrade anthropic SDK to latest`
