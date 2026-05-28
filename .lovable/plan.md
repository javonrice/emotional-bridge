## Goal

When the user dismisses the paywall (X, "Not now", or objection sheet's secondary action), return them to the page they came from instead of always sending them to `/app/today`.

## Approach

Use the router's history to go back one step, with safe fallbacks for the two cases where "back" would land somewhere bad:

1. **Onboarding entry** (`source === "onboarding"`): the previous route is `/onboarding/plan`. Going back there would loop them into onboarding. Keep current behavior — call `completeOnboarding()` and `navigate({ to: "/app/today" })`.
2. **In-app entry** (any other source, e.g. `debrief_limit`, or no source / direct nav): call `router.history.back()`. This returns the user to whichever app screen they tapped Upgrade on (`/app/debrief`, `/app/insights`, etc.) and preserves their scroll/state naturally.
3. **No history fallback** (paywall opened as the very first navigation — e.g. deep link): if `window.history.length <= 1`, navigate to `/app/today`.

## Implementation

Edit `src/routes/paywall.tsx` only:

- Import `useRouter` from `@tanstack/react-router`.
- Rewrite `skip()`:
  ```ts
  const skip = () => {
    completeOnboarding();
    if (source === "onboarding" || window.history.length <= 1) {
      nav({ to: "/app/today" });
      return;
    }
    router.history.back();
  };
  ```
- Keep `completeOnboarding()` in all paths so a returning user who happened to land on the paywall during the onboarding flow doesn't get bounced back into onboarding later.
- No other handlers change — X / "Not now" / objection sheet already call `skip()` after the previous fix.

## Out of scope

- No changes to entry points (`app.debrief.tsx`, `app.insights.tsx`, `onboarding.plan.tsx`).
- No changes to Stripe checkout, server functions, or entitlements.

## Files touched

- `src/routes/paywall.tsx`
