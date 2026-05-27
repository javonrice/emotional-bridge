## Problem

Auth completes server-side but the UI never moves forward. Three distinct bugs are colliding:

**1. Email signup for an existing email silently no-ops.**
Auth logs show repeated `user_repeated_signup` events at `200 OK` for `javonhrice@gmail.com`. Supabase intentionally returns success **with no session** when an email is already registered (to prevent email enumeration). `login.tsx` shows no error, the `isAuthenticated` effect never fires, and the user sits on the form.

**2. Email signup for a brand-new email also returns no session.**
Email confirmation is currently required (we never enabled auto-confirm). `signUp()` succeeds but `session` is null until the user clicks the confirmation email. The current UI shows nothing — no "check your email" state, no redirect — so it looks broken.

**3. Google sign-in returns to `/login`, then sometimes bounces.**
`redirect_uri` is `window.location.origin + "/login"`. After tokens are set, the effect navigates to `/app/today`. `app.tsx`'s `beforeLoad` calls `supabase.auth.getUser()` immediately — on a cold navigation the session can still be hydrating, `getUser()` returns null, and the guard redirects back to `/login`. That's the "loops back to sign in" symptom.

## Fix — standard iOS app pattern

### A. Auth configuration
- Enable **auto-confirm email signups** (`auto_confirm_email: true`) so a brand-new email signup returns a session immediately and goes straight into the app, like Instagram/Threads/etc.
- Keep Google + email/password, leaked-password protection stays on.

### B. `src/routes/login.tsx`
- **Detect "user already exists" on signup.** After `signUp()`, if `data.user && !data.session && data.user.identities?.length === 0`, show an inline message: "An account with this email already exists — sign in instead." and auto-flip `mode` to `"signin"` with email prefilled.
- **Surface real errors** from both signUp and signInWithPassword (currently only `error.message` is shown but the silent-success case isn't handled).
- **Guard against double-submit** while `busy`.
- **Wait for session before navigating.** Replace the success-effect with a single `onAuthStateChange` listener that fires on `SIGNED_IN`, runs the answers migration, then navigates. This removes the race where we navigate before the session is written to localStorage.

### C. `src/routes/app.tsx` route guard
- Replace the loader's `supabase.auth.getUser()` (network call, can race) with `supabase.auth.getSession()` for the initial gate. If no session, *then* fall back to `getUser()` once before redirecting. This matches the recommended Supabase pattern and stops the cold-nav bounce after OAuth.

### D. Google sign-in
- No code change needed beyond (C). Confirm `redirect_uri` is `window.location.origin + "/login"` (already correct) so preview and published each return to themselves.

## Files touched

- `supabase/config.toml` — via `configure_auth` tool (auto-confirm on)
- `src/routes/login.tsx` — better error handling, signed-in listener, repeated-signup branch
- `src/routes/app.tsx` — session-first guard

## What stays the same

- Onboarding → `/login?redirect=/onboarding/plan` flow
- `migrateLocalAnswers` server function
- `lovable.auth.signInWithOAuth("google", …)` call
- RLS, profiles trigger, user_roles

## Out of scope

- Password reset page (not reported as broken; can add after if you want).
- Apple sign-in.
