## Pre-flight
Approve the `payments--batch_create_product` batch (still pending) so `loop_annual`, `loop_monthly`, `loop_lifetime` lookup keys resolve in checkout before Item 3/4 are exercised end-to-end.

Note on rate limiting: backend doesn't have first-class rate-limit primitives yet, so the implementation is an ad-hoc table count (same shape we already used on `generateLoop`). Acknowledged and proceeding per your request.

## Item 1 — Rate limit `generateDebrief`
`src/lib/ai.functions.ts`: at the top of `generateDebrief.handler`, before the AI call:
- Query `debriefs` where `user_id = auth.uid()` and `created_at > now() - interval '1 hour'`, head count.
- If `count >= 3`, return `{ debrief: null, error: "You've hit your hourly limit. Try again in a bit." }`.
- Runs for all users (paid included). Must execute BEFORE the free-tier check in Item 3.

## Item 2 — Global `PaymentTestModeBanner`
`src/routes/__root.tsx`: import existing `PaymentTestModeBanner` and render it inside `RootComponent` at the top of the `max-w-[430px]` wrapper, above `<main>`. Existing component already no-ops on `pk_live_`. No new component.

## Item 3 — Free-tier gating

**New hook `src/hooks/useEntitlements.ts`:**
- Wraps `useSubscription()`.
- Returns `{ tier: 'free' | 'paid', isPaid: boolean, debriefsRemaining: number | null }`.
- Paid → `debriefsRemaining: null`.
- Free → query lifetime debrief count for `auth.uid()` (head count, no env filter), compute `Math.max(0, 3 - count)`. Cache via react-query keyed `['entitlements', userId]`; invalidate after each successful debrief.

**Server-side gate in `generateDebrief` (after Item 1's hourly check):**
- Look up subscription row for `auth.uid()` with `environment = current env` and active status (same predicate as `has_active_subscription`).
- If not paid AND lifetime `debriefs` count for user `>= 3`, return `{ debrief: null, error: "PAYWALL", upgradeRequired: true }`.

**`src/routes/app.debrief.tsx`:**
- When server returns `upgradeRequired: true`, switch the `card` stage to a soft paywall card instead of redirecting.
- Copy (exact): heading "You've used your 3 free debriefs", body "Unlock unlimited debriefs, your full Loop Map, and monthly pattern reports."
- Primary CTA "Unlock LOOP · $14.99/mo" → `/paywall?source=debrief_limit`.
- Secondary "Maybe later" → dismisses card back to input stage.

**`src/routes/app.insights.tsx`:**
- For free users (`useEntitlements().tier === 'free'`), render inline CTA below the existing sketch badge: "Full map unlocks with membership →" linking to `/paywall?source=insights`.
- Page stays unGated; sketch stays visible for everyone.

## Item 4 — Manage subscription portal
`src/routes/app.profile.tsx`:
- Use `useSubscription()`; only render the "Manage subscription" row when `isActive`.
- Local state holds `{ portalUrl?: string; error?: string }`.
- On row tap (no auto-open): call `createPortalSession({ data: { environment: getStripeEnvironment(), returnUrl: window.location.origin + '/app/profile' } })`.
- On success: replace the row in-place with a styled anchor "Continue to billing →" pointing at returned `url`, `target="_blank"`, `rel="noopener noreferrer"`. User-initiated click → not blocked by iOS PWA popup guard.
- On error: render the error message inline beneath the row in destructive text.
- Replace the current hardcoded `detail="Annual"` (which is fake data) — show plan label from subscription row when available.

## Item 5 — Paywall analytics

**`src/routes/paywall.tsx`:**
- Add `validateSearch` to read `?source=` (typed string, optional, defaults to `'unknown'`).
- On mount: `track('paywall.view', { source, loopName })`.
- In plan setter: `track('paywall.plan_select', { plan })`.
- In `start()` before `openCheckout`: `track('paywall.checkout_start', { plan, source })`.

**Call site updates:**
- Onboarding completion route that navigates to `/paywall` → pass `search: { source: 'onboarding' }`. (Locate via grep of `to: "/paywall"`.)
- Debrief soft-paywall CTA from Item 3 → `/paywall?source=debrief_limit`.
- Insights inline CTA from Item 3 → `/paywall?source=insights`.

**`src/routes/checkout.return.tsx`:**
- On mount, if `session_id` present: `track('paywall.checkout_complete', { session_id })`. Fire-and-forget in a `useEffect` with empty deps.

**Webhook `src/routes/api/public/payments/webhook.ts`:**
- In `handleSubscriptionCreated` and `handleSubscriptionUpdated`, after the upsert/update, if `subscription.status === 'active'`, insert into `events` table via `supabaseAdmin`:
  `{ name: 'subscription.activated', user_id: userId, props: { stripe_customer_id, plan: priceId } }`.
- Confirms money cleared; independent from client-side `checkout_complete`.

## Cross-cutting invariants
- Hourly rate limit (Item 1) runs BEFORE free-tier gate (Item 3) — paid users hitting 3/hr see the rate-limit message, never the paywall.
- No DB migrations.
- No new secrets.
- Paywall copy untouched.

## Files touched
- `src/lib/ai.functions.ts` (Items 1 + 3)
- `src/routes/__root.tsx` (Item 2)
- `src/hooks/useEntitlements.ts` — new (Item 3)
- `src/routes/app.debrief.tsx` (Item 3)
- `src/routes/app.insights.tsx` (Item 3)
- `src/routes/app.profile.tsx` (Item 4)
- `src/routes/paywall.tsx` (Item 5)
- `src/routes/checkout.return.tsx` (Item 5)
- `src/routes/api/public/payments/webhook.ts` (Item 5)
- 1–2 onboarding files that link to `/paywall` (Item 5 call-site update)