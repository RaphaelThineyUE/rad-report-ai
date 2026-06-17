# API Error Format

This document describes the unified error format for all API endpoints.

## Standard Error Response Format

All API errors return a consistent JSON structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": null  // Optional field with additional context
  }
}
```

### Fields

- **code** (string, required): Machine-readable error code for client-side handling
- **message** (string, required): Human-readable error description
- **details** (any, optional): Additional error context (e.g., validation field errors)

## HTTP Status Codes

| Status | Code | Usage |
|--------|------|-------|
| 400 | VALIDATION_ERROR | Invalid request data, malformed input, or missing required fields |
| 401 | UNAUTHORIZED | Authentication failed or token expired |
| 403 | FORBIDDEN | User lacks permission for this resource |
| 404 | NOT_FOUND | Resource does not exist |
| 409 | CONFLICT | Resource already exists or conflict with existing data |
| 413 | FILE_TOO_LARGE | Uploaded file exceeds maximum allowed size |
| 422 | INVALID_UPLOAD / VALIDATION_ERROR | Invalid file format or upload payload |
| 500 | INTERNAL_ERROR | Unexpected server error |

## Common Error Codes

### Authentication & Authorization
- `UNAUTHORIZED` - Invalid credentials or expired token
- `FORBIDDEN` - User is not authorized to access this resource
- `LOGIN_FAILED` - Login attempt failed

### Data Validation
- `VALIDATION_ERROR` - Input validation failed (includes details array)
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource already exists

### File Operations
- `FILE_TOO_LARGE` - File exceeds maximum size
- `INVALID_UPLOAD` - Invalid file format or upload

### Server
- `INTERNAL_ERROR` - Unexpected server error

## Example Responses

### Validation Error
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid patient data",
    "details": [
      {
        "location": "body",
        "param": "email",
        "msg": "Invalid email"
      }
    ]
  }
}
```

### Resource Not Found
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Patient not found"
  }
}
```

### Unauthorized
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Unauthorized"
  }
}
```

### Internal Error
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to fetch patients"
  }
}
```

## Error Handling in Controllers

All backend controllers should throw errors using the `Errors` helper:

```typescript
import { Errors } from '../utils/AppError.js';

// Validation error
throw Errors.validation('Invalid patient data', validationErrors);

// Not found
throw Errors.notFound('Patient');

// Unauthorized
throw Errors.unauthorized();

// Forbidden
throw Errors.forbidden();

// Conflict
throw Errors.conflict('Patient already exists');

// File error
throw Errors.fileError('Invalid PDF', 'INVALID_PDF');

// Internal error
throw Errors.internal('Failed to fetch patients');
```

## Error Handler Middleware

The global error handler middleware (`backend/src/middleware/errorHandler.ts`) catches all thrown errors:

1. **AppError instances** - Standardized using `Errors` helpers
   - Extracts code, message, details
   - Returns with appropriate HTTP status code

2. **Multer errors** - File upload errors
   - `LIMIT_FILE_SIZE` → 413 FILE_TOO_LARGE
   - Other multer errors → 422 INVALID_UPLOAD

3. **Unhandled errors** - Generic errors
   - Logged with full details
   - Returns 500 INTERNAL_ERROR (never leaks stack trace)

All errors are logged via the structured logger before being returned to the client, ensuring PHI is never leaked to error responses.

## Frontend Error Handling

The frontend should:

1. Check for `error` object in response
2. Display `error.message` to the user
3. Use `error.code` for specific handling (retry logic, redirects, etc.)
4. Log errors for debugging but never log sensitive details

```typescript
// Example: Frontend error handling
try {
  const response = await api.post('/patients', data);
  // Handle success
} catch (error) {
  if (error.response?.data?.error) {
    const { code, message, details } = error.response.data.error;
    
    // Handle specific errors
    if (code === 'VALIDATION_ERROR') {
      // Show validation details to user
      displayValidationErrors(details);
    } else if (code === 'UNAUTHORIZED') {
      // Redirect to login
      redirectToLogin();
    } else {
      // Show generic error message
      showErrorNotification(message);
    }
  }
}
```
