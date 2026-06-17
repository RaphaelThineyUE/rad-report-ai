# Deployment Checklist

This checklist covers pre-flight checks, staging validation, production rollout, and rollback procedures for RadReport AI.

---

## Table of Contents

1. [Pre-Flight Checks](#pre-flight-checks)
2. [Staging Validation](#staging-validation)
3. [Production Rollout](#production-rollout)
4. [Post-Deployment Verification](#post-deployment-verification)
5. [Rollback Procedures](#rollback-procedures)
6. [Emergency Contacts](#emergency-contacts)

---

## Pre-Flight Checks

**Timeline**: 1-2 hours before deployment

Complete ALL items before proceeding to staging or production.

### Code Quality

- [ ] All commits follow conventional commit format
- [ ] No `console.log()` statements left in production code
- [ ] No commented-out code blocks
- [ ] No hardcoded secrets or API keys
- [ ] Linting passes: `yarn lint`
- [ ] No TypeScript errors: `yarn tsc --noEmit`

### Testing

- [ ] All unit tests pass: `yarn workspace backend test`
- [ ] All frontend tests pass: `yarn workspace frontend test`
- [ ] Coverage meets targets (see [CONTRIBUTING.md#test-coverage-expectations](CONTRIBUTING.md#test-coverage-expectations))
- [ ] E2E tests pass on staging: `yarn workspace frontend test:e2e --baseURL https://<staging-url>`
- [ ] No flaky tests (run tests 2x to confirm)

### Build & Dependencies

- [ ] Build succeeds: `yarn build`
- [ ] No build warnings
- [ ] No high/critical vulnerability warnings: `yarn audit`
- [ ] All dependencies up-to-date (review `yarn outdated`)
- [ ] No unexpected npm-shrinkwrap changes
- [ ] Node version matches production (v18+)

### Git & Versioning

- [ ] Feature branch is up-to-date with main: `git rebase origin/main`
- [ ] Commit history is clean (no merge commits, test commits, or fixups)
- [ ] PR is approved and all CI checks pass
- [ ] Branch is NOT force-pushed since last approval
- [ ] Git tag/release notes prepared (if applicable)

### Documentation

- [ ] [DEPLOYMENT.md](DEPLOYMENT.md) reviewed for environment-specific steps
- [ ] Database migration plan reviewed (if new migrations)
- [ ] API changes documented in [API-DOCUMENTATION.md](API-DOCUMENTATION.md)
- [ ] Breaking changes flagged and communicated
- [ ] Rollback plan documented (see [Rollback Procedures](#rollback-procedures))

### Environment Variables

- [ ] All required backend env vars added to `validateEnv.ts`
- [ ] All required frontend env vars start with `VITE_`
- [ ] `.env.example` files updated for new variables
- [ ] No sensitive data in version control
- [ ] Staging env vars match production structure (but different secrets)

---

## Staging Validation

**Timeline**: 1-2 hours, run BEFORE production

Deploy to staging environment and validate end-to-end functionality.

### Deployment to Staging

- [ ] Pull latest main and verify branch
- [ ] Push to staging branch (or use Vercel preview)
- [ ] Wait for Vercel build to complete
- [ ] Check Vercel deployment logs for errors
- [ ] Confirm staging backend domain (e.g., `backend-staging.vercel.app`)
- [ ] Confirm staging frontend domain (e.g., `app-staging.vercel.app`)

### Database Migrations (if applicable)

- [ ] Run migrations on staging Supabase first
- [ ] Verify no data loss: count rows before/after
- [ ] Check migration logs for warnings: `supabase migration list`
- [ ] Test rollback: `supabase db reset` (destructive, staging only!)
- [ ] Re-apply migration and confirm idempotency

### Backend Checks

- [ ] Health check passes: `curl https://<staging-backend>/api/health`
- [ ] Health response includes version and timestamp
- [ ] No error logs in Vercel logs (check recent deployments)
- [ ] Sentry has no critical errors
- [ ] Database connections working (check Supabase connection pool)

### Frontend Checks

- [ ] Frontend loads without errors: `https://<staging-frontend>/login`
- [ ] No 404s or network errors in browser console
- [ ] Source maps work in DevTools (if included in build)
- [ ] CSS and assets load correctly
- [ ] Responsive design works on mobile (DevTools)

### Authentication Flow

- [ ] Signup creates new user: `https://<staging-frontend>/signup`
- [ ] Login redirects to dashboard
- [ ] Dashboard loads with patient data
- [ ] Password reset email sends (check inbox or mock SMTP)
- [ ] Session persists across page reloads
- [ ] Logout clears session and redirects to login

### Core Features

- [ ] **Patient Management**
  - [ ] Create patient (all required fields)
  - [ ] Edit patient details
  - [ ] Delete patient (cascade deletes reports)
  - [ ] Export patient data (CSV/JSON if supported)

- [ ] **Report Upload & Processing**
  - [ ] Single file upload works
  - [ ] Batch upload (≤50 files) works
  - [ ] Upload progress bar appears
  - [ ] PDF parsing succeeds
  - [ ] Status updates from pending → processing → completed

- [ ] **AI Analysis** (if AI features present)
  - [ ] Analyze endpoint returns structured JSON
  - [ ] BI-RADS value extracted correctly
  - [ ] Findings and recommendations generated
  - [ ] Evidence quotes included (no hallucinations)
  - [ ] De-identification working (no PHI in Claude calls)

- [ ] **Data Retrieval**
  - [ ] Patients list loads and filters work
  - [ ] Reports list displays with correct status
  - [ ] Patient search works
  - [ ] Pagination works (if implemented)

- [ ] **Analytics & Exports**
  - [ ] Dashboard analytics load
  - [ ] Charts render without errors
  - [ ] CSV export works and contains correct data
  - [ ] No data leakage across users (RLS check)

### Performance & Security

- [ ] Page load time < 3 seconds (Lighthouse)
- [ ] No mixed content warnings (HTTPS only)
- [ ] Security headers present:
  - [ ] `Content-Security-Policy` header
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `X-Frame-Options: SAMEORIGIN`
- [ ] No exposed secrets in network requests
- [ ] API authentication required (no public endpoints except auth)
- [ ] CORS headers correct (staging frontend URL only)

### Data Integrity

- [ ] No orphaned reports (all reports have valid patient)
- [ ] No orphaned patients (no foreign key violations)
- [ ] Audit logs created for sensitive actions
- [ ] Timestamps are correct (UTC, ISO 8601 format)
- [ ] Test data can be cleaned up easily (no production data mix)

### Error Handling

- [ ] Graceful error messages on network failure
- [ ] 404 for non-existent resources
- [ ] 401/403 for unauthorized access
- [ ] 500 errors logged to Sentry with context
- [ ] No stack traces in client responses
- [ ] Invalid input returns 400 with validation errors

### E2E Test Suite

- [ ] All E2E tests pass: `yarn workspace frontend test:e2e --baseURL https://<staging-frontend>`
- [ ] No flaky tests (run 2x if any failures)
- [ ] Auth setup completes successfully
- [ ] Signed-in tests run against authenticated session
- [ ] Screenshots/videos available if tests fail

### Rollback Simulation

- [ ] Document how to rollback (see [Rollback Procedures](#rollback-procedures))
- [ ] Test rollback in isolation (if applicable)
- [ ] Confirm rollback procedure works end-to-end

### Sign-Off

- [ ] **QA Lead**: Staging validation complete ✓
- [ ] **Tech Lead**: Code review + testing approved ✓
- [ ] **Product Manager**: Feature works as specified ✓
- [ ] **Date/Time**: YYYY-MM-DD HH:MM UTC

---

## Production Rollout

**Timeline**: 30-60 minutes, run during low-traffic window (if possible)

Deploy to production after successful staging validation.

### Pre-Rollout Communication

- [ ] Notify support/ops teams (Slack, email)
- [ ] Disable notifications/alerts for expected changes
- [ ] Prepare brief changelog for users (if customer-facing)
- [ ] Have rollback plan ready and tested
- [ ] Ensure on-call engineer is available

### Backend Deployment

- [ ] Merge PR to main (GitHub)
- [ ] Vercel auto-deploys (or manually: `vercel --prod`)
- [ ] Wait for build to complete (~2-5 minutes)
- [ ] Check Vercel deployment logs for errors
- [ ] Confirm backend domain resolves
- [ ] Health check passes: `curl https://<backend-prod>/api/health`

### Frontend Deployment

- [ ] Merge PR to main (if not already)
- [ ] Vercel auto-deploys frontend
- [ ] Wait for build + CDN cache invalidation (~3-5 minutes)
- [ ] Check Vercel deployment logs
- [ ] Confirm frontend domain resolves
- [ ] Hard refresh browser: `Cmd+Shift+R` / `Ctrl+Shift+F5`

### Database Migrations

**Only if migrations exist in this deploy:**

- [ ] Backup Supabase database first (see [DEPLOYMENT.md](DEPLOYMENT.md))
- [ ] Run migrations via Supabase dashboard or CLI
- [ ] Monitor migration logs for errors
- [ ] Verify row counts match expectations
- [ ] Check for long-running queries in Supabase monitoring
- [ ] Monitor error rate during migration

### Post-Deployment Smoke Tests

- [ ] Health endpoint responds: `curl https://<backend-prod>/api/health`
- [ ] Frontend loads: `https://<frontend-prod>/login`
- [ ] No console errors in browser
- [ ] Sentry shows no new critical errors
- [ ] Database connection pool healthy
- [ ] No unusual latency spikes in Vercel metrics

### Live Feature Validation

Repeat key checks from [Staging Validation](#staging-validation) on production:

- [ ] **Auth**: Signup, login, password reset work
- [ ] **Core Feature 1**: Most critical user action (e.g., patient creation)
- [ ] **Core Feature 2**: Most critical user action (e.g., report upload)
- [ ] **Data**: Dashboard loads real user data
- [ ] **API**: API endpoints respond correctly
- [ ] **Performance**: Page loads in < 3 seconds
- [ ] **Errors**: No 5xx errors in Sentry

### Performance & Error Monitoring

- [ ] Set up dashboards in Sentry, Vercel, Supabase
- [ ] Monitor error rate (target: < 0.1% 5xx)
- [ ] Monitor response times (target: p95 < 2 seconds)
- [ ] Monitor database query performance
- [ ] Monitor Anthropic API usage (if applicable)
- [ ] Check for resource exhaustion (CPU, memory, connections)

### Security Verification

- [ ] HTTPS enforced (no mixed content warnings)
- [ ] CORS headers allow only production frontend
- [ ] No sensitive data in logs
- [ ] Rate limiting working (test with multiple quick requests)
- [ ] CSRF tokens in place (if applicable)

---

## Post-Deployment Verification

**Timeline**: 24 hours after production deployment

Monitor and verify stability over time.

### Error Tracking

- [ ] Sentry error rate normal (no spike)
- [ ] No new error types introduced
- [ ] All errors have been triaged
- [ ] Stack traces are readable (source maps working)

### Performance Metrics

- [ ] Backend response time: p50 < 500ms, p95 < 2s, p99 < 5s
- [ ] Frontend Lighthouse score: > 90
- [ ] Database query performance: avg < 100ms
- [ ] CPU/memory utilization normal
- [ ] No unusual log volume

### User Feedback

- [ ] No user-reported issues in Slack/support
- [ ] Feature works as documented
- [ ] No data loss or integrity issues
- [ ] No unexpected behavior changes

### Audit Logging

- [ ] Sensitive actions logged: login, patient create, report upload, AI analysis
- [ ] Audit logs queryable and correct
- [ ] No missing audit events

### Database Health

- [ ] Supabase replication lag: < 1ms
- [ ] Connection pool healthy
- [ ] Backup created successfully
- [ ] No long-running queries
- [ ] No table/index bloat

### Final Sign-Off

- [ ] **Ops/DevOps**: Production deployment stable ✓
- [ ] **QA**: Feature verified in production ✓
- [ ] **Tech Lead**: Code performing as expected ✓
- [ ] **Date/Time**: YYYY-MM-DD HH:MM UTC

---

## Rollback Procedures

### Immediate Rollback (Critical Issues)

If production is broken after deployment, rollback immediately:

```bash
# Option 1: Revert to previous commit (Vercel auto-redeploys)
git revert <bad-commit-sha>
git push origin main

# Option 2: Manually redeploy previous version
# Go to Vercel dashboard → Deployments → Select previous successful build → Redeploy
```

**Critical issues** (rollback immediately):
- 5xx errors on every request
- Authentication broken (users can't log in)
- Data loss or corruption
- Security vulnerability exposed
- Database connection completely down

### Phased Rollback (Minor Issues)

If only some users are affected or errors are intermittent:

1. **Increase error rate threshold** in monitoring
2. **Disable feature flag** (if feature-flagged)
3. **Monitor error rate** — if improving, wait; if worsening, full rollback
4. **Communicate** with users: "We've detected an issue and are investigating"
5. **Hotfix** in new PR and re-deploy once tested

### Rollback Steps (Detailed)

**If rolling back database migrations:**

```bash
# In Supabase dashboard → SQL Editor → run rollback SQL
# NEVER use destructive operations without backup

# Confirm data integrity after rollback
SELECT COUNT(*) FROM patients;
SELECT COUNT(*) FROM radiology_reports;
```

**If rolling back application code:**

1. Go to Vercel dashboard → Deployments
2. Find the **last known good deployment** (check logs)
3. Click "Redeploy" on that deployment
4. Wait for redeploy to complete
5. Verify health endpoint: `curl https://<backend>/api/health`
6. Clear browser cache and reload frontend
7. Monitor Sentry for errors during rollback

**If rolling back took too long and users are affected:**

1. Post status update in Slack/status page
2. Document root cause analysis (RCA)
3. Create follow-up issue for hotfix
4. Schedule blameless postmortem (if critical)

### Post-Rollback

- [ ] Root cause identified
- [ ] Error logs captured and archived
- [ ] Hotfix PR created and reviewed
- [ ] Hotfix tested on staging
- [ ] Hotfix re-deployed to production
- [ ] Postmortem scheduled (if applicable)
- [ ] Team debriefed

---

## Emergency Contacts

Keep this section updated with current on-call engineer(s):

| Role | Name | Slack | Phone |
|------|------|-------|-------|
| **On-Call Engineer** | (Current) | @oncall | +1-XXX-XXX-XXXX |
| **Tech Lead** | (Current) | @tech-lead | +1-XXX-XXX-XXXX |
| **DevOps/Ops** | (Current) | @devops | +1-XXX-XXX-XXXX |

### Escalation

1. First: Page on-call engineer
2. Second: Page tech lead
3. Third: Page DevOps

---

## Related Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) — Full deployment setup guide
- [CONTRIBUTING.md](CONTRIBUTING.md) — Code quality and testing requirements
- [CLAUDE.md](CLAUDE.md) — Architecture and conventions
- [docs/api-reference.md](docs/api-reference.md) — API endpoints

---

## Version History

| Date | Deployed By | Version | Status |
|------|-------------|---------|--------|
| YYYY-MM-DD | Engineer Name | v1.0.0 | ✓ Success |

---

**Last Updated**: 2026-06-17

**Next Review**: 2026-12-17 (or after major changes)
