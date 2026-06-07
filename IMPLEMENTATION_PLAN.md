# Rad Report AI: AI Layer & Dependency Modernization Plan

## Executive Summary

This plan covers four interconnected improvements to the rad-report-ai codebase:

1. **Configurable Model Pinning** — Single source of truth for Claude model selection
2. **Dependency Cleanup** — Remove 9 unused frontend packages (lucide-react, 7× @radix-ui/*, CVA)
3. **SDK Upgrade & Structured Outputs** — Upgrade to latest Anthropic SDK with Zod-based parsing
4. **Local De-Identification** — Prevent PHI from reaching Anthropic using local NER (wink-nlp)

These tasks are **interdependent but parallelizable**. Sequencing matters for dependencies, but multiple tasks can develop in parallel branches. The goal is to enable handoff to distributed developers with clear task boundaries, verification criteria, and risk notes.

---

## Context: Current State

### Model Drift Issue
The codebase currently references three conflicting Claude models:
- `CLAUDE.md` claims `claude-sonnet-4-20250514`
- `claudeService.ts` docstring says `claude-3-5-sonnet`
- `claudeService.ts` code uses `claude-3-5-sonnet-20241022`

**Impact**: Confusion, potential regressions if models change, inability to test with different models.

### PHI Leakage in Redaction
Current `cleanupIdentifiers()` in `claudeService.ts` uses a two-pass approach:
1. Regex extraction of structured PII (MRN, SSN, DOB, phone, email)
2. Send *still-bearing* text to Anthropic for name redaction

**Issue**: This violates the stated design ("all text is PII-scrubbed before any Anthropic call"). Relying on Anthropic for de-id requires a BAA if handling real PHI.

**Solution**: Move de-identification to local NER layer using wink-nlp for PERSON/facility detection, remove the Anthropic redaction pass entirely.

### Dependency Bloat
Frontend ships the full shadcn/ui stack but uses none of it:
- `lucide-react`: 0 files imported
- `@radix-ui/*` (7 packages): 0 files import Radix components
- `class-variance-authority`: 0 files

The actual UI styling uses `clsx` and `tailwind-merge` for a custom `cn()` helper. Keeping Tailwind/PostCSS for ~39 files using `className`.

### AI Service Architecture
All AI calls reside in `backend/src/services/claudeService.ts` (~600 lines). Currently:
- Regex + JSON extraction for parsing responses
- No structured output validation
- No prompt caching
- `cleanupIdentifiers()` sends text to Anthropic (two-pass)
- Evidence quotes (`matchSourceQuotes`) verified against raw text but no Zod schema enforcement

---

## Solution Overview

### 1. Configurable Model Pinning

**Goal**: Single source of truth; enable model testing without code changes.

**Changes**:
- Add `ANTHROPIC_MODEL` environment variable (optional, defaults to `claude-sonnet-4-6`)
- Update `validateEnv.ts` to document the new optional var
- Replace hardcoded model in `claudeService.ts` with `process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6'`
- Update `CLAUDE.md` to remove conflicting model references and point to `claudeService.ts` as source of truth

**Files affected**:
- `backend/src/utils/validateEnv.ts` (documentation only)
- `backend/src/services/claudeService.ts` (model selection)
- `CLAUDE.md` (docs fix)

**Risk**: Low. No functional change if env var is omitted.

**Verification**:
- `ANTHROPIC_MODEL=claude-opus-4-8 npm test` should use Opus
- Default behavior unchanged when env var absent

---

### 2. Dependency Cleanup

**Goal**: Remove unused frontend packages; reduce build size and maintenance burden.

**Packages to remove**:
- `lucide-react` — custom Icon.tsx component used instead
- `@radix-ui/react-dialog`
- `@radix-ui/react-dropdown-menu`
- `@radix-ui/react-popover`
- `@radix-ui/react-select`
- `@radix-ui/react-slot`
- `@radix-ui/react-tooltip`
- `@radix-ui/primitive`
- `class-variance-authority` — no variants used

**Packages to keep**:
- `clsx` — used in `src/lib/cn()` for className merging
- `tailwind-merge` — used in `src/lib/cn()` for Tailwind override resolution
- Tailwind/PostCSS/autoprefixer — 39 files use `className` attribute

**Changes**:
- Remove 9 packages from `frontend/package.json`
- Run `yarn install` to clean `yarn.lock`
- Verify no import errors (grep for `lucide-react`, `@radix-ui` in frontend src)

**Files affected**:
- `frontend/package.json` (version constraints)
- `frontend/yarn.lock` (transitive deps)

**Risk**: Low. Search codebase for imports; none should exist.

**Verification**:
- `yarn workspace frontend build` completes
- `yarn workspace frontend test` passes
- Grep confirms no imports of removed packages

---

### 3. SDK Upgrade & Structured Outputs

**Goal**: Enable Zod-based response parsing; remove fragile regex extraction; prepare for schema validation.

**Changes**:

**Step 3a: Upgrade SDK**
- Update `backend/package.json`: `"@anthropic-ai/sdk"` to latest (currently `^0.32.1`)
- Add `"zod"` package (peer dependency for structured outputs)
- Run `yarn install`

**Step 3b: Add Zod schemas**
Create `backend/src/services/aiSchemas.ts` with Zod schemas for all response types:
- `ReportAnalysisSchema` (findings, clinical significance, recommendations)
- `SummarySchema` (summary text, clinical disclaimer)
- `ConsolidationSchema` (temporal trends, key findings)
- `TreatmentComparisonSchema` (alignment, recommendations, confidence)
- `BiRadsSchema` (trend direction, key changes, clinical significance)

**Step 3c: Refactor claudeService.ts**
Replace regex extraction with `client.messages.parse()`:
- `analyzeReport()` → use `zodOutputFormat(ReportAnalysisSchema)`
- `generateSummary()` → use `zodOutputFormat(SummarySchema)`
- `consolidateReports()` → use `zodOutputFormat(ConsolidationSchema)`
- `compareTreatments()` → use `zodOutputFormat(TreatmentComparisonSchema)`
- `detectBiradsTrend()` → Already deterministic; refactor to explicit schema return

**Files affected**:
- `backend/package.json` (SDK version, zod add)
- `backend/src/services/aiSchemas.ts` (new file)
- `backend/src/services/claudeService.ts` (refactor parsing)

**Risk**: Medium. API contract to frontend unchanged, but internal parsing changes. Requires thorough testing.

**Verification**:
- Unit tests for each schema (valid + invalid inputs)
- Critical-path test suite passes
- No regressions in aiController endpoints

---

### 4. Local De-Identification

**Goal**: Prevent any PHI from reaching Anthropic; enforce local de-identification for names and facilities.

**Changes**:

**Step 4a: Add wink-nlp dependency**
- `yarn workspace backend add wink-nlp`

**Step 4b: Create local de-identification module**
Create `backend/src/services/deidentify.ts`:
- Export `deidentify(text: string): string`
- Pipeline:
  1. **Regex layer** (existing patterns): MRN, SSN, DOB, phone, email → replacement tokens
  2. **NER layer** (wink-nlp): Named entity recognition for PERSON and FACILITY
  3. **Replacement**: Replace detected names with `[PATIENT NAME]` or `[FACILITY]` tokens

**Step 4c: Refactor cleanupIdentifiers**
- Move from "regex + Anthropic LLM" to "regex + local NER"
- Remove the Anthropic call entirely
- Keep existing test coverage; add NER test cases

**Step 4d: Update documentation**
- Update `aiController.ts` doc comment: "All text is de-identified locally via wink-nlp before any Anthropic call"
- Update `reportController.ts` similar docs
- Update `CLAUDE.md`: remove phantom `pdfService.sanitize()` reference, point to `deidentify.ts`

**Files affected**:
- `backend/package.json` (add wink-nlp)
- `backend/src/services/deidentify.ts` (new file)
- `backend/src/services/claudeService.ts` (refactor cleanupIdentifiers call)
- `backend/src/controllers/aiController.ts` (update docs)
- `backend/src/controllers/reportController.ts` (update docs)
- `CLAUDE.md` (update docs)

**Risk**: Medium-High. Changes core de-identification logic. Must test with real-world report samples.

**Verification**:
- Unit tests: known names/facilities replaced correctly
- Regex layer still catches all structured PII
- Critical-path test passes (uses deidentify before AI calls)
- No PHI in API logs or error messages

---

## Implementation Sequencing

### Sequential Dependencies
```
1. Model Pinning (independent)
   ↓
2. Dependency Cleanup (independent)
   ↓
3. SDK Upgrade (prerequisite for structured outputs)
   ↓
4. Structured Outputs (refactoring only, no runtime changes to API)
   ↓
5. Local De-Identification (uses new schemas if desired)
```

### Parallelization Opportunities
- **Model Pinning** and **Dependency Cleanup** can develop in parallel
- Both must complete before SDK Upgrade
- **Structured Outputs** and **De-Identification** can develop in parallel *after* SDK Upgrade
  - They touch different code paths
  - De-id doesn't require schemas (but can use them for robustness)

### Recommended Developer Assignment
- **Developer A**: Tasks 1–2 (model pinning + cleanup) → Task 3a (SDK upgrade)
- **Developer B**: Task 4a–4d (de-identification) — waits for 3a SDK upgrade
- **Both**: Task 3b–3c (structured outputs) once SDK is merged

---

## Risk Notes & Mitigations

### Risk: Breaking API Contract to Frontend
**Likelihood**: Low
**Mitigation**: All changes are internal to `claudeService.ts`. Response JSON shape to `/api/analyze`, `/api/summary`, etc. remains identical. No frontend changes needed.

### Risk: De-Identification Removes Needed Clinical Context
**Likelihood**: Low
**Mitigation**: wink-nlp + regex combo should only redact names, not clinical terms. Test with sample reports containing facility names in findings (e.g., "mass seen at Johns Hopkins imaging"). Verify output is still clinically coherent.

### Risk: wink-nlp False Positives/Negatives
**Likelihood**: Medium
**Mitigation**: Supplement NER with regex for known patterns (initials, common abbreviations). Test against 20+ diverse real reports. Document known limitations in code comments.

### Risk: Structured Output Schema Doesn't Match LLM Response
**Likelihood**: Medium
**Mitigation**: Test with actual Claude API responses before deployment. Zod will raise `ZodError` on mismatch — catch and log for debugging. Consider `strict: false` in schema if LLM adds extra fields.

### Risk: SDK Upgrade Breaks Compatibility
**Likelihood**: Low
**Mitigation**: Latest SDK is backward compatible with `messages()` API. Only `zodOutputFormat()` is new. Gradual migration possible if needed.

---

## Build & Test Verification Checklist

After each major step, run:
```bash
# Lint
yarn lint

# Build both workspaces
yarn build

# Backend tests
yarn workspace backend test

# Frontend unit tests
yarn workspace frontend test

# Frontend E2E (optional, requires .env.e2e.local)
yarn workspace frontend test:e2e

# Manual: Full dev stack
yarn dev
# Test each endpoint in Postman or browser
```

---

## Files Summary

### New Files
- `backend/src/services/aiSchemas.ts` — Zod schemas for all AI responses
- `backend/src/services/deidentify.ts` — Local de-identification (regex + NER)

### Modified Files
- `backend/src/utils/validateEnv.ts` — Add ANTHROPIC_MODEL documentation
- `backend/src/services/claudeService.ts` — Model pinning, structured outputs, deidentify refactor
- `backend/src/controllers/aiController.ts` — Update doc comments
- `backend/src/controllers/reportController.ts` — Update doc comments
- `backend/package.json` — SDK version, add zod & wink-nlp
- `frontend/package.json` — Remove 9 unused packages
- `CLAUDE.md` — Fix model refs, remove phantom sanitize() ref, point to deidentify.ts

### No Changes
- Frontend code (API contract unchanged)
- Supabase migrations (RLS policies untouched)
- Database schema (all changes are service layer)

---

## Success Criteria

1. Model pinning: `ANTHROPIC_MODEL` env var respected, defaults to `claude-sonnet-4-6`
2. Cleanup: 9 packages removed, `yarn workspace frontend build` passes
3. SDK: Latest Anthropic SDK installed, Zod added, no import errors
4. Structured outputs: All 5 AI functions use `messages.parse()` with schemas
5. De-identification: No PHI reaches Anthropic; test coverage for regex + NER layers
6. Tests: All existing tests pass; new unit tests for schemas and de-id added
7. Docs: `CLAUDE.md` and code comments reflect single source of truth

---

## Timeline Estimate

- **Model Pinning**: 30 min (1 file, 2 functions)
- **Dependency Cleanup**: 20 min (verify no imports, remove from package.json)
- **SDK Upgrade**: 15 min (version bump, yarn install)
- **Structured Outputs**: 3–4 hours (schema design, refactor 5 functions, unit tests)
- **De-Identification**: 2–3 hours (wink-nlp integration, test coverage, docs)

**Total**: ~7 hours across 2 developers in parallel ≈ 4–5 wall-clock hours
