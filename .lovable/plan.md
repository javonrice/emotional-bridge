
# LOOP — Mobile PWA Prototype

A mobile-first, iOS-feeling PWA for the LOOP app (emotional pattern intelligence / compulsive-behavior recovery). Goal of this build: a clickable, polished prototype with a long, psychologically engineered onboarding that lands on a paywall, followed by a fully mocked-data app so we can find UX gaps before wiring real data, Claude, Screen Time, or Supabase.

## Scope (in)
- Dark LOOP design system (near-black bg, electric indigo accent, Inter/SF stack)
- PWA installability (manifest + icons, **no service worker** — avoids preview-iframe issues)
- ~17-screen onboarding sequence engineered for psychological debt → paywall
- Mocked in-app experience (Home, Check-in, Debrief, Insights, Profile)
- iOS-native feel: safe-area padding, large titles, segmented controls, blur tab bar, sheet-style modals, spring transitions, tap-scale feedback, no browser chrome on install
- LocalStorage persistence for onboarding answers + mock streak so the prototype feels alive

## Scope (out, this pass)
- Real auth, real Supabase, real Claude calls, real Screen Time, real push, real payments
- Service worker / offline support
- Android-specific tuning beyond "it works"

---

## Onboarding flow (the conversion engine)

Each screen is one decision, full-bleed, with momentum forward. Answers stored in `localStorage` so reveals later feel personalized. Progress dots top of screen (except cinematic reveals).

1. **Splash** — Logo pulse, tagline "See what's running you.", Begin
2. **Truth opener** — "This isn't another blocker app." 3-line manifesto, Continue
3. **Question: age range** (chips)
4. **Question: how long has this loop been running?** (1y / 3y / 5y / 10y+)
5. **Cinematic reveal #1 (gut punch)** — Computes from answer: *"That's roughly 4,380 hours of your life inside the loop."* Animated counter ticks up. Single Continue.
6. **Question: how often do you feel out of control?** (slider 1–10)
7. **Question: which apps pull you in?** (multi-select: Instagram, TikTok, Reddit, X, YouTube, Dating, Discord, Other)
8. **Question: when does it usually happen?** (Morning / Afternoon / Late night / After conflict)
9. **Question: what feeling shows up first?** (Lonely, Bored, Stressed, Numb, Restless, Ashamed, Empty)
10. **Cinematic reveal #2 (mirror)** — "Most men who answer like you describe the same feeling: **[their pick] → [gateway app] → the loop.**" Pattern pills animate left-to-right.
11. **Story prompt** — "Tell me about the last time you felt the pull." Big text area, optional voice button (UI only).
12. **AI analyzing screen** — Pulse loop animation, rotating reassurance lines ("Reading your pattern…", "Mapping your triggers…"). ~3.5s.
13. **First Loop reveal card** — Mocked Claude response personalized with their inputs: loop name ("The Late Night Lonely Spiral"), trigger chain pills, 3-sentence summary. *This is the hook.*
14. **Social proof** — 3-card swipeable testimonials (mocked, on-tone, no shame).
15. **Science / trust** — "Awareness is the mechanism, not willpower." 3 bullet credibility points, calm icons.
16. **Commitment screen** — "Are you ready to see your loop clearly?" Two buttons: "I'm ready" (primary), "Not yet" (ghost, loops them back to a softer reframe then forward).
17. **Building your plan** — Animated checklist ticks off ("Mapping your triggers ✓", "Calibrating drift windows ✓", "Personalizing your loop ✓"). Builds anticipation.
18. **Paywall** — Cinematic. Plan summary card on top ("Your loop is ready"). Three options: **Annual $59.99 (Best value, ~$5/mo, 7-day free trial)** preselected, Monthly $14.99, Lifetime $149. Trust row (cancel anytime, encrypted, no shame). Sticky CTA "Start 7-day free trial". Small "Maybe later" link → soft objection-handler sheet → if dismissed, lands them in app anyway (prototype convenience).

Psychological levers used (textbook): commitment & consistency (micro-yeses early), loss framing (hours lost reveal), identity mirroring (reveal #2), specificity/personalization (their loop named for them), social proof, authority (science framing), anchoring (lifetime price makes annual feel cheap), default bias (annual preselected), reduced friction (free trial framing).

## App (post-paywall, mocked)

Bottom tab bar with iOS-style backdrop blur and SF-symbol-like icons:

- **Today** — Awareness Streak ring (animated SVG, 23 days mocked), "Today's check-in" CTA card, "Your latest insight" card, drift-window hint chip.
- **Check-in** — 3-step flow: Energy (Low/Med/High) → Emotion (7 cards) → Activity (6 cards). Completion screen updates mocked streak in localStorage with subtle confetti.
- **Debrief** — Text area + mock voice button → submit → animated analysis → mocked Debrief Card (shareable layout, screenshot-ready 9:16 aspect).
- **Insights** — Segmented control: Gateway / Loop / Monthly.
  - Gateway: ranked card with correlation bars (mocked top 5 apps).
  - Loop: SVG flow-graph visualization of nodes + curved edges with glow (static mock layout, no D3 dependency needed for prototype).
  - Monthly: 5-card horizontal swipeable Spotify-Wrapped-style sequence.
- **Profile** — Streak stats grid, "Your loop name", settings list (notifications, account, sign out — all non-functional toggles), "Manage subscription" row.

---

## Technical details

**Routes (TanStack Start file-based, kebab in URL, dot-separated filenames):**
```
src/routes/
  index.tsx                    -> redirects to /onboarding/welcome or /app/today based on localStorage flag
  onboarding.tsx               -> layout: safe-area shell + progress dots + back gesture
  onboarding.welcome.tsx
  onboarding.opener.tsx
  onboarding.age.tsx
  onboarding.duration.tsx
  onboarding.reveal-hours.tsx
  onboarding.control.tsx
  onboarding.apps.tsx
  onboarding.timing.tsx
  onboarding.feeling.tsx
  onboarding.reveal-mirror.tsx
  onboarding.story.tsx
  onboarding.analyzing.tsx
  onboarding.loop.tsx
  onboarding.proof.tsx
  onboarding.science.tsx
  onboarding.commit.tsx
  onboarding.plan.tsx
  paywall.tsx
  app.tsx                      -> layout: tab bar + safe-area
  app.today.tsx
  app.checkin.tsx              -> internal step state, no nested route needed
  app.debrief.tsx
  app.insights.tsx             -> segmented control switches sub-view in-component
  app.profile.tsx
```

**Design tokens** — Rewrite `src/styles.css` `:root` to LOOP palette (bg `#0A0A0F`, surface `#141420`, card `#1E1E30`, primary `#6C63FF`, success `#00E5A0`, text `#F0F0F8` / `#8888AA`). Add `--font-display` (SF Pro fallback → Inter). Add iOS-feel utility classes: `.tap-scale`, `.safe-top`, `.safe-bottom`, `.ios-blur`, `.sheet-grabber`.

**iOS feel kit:**
- `framer-motion` for spring page transitions (`bun add motion`)
- Tap feedback via `whileTap={{ scale: 0.97 }}`
- Bottom tab bar uses `backdrop-blur-xl` over a translucent surface
- Sheets use rounded-t-3xl with grabber bar
- Disable text selection on chrome elements, allow on inputs
- `viewport-fit=cover` + `env(safe-area-inset-*)` padding

**PWA installability (manifest-only, no SW):**
- `public/manifest.json` with `display: standalone`, `theme_color: #0A0A0F`, `background_color: #0A0A0F`, icons 192/512 (generated)
- iOS meta tags in `__root.tsx` head: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style: black-translucent`, `apple-touch-icon`
- No service worker (per Lovable PWA guidance — avoids preview iframe issues; installability still works)

**State / persistence:**
- Tiny `useOnboarding()` hook backed by `localStorage` for answers + completion flag
- `useMockStreak()` for streak counter
- No backend, no Supabase enablement this pass

**Charts/visuals:**
- Loop visualization: hand-authored SVG with `<filter feGaussianBlur>` glow — looks premium, zero dep cost
- Gateway bars: pure CSS
- Awareness ring: SVG circle with `stroke-dasharray` animation

**Dependencies to add:** `motion` (framer-motion successor). Recharts not needed for the mock — custom SVG is lighter and matches the cinematic spec better.

**Image assets:** Generate 2–3 (app icon 1024, splash/loop hero, paywall hero) with imagegen at premium for the icon, fast for the rest.

---

## Build order
1. Tokens + base shell (styles.css, __root meta, manifest, icons)
2. Onboarding layout + hook + all 17 screens with transitions
3. Paywall
4. App tab shell + 5 tab screens with mock data
5. Polish pass: spring transitions, tap-scale, blur tab bar, safe-area, viewport check at 390×844

Once approved I'll implement straight through.
