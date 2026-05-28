## Goal

Switch the debrief Listen button to **ElevenLabs** with three cost controls baked in from day one: server-side caching, per-user monthly quota, and a global daily ceiling.

## Setup needed from you

Add your `ELEVENLABS_API_KEY` as a secret. I'll prompt for it after you approve. Get it from elevenlabs.io → Profile → API Keys.

## Architecture

```text
Listen click
  → server fn synthesizeDebrief({ debriefId })
      → check global daily cap (kill switch)
      → check user monthly quota
      → check tts_cache for sha256(voice+model+text) hit
          ├─ HIT  → return cached MP3 URL (free)
          └─ MISS → call ElevenLabs → store MP3 → record usage → return URL
  → browser plays MP3 from data URI or signed URL
```

## Database changes (one migration)

1. **`tts_cache`** — cached audio keyed by content hash.
   - `content_hash` (PK, text) — `sha256(voiceId + model + text)`
   - `audio_path` (text) — Storage path for the MP3
   - `chars` (int), `created_at`, `last_used_at`, `hit_count`
   - RLS: `authenticated` can read; service role writes (only the server fn touches it).

2. **`tts_usage`** — per-user monthly char counter.
   - `user_id`, `month` (date, first of month), `chars_used` (int)
   - PK: `(user_id, month)`
   - RLS: users read own; service role writes.

3. **`tts_global_usage`** — app-wide daily counter for the kill switch.
   - `day` (date, PK), `chars_used` (int)
   - RLS: admin reads; service role writes.

4. **Storage bucket** `tts-cache` (private). Signed URLs (1h) returned to the client.

## Server function `src/lib/tts.functions.ts`

`synthesizeDebrief({ debriefId })`, auth-protected (`requireSupabaseAuth`):

1. Load the debrief row, verify it belongs to the user, build the text (`Pattern… Reframe… Try next time…`).
2. Compute `content_hash = sha256(voiceId + model + text)`.
3. Cache hit? Bump `hit_count` + `last_used_at`, return signed URL. Done.
4. Cache miss → run the checks:
   - **Per-request cap**: text length ≤ 800 chars. Reject if longer.
   - **Global daily cap**: `tts_global_usage.chars_used + len > 200_000` (configurable via `TTS_DAILY_CHAR_CAP` env) → return `{ error: "tts_unavailable" }`.
   - **User monthly quota**:
     - Free tier: 5,000 chars/mo (~12 listens)
     - Paid tier: 50,000 chars/mo (~125 listens)
     - Over quota → return `{ error: "quota_exceeded", upgrade: true }`.
5. Call ElevenLabs (Sarah voice `EXAVITQu4vr4xnSDxMaL`, model `eleven_turbo_v2_5`, format `mp3_22050_32`).
6. Upload MP3 to `tts-cache/{hash}.mp3` via `supabaseAdmin`.
7. Insert into `tts_cache`, increment `tts_usage` and `tts_global_usage` (upsert).
8. Return `{ audioUrl: signedUrl, cached: false, remainingChars }`.

Read entitlements via the same path `useEntitlements` uses on the server (or inline `has_active_subscription`).

## Hook `src/hooks/useSpeech.ts` (rewrite)

- Same public shape: `supported`, `isSpeaking`, `isLoading`, `speak(debriefId)`, `stop()`.
- **Change**: `speak` takes a `debriefId` (not raw text) so the server controls the exact characters billed.
- Calls the server fn, plays returned signed URL via `<audio>`.
- Surfaces clean toast messages for `quota_exceeded` ("You've used your monthly listens — upgrade for more") and `tts_unavailable` ("Voice playback is paused for the day").
- In-memory `Map<debriefId, signedUrl>` so re-clicking in the same session skips even the server roundtrip.

## Debrief screen `src/routes/app.debrief.tsx`

- `speech.speak(debrief.id)` instead of raw text.
- Show a tiny "X listens left this month" caption under the button for free users when remaining ≤ 3 (mirrors the existing debrief-remaining UX).
- Toast for quota/unavailable errors.

## Cleanup

- Remove `kokoro-js` dependency.

## Configurable limits (env vars, all optional with sane defaults)

- `TTS_FREE_MONTHLY_CHARS` (default 5000)
- `TTS_PAID_MONTHLY_CHARS` (default 50000)
- `TTS_DAILY_CHAR_CAP` (default 200000)
- `TTS_MAX_CHARS_PER_REQUEST` (default 800)

## Files

- New migration: `tts_cache`, `tts_usage`, `tts_global_usage`, storage bucket, RLS, GRANTs.
- `src/lib/tts.functions.ts` (new) — server function.
- `src/lib/tts.server.ts` (new) — ElevenLabs client + cache helpers.
- `src/hooks/useSpeech.ts` — rewrite.
- `src/routes/app.debrief.tsx` — pass `debrief.id`, add quota messaging.
- `package.json` — remove `kokoro-js`.

## Cost math at scale

With caching + quotas, **steady-state cost ≈ paid users × ~$0.05/mo** in the worst case (every paid user maxes their 50k chars on uncached content). Free tier is bounded by the user quota × free user count, and the global cap is the seat belt: even worst-case spike costs ≤ **$3/day** at the default 200k cap.

## Note on rate limiting

The platform doesn't have proper rate-limiting primitives yet, so the per-user quota and global cap are implemented as ad-hoc counter rows in Postgres. This is fine for cost control but isn't a defense against a determined attacker — they'd be limited by the global cap, which is the real seat belt.
