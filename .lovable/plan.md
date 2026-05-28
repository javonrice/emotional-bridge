# Four fixes

## 1. Voice input duplicates every word in Debrief

**Cause:** `recognition.onresult` fires repeatedly while you speak. The current handler loops from `resultIndex` through all results (including interim, non-final ones) and **appends** that growing chunk to `text` each time. So as the interim transcript grows, every iteration appends the whole running phrase again — producing duplicated/triplicated words.

**Fix in `src/routes/app.debrief.tsx` (`startVoice`):**
- Track a `baselineRef` snapshotted to the textarea value when recording starts.
- On each `onresult`, separate **final** vs **interim** results:
  - Accumulate final transcripts into a `committedRef` string.
  - Show interim as a live preview only.
- Set textarea value as `baseline + committed + interim` each event (replace, don't append).
- On `onend`, drop interim and keep `baseline + committed`.
- Keep `interimResults = true` for live feedback, but stop the `continuous = true` runaway by clearing interim on stop.

## 2. Past debriefs aren't clickable

In `app.debrief.tsx`, the "Past debriefs" `<li>` items are static. Make each item a button that loads that debrief into the existing card stage.

- Wrap each item in a `<button>` that calls a new `openSaved(item)` handler.
- `openSaved` sets `debrief` to the saved row, sets `stage = "card"`, scrolls to top.
- The existing card UI already renders pattern/reframe/micro_action — reuse it. Hide share-card "today" label when viewing an old one (show the saved date instead).
- Add a `← Back to debriefs` button on the card stage when viewing a past one (state flag `viewingPast`).

No server changes needed — `getDebriefHistory` already returns pattern/reframe/micro_action.

## 3. Check-in button isn't prominent enough

On `app.today.tsx`, the daily check-in is a subtle bordered card competing with the loop card. For first-time and not-yet-checked-in users, make it the unmistakable primary action.

Changes (when `!checkedInToday`):
- Replace the small card with a **full-width hero CTA**: large pill button (h-16, primary background, glow, white text) reading **"Check in now · 20 seconds"** with a subtle pulse animation when `total === 0` (first-time).
- Move it directly under the streak ring (above the Loop card) so it's the first interactive element below the header.
- Add a small caption underneath: "3 taps. Builds your map."
- Demote the secondary Debrief/Insights grid below the loop card (already there).
- When `checkedInToday`, keep current success state but add a secondary ghost button "Check in again" (see #4).

## 4. Multiple check-ins per day

Policy chosen: **allow multiple, count once for streak**. The streak logic in `getCheckinStats` already dedupes by local day, so streak is unaffected. Changes needed:

- `app.today.tsx`: in the `checkedInToday` branch, add a small ghost button "Check in again" linking to `/app/checkin` next to the success row. Reason: mood can shift through the day.
- `app.checkin.tsx`: after save, the "done" screen already shows streak — when this is a 2nd+ check-in today, change the headline from "Logged." to **"Updated."** and the subtext to "Second check-in today — your map gets more texture." Detect via comparing pre-save vs post-save `total` for the day, or by passing `wasAlreadyCheckedInToday` through navigation state (simplest: read `stats?.checkedInToday` *before* save into a ref).
- Insights: no change required — multiple entries naturally enrich aggregates. (Optional follow-up: group by day in the timeline if it gets noisy — not in this scope.)

No DB / RLS / server function changes required for #4 — `saveCheckin` already inserts a new row per call.

## Files touched
- `src/routes/app.debrief.tsx` — voice fix + clickable history + view-saved state
- `src/routes/app.today.tsx` — hero CTA + "check in again" affordance
- `src/routes/app.checkin.tsx` — "Updated." copy on 2nd+ same-day save

No migrations, no server function changes.
