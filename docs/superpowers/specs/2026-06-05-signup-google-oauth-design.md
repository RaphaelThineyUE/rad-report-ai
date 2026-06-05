# Signup & Google OAuth Design

**Date:** 2026-06-05
**Status:** Approved

---

## Summary

Add self-serve email/password signup and Google OAuth (sign in + sign up) to the RadReport AI frontend. Email confirmation is required before a new user can access the app. Google OAuth users are signed in immediately after the OAuth callback.

---

## Architecture & Routes

### New routes

| Route | Component | Access |
|---|---|---|
| `/signup` | `Signup.tsx` | Public |
| `/signup/confirm` | `SignupConfirm.tsx` | Public |

### Modified files

| File | Change |
|---|---|
| `src/pages/Login.tsx` | Add Google OAuth button + "Don't have an account? Sign up" link |
| `src/App.tsx` | Register `/signup` and `/signup/confirm` routes |
| `src/contexts/AuthContext.tsx` | Expose `signInWithGoogle()` method |

### Supabase methods used

- `supabase.auth.signUp({ email, password, options: { data: { full_name } } })` — email signup
- `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/worklist' } })` — Google OAuth
- Existing `supabase.auth.signInWithPassword` — unchanged
- Existing `onAuthStateChange` in `AuthContext` — picks up Google OAuth session automatically

> **Prerequisite (out of code scope):** Google OAuth provider must be enabled in the Supabase project dashboard before the Google button works in production.

---

## UI Components

### `Signup.tsx`

Two-panel layout mirroring `Login.tsx` (brand panel left, form right).

Form fields:
- Full name (text, required)
- Work email (email, required)
- Password (password, required, min 8 chars)
- Confirm password (password, required, must match password)

Actions:
- "Create account" submit button
- "Already have an account? Sign in" link → `/login`
- Google OAuth button (same as on login page, above the form with "or" divider)

On success → navigate to `/signup/confirm`, passing email via router `state`.

### `SignupConfirm.tsx`

Centered layout. Shows:
- Mail icon
- Heading: "Check your inbox"
- Body: "We sent a confirmation link to `<email>`."
- "Back to sign in" link → `/login`

### `Login.tsx` additions

- Google OAuth button above the email/password form, with an "or continue with email" divider below it
- "Don't have an account? Sign up" text link below the "Sign in securely" button

### Google button

Reuses existing `btn` class. Inline Google logo SVG. Identical component used on both `/login` and `/signup`.

---

## Data Flow

### Email signup

```
User submits form
  → client validates (passwords match, min length)
  → supabase.auth.signUp(...)
  → success: navigate('/signup/confirm', { state: { email } })
  → user clicks email link
  → Supabase redirects back → onAuthStateChange fires
  → ProtectedRoute lets user through to /worklist
```

### Google OAuth

```
User clicks Google button
  → supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: '/worklist' })
  → browser navigates to Google
  → Google redirects back to app
  → Supabase sets session → onAuthStateChange fires
  → user lands on /worklist
```

---

## Error Handling

### Signup form

| Condition | Handling | Message |
|---|---|---|
| Passwords don't match | Client-side, blocks submit | "Passwords do not match" |
| Password too short | Client-side, blocks submit | "Password must be at least 8 characters" |
| Email already registered | Supabase error | "An account with this email already exists" |
| Network / unknown error | Catch block | "Something went wrong. Please try again." |

### Google OAuth

If `signInWithOAuth` throws (e.g. misconfigured provider), show an inline error on the Google button row.

---

## Testing

All tests live in `frontend/tests/auth-flow.spec.ts`. Supabase auth API calls are intercepted via `page.route()` to return controlled responses without hitting real Supabase.

### New: `Signup Flow` describe block

- Should display signup form with name, email, password, confirm password, and submit button
- Should show error when passwords do not match (client-side)
- Should show error when password is shorter than 8 characters (client-side)
- Should navigate to `/signup/confirm` after successful signup (mocked Supabase response)
- Should display "check your inbox" message on `/signup/confirm`
- Should display the submitted email on `/signup/confirm`
- Should link back to `/login` from `/signup/confirm`
- Should link to `/signup` from `/login`

### New: `Google OAuth` describe block

- Should display Google sign-in button on `/login`
- Should display Google sign-in button on `/signup`
- Clicking Google button should initiate navigation away from the app (full round-trip not testable without a real Google account)

---

## Out of Scope

- Admin invite flow
- Email template customisation
- Social providers other than Google
- Rate limiting / CAPTCHA on signup
