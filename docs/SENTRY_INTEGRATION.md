# Sentry.io Integration Guide

## Overview

Sentry.io has been integrated into both the backend (Express) and frontend (React) applications for centralized logging, error tracking, and instrumentation. The integration includes automatic error capturing, performance monitoring, and PHI (Protected Health Information) redaction to ensure compliance with healthcare data privacy requirements.

## Features

- **Centralized Error Tracking**: Capture and track exceptions across both frontend and backend
- **Performance Monitoring**: Track transaction traces and performance metrics
- **PHI Redaction**: Automatically redacts Protected Health Information (dates in YYYY-MM-DD format and names) before sending to Sentry
- **Request Context**: Capture HTTP request context and user information (sanitized)
- **Release Tracking**: Track deployments and link errors to specific releases
- **Environment Separation**: Separate monitoring for development, staging, and production

## Backend Setup

### Installation

Sentry packages are already installed:
```bash
npm install @sentry/node @sentry/profiling-node
```

### Configuration

Backend Sentry initialization is in `backend/src/utils/sentry.ts`:

```typescript
import { initSentry, sentryRequestHandler, sentryErrorHandler } from './utils/sentry';

// Initialize Sentry early in the application
initSentry();

// Add Sentry middleware to Express app
app.use(sentryRequestHandler());
app.use(errorHandler);
app.use(sentryErrorHandler());
```

### Environment Variables

Add these to your `.env` file:

```
SENTRY_DSN=<your-sentry-dsn>
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
```

- `SENTRY_DSN`: Your Sentry project DSN (from https://sentry.io)
- `SENTRY_TRACES_SAMPLE_RATE`: Percentage of transactions to trace (0.0-1.0)
- `SENTRY_PROFILES_SAMPLE_RATE`: Percentage of transactions to profile (0.0-1.0)

### Logger Integration

The existing logger in `backend/src/utils/logger.ts` has been enhanced to send messages to Sentry:

```typescript
import { logger } from './utils/logger';

logger.info('User logged in', { userId: '123' });
logger.warn('API rate limit approaching', { remaining: 10 });
logger.error('Database connection failed', { error: 'ECONNREFUSED' });
```

All log messages are automatically:
- Redacted of PHI
- Sent to Sentry with appropriate severity levels
- Printed to console in JSON format

## Frontend Setup

### Installation

Sentry packages are already installed:
```bash
npm install @sentry/react @sentry/tracing
```

### Configuration

Frontend Sentry initialization is in `frontend/src/utils/sentry.ts` and automatically called in `frontend/src/main.tsx`:

```typescript
import { initSentry } from './utils/sentry';

// Initialize Sentry early
initSentry();

// Wrap app with error boundary
<Sentry.ErrorBoundary fallback={<p>An error occurred</p>}>
  <App />
</Sentry.ErrorBoundary>
```

### Environment Variables

Add these to your frontend `.env` file:

```
VITE_SENTRY_DSN=<your-sentry-dsn>
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
```

- `VITE_SENTRY_DSN`: Your Sentry project DSN (frontend can use the same or different project)
- `VITE_SENTRY_TRACES_SAMPLE_RATE`: Percentage of transactions to trace (0.0-1.0)

### Error Handling

The frontend automatically captures:
- Unhandled exceptions via Error Boundary
- Console errors
- Unhandled promise rejections
- React component errors

Manual error capturing:

```typescript
import { captureException, captureMessage } from '@/utils/sentry';

try {
  // some code
} catch (error) {
  captureException(error as Error, { context: 'user-action' });
}

captureMessage('Important action completed', 'info');
```

## PHI Redaction

Both backend and frontend redact PHI before sending to Sentry:

**Pattern Match**: 
- Dates in format `YYYY-MM-DD`
- Names in format `FirstName LastName` (capitalized words)

**Redaction Example**:
```
Before: "Patient John Smith was seen on 1985-03-15"
After:  "Patient [REDACTED] was seen on [REDACTED]"
```

The redaction happens in the `beforeSend` hook, which intercepts events before they're sent to Sentry.

## Performance Monitoring

### Backend Transactions

Express middleware automatically starts transactions for each request:

```typescript
// Each request creates a transaction
POST /api/patients -> "POST /api/patients" transaction
GET /api/reports/123 -> "GET /api/reports/:id" transaction
```

### Frontend Transactions

React Router navigation and async operations automatically tracked:

```typescript
// Page navigation creates transactions
navigate('/patients') -> "navigation" transaction
// Async operations tracked via BrowserTracing
fetch('/api/patients') -> tracked in parent transaction
```

## Deployment

### Pre-Deployment Checklist

1. **Get Sentry Account**: Sign up at https://sentry.io
2. **Create Projects**: Create separate projects for backend and frontend (or use same project)
3. **Get DSN**: Copy the DSN from project settings
4. **Set Environment Variables**: Add SENTRY_DSN to both backend and frontend environments
5. **Test Integration**: Run the application and verify errors appear in Sentry

### Release Tracking

To track releases and link errors to deployments:

```bash
# Set release environment variable
export SENTRY_RELEASE=$(git rev-parse --short HEAD)

# Frontend
vite build --mode production

# Backend
npm run build
npm start
```

## Monitoring Dashboard

Once configured, view your events at: https://sentry.io/organizations/[org]/issues/

### Key Metrics to Monitor

- **Error Rate**: Percentage of requests resulting in errors
- **Performance**: Response times and transaction duration
- **User Impact**: Number of affected users
- **Release Health**: Error rates per release

## Troubleshooting

### Sentry Not Capturing Events

1. Check `SENTRY_DSN` is set and valid
2. Verify DSN is for correct project
3. Check Sentry sample rate isn't 0 (disabled)
4. Verify network connectivity to sentry.io
5. Check browser console for Sentry initialization errors

### PHI Still Visible in Sentry

- Review `beforeSend` hook in sentry.ts
- Check pattern matching for new PHI formats
- Update pattern to match additional formats if needed
- Test pattern matching locally before deploying

### Too Many Events in Sentry

- Reduce `SENTRY_TRACES_SAMPLE_RATE` (e.g., 0.05 for 5%)
- Reduce `SENTRY_PROFILES_SAMPLE_RATE`
- Implement additional filtering in `beforeSend`
- Consider separate projects for different environments

## Best Practices

1. **Don't Log PHI**: Use Sentry's redaction, but avoid logging PHI when possible
2. **Use Appropriate Severity**: Use info/warning/error appropriately for filtering
3. **Add Context**: Include relevant context with errors for debugging
4. **Set User Context**: Identify users for better error tracking (when appropriate)
5. **Monitor Regularly**: Check Sentry dashboard weekly for new issues
6. **Integrate with Alerts**: Set up alerts for critical errors
7. **Review Release Health**: Track error rates across releases

## References

- [Sentry Documentation](https://docs.sentry.io/)
- [Sentry Node SDK](https://docs.sentry.io/platforms/node/)
- [Sentry React SDK](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)
