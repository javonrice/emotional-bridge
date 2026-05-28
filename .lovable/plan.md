## The bug

On `src/routes/paywall.tsx` there is no working exit when the paywall is opened mid-app (from an "Upgrade" / "Unlimited debriefs" CTA):

- The top-right **X** opens the "Before you go —" sheet instead of leaving the screen.
- The sheet's secondary button ("Continue with limited access") is wired to `onSkip={start}` — `start` is the **checkout opener**, not the skip handler. Tapping it re-opens Stripe checkout, which is the loop the user is hitting. If Stripe errors, the user lands back on the same paywall with no way out.
- The `skip()` function that actually navigates to `/app/today` is defined but never called.
- "Not now" under the primary CTA also just opens the sheet again.

So every "exit" path on the paywall either re-opens checkout or re-opens the dismissal sheet. There is no button that returns the user to the app.

## Fix

Edit `src/routes/paywall.tsx` only — no business logic, no backend changes.

1. **Top-right X → exit to app immediately.** Change the close button's `onClick` from `setShowSheet(true)` to `skip()`. The objection sheet is a soft retention prompt; the X should mean "get me out."
2. **Sheet's secondary action → actually skip.** Change `<Objection ... onSkip={start} />` to `onSkip={skip}` so "Continue with limited access" navigates to `/app/today` instead of re-opening checkout.
3. **"Not now" under the primary CTA → exit, don't re-prompt.** Change its `onClick` from `setShowSheet(true)` to `skip()`. (The objection sheet still appears once, triggered by intentional dismissal flows; we keep the sheet component itself but only as the soft confirm — see #4.)
4. **Keep one soft-confirm path.** Optional, but recommended: keep the objection sheet reachable from a single subtle "Maybe later" link so the marketing prompt still exists, but its primary button ("Take me back") stays on paywall and its secondary button ("Continue with limited access") calls `skip()`. If we want to simplify, we can remove the Objection sheet entirely and rely on X + "Not now" → `skip()`. Recommend removing for clarity.
5. **Source-aware destination.** `skip()` currently always goes to `/app/today`. That is the right default for both in-app upgrade CTAs and onboarding. No change needed beyond confirming `completeOnboarding()` is still called so an onboarding user who skips doesn't get bounced back into the onboarding flow.

## Out of scope

- No changes to Stripe checkout, server functions, entitlements, or the debrief paywall stage.
- No changes to the in-app upgrade CTAs themselves (they correctly route to `/paywall`).
- The Stripe error-handling improvement suggested in the stack-overflow context is not needed for this fix — the root cause here is purely missing exit wiring on the paywall route.

## Files touched

- `src/routes/paywall.tsx`
