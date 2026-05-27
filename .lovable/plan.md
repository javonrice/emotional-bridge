
# LOOP — Phased Build Plan (Prototype → Shippable Product)

**Product framing:** LOOP ships as a **self-report awareness tool**. Every screen that would consume iOS Screen Time data shows a "🍎 Auto-tracking — Coming soon on iOS" badge with a waitlist tap, while the user manually logs check-ins and debriefs. Lovable AI Gateway powers the personalized loop naming, debrief reframes, and pattern summaries — with thumbs-up/down feedback wired in from day one so we can iterate prompts on real signal.

---

## Phase 1 — Foundation: Cloud, Auth, Data Migration
**Goal:** Real backend, real users, localStorage answers persist to the cloud.

- Enable Lovable Cloud.
- Auth: email/password + Google (via Lovable broker). `/login`, `/signup`, `/reset-password`, `/auth/callback`.
- Tables (all RLS-on, `user_roles` separate):
  - `profiles` (auto-created via trigger)
  - `onboarding_answers` (one row per user)
  - `checkins` (energy, emotion, activity, timestamp)
  - `debriefs` (text, reframe_json, created_at)
  - `loops` (name, trigger_chain, summary, generated_by_ai, model, prompt_version)
  - `subscriptions` (plan, status, trial_end, stripe_customer_id)
  - `user_roles` + `has_role()` security-definer function
- `_authenticated` layout wraps `/app/*`; unauth users → `/login`.
- One-time localStorage → Cloud migration on first login.
- Server fn `migrateLocalAnswers`.

**Deliverable:** A user can sign up, get their data persisted, sign in on another device and see the same loop.

---

## Phase 2 — AI Gateway: Generation + Quality Feedback Loop
**Goal:** Replace `deriveLoopName` template with real LLM output, and instrument quality from day one.

### Generation
- Add `LOVABLE_API_KEY` via `ai_gateway--create`.
- `src/lib/ai-gateway.server.ts` helper (OpenAI-compat provider).
- Server fns (`createServerFn` + `requireSupabaseAuth`):
  - `generateLoop({ answers })` → structured output (loop name, 3 trigger chain pills, 3-sentence summary). Persisted to `loops` with `model` + `prompt_version`.
  - `generateDebrief({ text })` → structured reframe card (pattern, gentle reframe, micro-action). Persisted to `debriefs` with same metadata.
  - `generateMonthlyReport({ userId })` → Spotify-Wrapped style narrative.
- Model: `google/gemini-3-flash-preview`. Surface 429/402 as friendly toasts.
- Onboarding `analyzing.tsx` calls real `generateLoop`.

### Quality feedback (day-one signal)
- New table `ai_feedback`:
  ```
  id, user_id, surface ('loop_card' | 'debrief_card' | 'monthly_report'),
  source_id (FK to loops/debriefs), rating ('up' | 'down'),
  reason (nullable enum: 'generic', 'inaccurate', 'tone_off', 'too_long', 'other'),
  comment (nullable text, max 500), model, prompt_version,
  answers_snapshot (jsonb — what the prompt saw), created_at
  ```
  RLS: user inserts own rows; admin role reads all.
- `<AIFeedback />` component: subtle thumbs-up/down pair under every AI-generated card. One-tap up = silent log. Tap down → sheet with reason chips + optional comment.
- Wired into: First Loop Reveal card (onboarding), every Debrief Card, every Monthly Report card.
- Server fn `recordAIFeedback({ surface, sourceId, rating, reason?, comment? })`.
- Admin route `/admin/ai-quality` (gated by `has_role('admin')`):
  - 7/30/90-day up/down rates per `surface` and `prompt_version`.
  - Filter by reason; sort low-rated outputs to inspect prompt + answers snapshot side-by-side.
  - "Bad output" view for prompt iteration.
- `prompt_version` constant in `ai-gateway.server.ts` — bump on every prompt change so we can A/B compare versions in the admin view.
- Optional: random 10% of outputs get a second model run (`gpt-5-mini`) stored shadow-side for offline comparison once dataset is meaningful.

**Deliverable:** Every AI output is rateable, every rating is tied to the exact prompt version + inputs that produced it, and we have a real dashboard for prompt iteration instead of vibes.

---

## Phase 3 — Payments: Stripe Subscriptions
**Goal:** Paywall enforces access; free tier is intentionally thin.

- Run `recommend_payment_provider` → enable Stripe (digital service).
- Products: Annual $59.99 (7d trial), Monthly $14.99, Lifetime $149.
- Checkout server fn + `/api/public/stripe-webhook` route (signature verified) → writes `subscriptions` row.
- `useSubscription()` hook gates premium routes.
- **Free tier:** today + 1 check-in/day, no debrief, no insights, no loop reveal beyond name.
- "Maybe later" → real limited mode.
- Restore purchase + Stripe portal link.

**Deliverable:** Real money can be collected; non-payers see a real wall.

---

## Phase 4 — iOS "Coming Soon" Layer
**Goal:** Honestly position auto-tracking as future native iOS without breaking the PRD's promise.

- Reusable `<ComingSoonBadge variant="ios" />` — Apple glyph + "Auto-tracking · iOS soon".
- `onboarding.tracking-mode.tsx`: **Self-report (now)** vs **Auto-tracking (iOS, coming soon — join waitlist)**.
- `ios_waitlist` table; "Notify me" stores email + answers.
- Insights → Gateway: blurred "auto-detected" card with Coming Soon overlay + "For now, based on what you told us" using self-reported `apps`.
- Drift windows: manual picker now, "auto-detected" Coming Soon.
- Profile → "Connect iOS Screen Time" → waitlist sheet.
- Feature flag flips these live when native ships, no redesign.

**Deliverable:** Product feels complete and honest.

---

## Phase 5 — Core App Completion (self-report depth)
**Goal:** The five tabs become a real daily product.

- **Today:** real streak (server-computed, timezone-aware, decays on miss), check-in CTA, latest insight card, manual drift reminder chip.
- **Check-in:** persist to `checkins`, back-nav between steps, edit today's entry.
- **Debrief:** Web Speech API voice input, submit → real `generateDebrief`, history list, share-card PNG export (html-to-image), thumbs feedback inline.
- **Insights:**
  - Gateway (self-report): tally from check-in `activity` over time.
  - Loop: SVG flow from real check-in sequences (≥14 entries; <14 → "X more days" empty state).
  - Monthly: real `generateMonthlyReport` at ≥30 days, also rateable.
- **Profile:** real stats grid, edit loop name, manage subscription, notification settings, export data (GDPR), delete account. Remove dev "Restart onboarding".

**Deliverable:** No mock data anywhere; loading/empty/error states everywhere.

---

## Phase 6 — Notifications & Install
**Goal:** Re-engagement within PWA limits.

- Notification permission screen post-paywall.
- Web Push via SW (Android + iOS 16.4+ installed PWA).
- `scheduleDriftReminder` server fn + daily cron at `/api/public/cron/drift-push`.
- "Add to Home Screen" iOS walkthrough.
- Service Worker (kill-switch-safe pattern): offline shell + push only, NetworkFirst HTML.
- Splash screens, theme-color, manifest polish.

**Deliverable:** Daily nudge on installed PWAs.

---

## Phase 7 — Safety, Legal, Trust
**Goal:** Mental-health-adjacent product ships responsibly.

- Crisis resource screen (Profile + auto-surfaced on risk-keyword regex pre-filter in debrief input).
- Disclaimer on first AI output: "LOOP is not therapy."
- Terms, Privacy, EULA pages (placeholder; flag for legal review).
- Subscription terms on paywall (auto-renewal, cancel anytime).
- Cookie/analytics consent banner.
- Data export + account deletion endpoints.

**Deliverable:** GDPR / subscription guidelines defensible.

---

## Phase 8 — Polish, A11y, Funnel Analytics
**Goal:** Ship-quality finish.

- **Funnel analytics** (separate from AI feedback): events on every onboarding step + paywall view/select/start/abandon + check-in + debrief submit + feedback rating. Write to local `events` table; query for funnel + retention. PostHog optional later.
- A11y: ARIA on custom buttons, focus rings, WCAG AA contrast, `prefers-reduced-motion` opt-out, SVG `<title>` labels.
- 404, error boundaries on every route.
- `noindex` on onboarding/auth.
- Lighthouse 90+ mobile.

**Deliverable:** Production-ready.

---

## Technical Notes

- All AI calls via `createServerFn` + `requireSupabaseAuth` + `ai-gateway.server.ts`. No client-side AI keys.
- Every AI generation writes `model` + `prompt_version` alongside its output — feedback joins on that to compare prompts.
- All payment writes via signed Stripe webhook → `supabaseAdmin`.
- Every new table: `GRANT` block + RLS policies in the same migration.
- Verify `src/start.ts` has `attachSupabaseAuth` in `functionMiddleware` before Phase 1.
- iOS "Coming Soon" is a single component reused everywhere.

## Out of scope (deferred to native iOS app)
Real Screen Time data, precise background push scheduling, Apple/Google IAP, App Store submission, native haptics. All visible in-product as "Coming soon."

## Build order
Phase 1 → 2 → 3 = product-vs-prototype line. Phases 4–8 = shippable-product line. Each phase independently shippable.
