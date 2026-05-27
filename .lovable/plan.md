
# LOOP UX Experience Build — Phased Plan

The spec is too big for one safe pass (touches Today, Check-in, Debrief, Insights, Profile, server stats, share export, and milestone moments). Splitting into 4 phases so each is testable end-to-end before stacking the next.

Several spec items are already done from earlier turns:
- Fake testimonials removed (`onboarding.proof.tsx`)
- Fake "9,420" stat removed (`onboarding.reveal-mirror.tsx`)
- Insights monthly empty state for new users
- Gateway "iOS coming soon" waitlist UX

Remaining work below.

---

## Phase 1 — Fix the Day 0 cliff (Critical + High audit items)

Goal: a brand-new user lands on Today and never sees fake data, dead ends, or drift warnings.

1. **Profile stats real numbers** (`app.profile.tsx`, `checkins.functions.ts`)
   - Add `totalDebriefs` to `getCheckinStats` return shape (count from `debriefs` table for `auth.uid()`).
   - Replace hardcoded `47` / `12` with `stats.total` / `stats.totalDebriefs`.

2. **Today screen — Day 0 + checked-in-today states** (`app.today.tsx`)
   - Derive `checkedInToday` from `stats.days` + today's local key.
   - Replace static drift fallback with branch-by-count copy (0, <7, ≥7).
   - Replace empty StreakRing with "Your awareness streak starts today" glyph when `streak === 0`.
   - First-timer dismissable orientation card (localStorage flag).
   - Free-tier pill under Debrief tile showing remaining debriefs.
   - When already checked in: success card + "Had an urge? Talk it out →".

3. **Post-check-in momentum** (`app.checkin.tsx` done state)
   - Show updated streak prominently.
   - Milestone copy at streak 1 / 7 / 14 / 30.
   - Soft debrief prompt + "Not right now" → back to Today.
   - Day 1 only: subtle "Share your start" ghost button.

---

## Phase 2 — Debrief polish + free-tier transparency

Goal: free users always know where they stand; debrief becomes the primary shareable moment.

1. **Debrief history visible** (`app.debrief.tsx`)
   - Render the already-fetched history list (collapsed by default).
2. **Share card** (`app.debrief.tsx` card stage)
   - Add `html-to-image` dep, "Share this insight" button → `toPng()` + `navigator.share()` (fallback download).
3. **Free-tier counters** in debrief done states
   - 1st: "2 free debriefs remaining"
   - 2nd: "1 free debrief remaining · Unlock unlimited"
   - 3rd: full value card → soft paywall

---

## Phase 3 — Milestones + Insights progress

Goal: streak 7 / 14 / 30 each feel like a moment; loop tab shows progress toward first map.

1. **Milestone screens** — full-screen overlay after check-in at 7 / 14 / 30 with large ring, label ("WEEK ONE", etc.), 1-line data reflection, Share CTA, "Continue".
2. **Day 14** auto-deep-link to Insights → Loop tab.
3. **Loop tab progress counter** (`app.insights.tsx`) — "X of 3 check-ins" when under threshold.
4. **Today loop card** uses real drift language once `total ≥ 14` and `loop?.summary` exists.

---

## Phase 4 — Monthly Report (Day 30+) Spotify-Wrapped moment

Goal: 5-card swipeable monthly report, each card individually shareable.

1. AI-generated monthly summary server fn — pulls last-30-day check-ins + computes shift (first 15 vs last 15), top gateway, dominant pattern.
2. 5 cards: The Number / Most Loud / Your Pattern / Top Gateway / The Shift — dark gradient, LOOP watermark, share button per card.
3. "Share all" → collage export.
4. Day 30 check-in done state CTA → Monthly tab.

---

## Technical Notes

- **DB**: Phase 1 needs `getCheckinStats` to also query `debriefs` (no schema change — table exists). Phase 4 may need a `monthly_reports` cache table to avoid re-running the AI summary on every open.
- **Share export**: `html-to-image` (~30 KB gzip) — already in package spec, not installed.
- **Milestone overlay**: new shared `MilestoneSheet` component reused across check-in done + deep-link landings.
- **Free-tier**: `useEntitlements` already exposes tier; debrief count comes from new `totalDebriefs` in stats.

---

## Recommendation

Ship **Phase 1 first** — it removes every "this looks broken to a new user" signal, which is the single highest-leverage change. Phases 2–4 are additive momentum once Day 0 is solid.

Approve to start Phase 1, or tell me to bundle Phase 1+2 or run a different order.
