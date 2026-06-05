# Self-Service Sign-Up Flow — Design Spec

**Date:** 2026-06-05  
**Status:** Approved

---

## Overview

Add a self-service sign-up flow to RadReport AI. New users register with email + password + full name, verify their email before gaining access, and can also sign up or sign in via Google OAuth. The Login page is updated to expose Google OAuth and link to sign-up.

---

## Routes & Navigation

| Route | Component | Notes |
|-------|-----------|-------|
| `/signup` (new) | `SignUp.tsx` | Public, no auth required |
| `/login` (existing) | `Login.tsx` | Updated: add Google button, sign-up link, remove hardcoded email |

Cross-links:
- `Login` → "Don't have an account? **Sign up**" → `/signup`
- `SignUp` → "Already have an account? **Sign in**" → `/login`

---

## AuthContext Changes

Add `signUp` to `AuthContextType` and implementation:

```ts
signUp(email: string, password: string, fullName: string): Promise<void>
```

Calls `supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })`. Throws on error so the calling page can handle it.

`signInWithGoogle` is already implemented — no change needed, just consumed by both Login and SignUp pages.

---

## SignUp Page

**Layout:** Identical two-column structure to `Login.tsx` (left brand panel 46%, right form panel 54%).

**Form fields (in order):**
1. Full name (text, required)
2. Work email (email, required)
3. Password (password, required, min 8 characters)

**Above the form fields:** "Continue with Google" button (calls `signInWithGoogle` from `useAuth()`), followed by an "or" divider.

**On submit:** Calls `signUp(email, password, fullName)` from `useAuth()`. On success, transitions to a confirmation state (no navigation — in-page state change).

**Confirmation state** (mirrors ForgotPassword success UI):
- Check icon in success circle
- Heading: "Check your email"
- Body: "We've sent a confirmation link to `{email}`. Click it to activate your account, then sign in."
- "Back to sign in" button → `/login`

**Error handling** (inline banner above form, same style as Login):
- Duplicate email: "An account with this email already exists."
- Weak password: surface Supabase's message directly.
- Network/unknown: "Something went wrong. Please try again."

---

## Login Page Changes

1. Remove hardcoded default email (`r.kaur@stmary-imaging.org`).
2. Add "Continue with Google" button + "or" divider above the email field (calls `signInWithGoogle` from `useAuth()`).
3. Add "Don't have an account? **Sign up**" link below the submit button → `/signup`.

---

## Email Verification Flow

Supabase sends a confirmation email on sign-up (enabled by default in Supabase Auth settings). The confirmation link redirects to the app origin. The catch-all route in `App.tsx` redirects unauthenticated traffic to `/login`, so users land on the sign-in page naturally after confirming.

No new redirect page needed.

---

## Out of Scope

- Admin-managed invites
- Email/domain allowlisting
- Post-sign-up profile completion wizard
- Two-factor authentication
