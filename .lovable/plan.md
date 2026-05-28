# Fix: Listen button silent on mobile (past debriefs)

## Root cause

iOS Safari and mobile Chrome block `HTMLAudioElement.play()` when it happens **after an `await`** that breaks the user-gesture chain. The current `useSpeech.speak()` does:

```
click → setIsLoading → await synthesizeDebrief() → new Audio(url) → audio.play()
```

Because `new Audio()` and `.play()` only happen *after* the server roundtrip resolves, the browser no longer considers it a user-initiated playback and silently rejects it (no error thrown, promise just rejects quietly or play() is a no-op). Desktop browsers are lenient, which is why it may appear to work there.

Past vs new debriefs feel different only because of timing variance — the bug affects both, but is reliably silent on mobile.

## Fix

Create the `Audio` element **synchronously inside the click handler**, before any `await`. Then update `audio.src` and call `audio.play()` once the server returns. Safari honors this pattern because the element was instantiated within the gesture.

### Changes

**`src/hooks/useSpeech.ts`** — refactor `speak(debriefId)`:
- Create `const audio = new Audio()` synchronously at the top of `speak`, store it in `audioRef` immediately.
- Call `audio.load()` (no-op but keeps the element "primed" in gesture).
- Then `await synthesizeDebrief(...)`.
- On success: set `audio.src = url`, attach `onended`/`onerror`, then `await audio.play()`.
- On `play()` rejection: surface a new `SpeakError("playback_blocked")` so the UI can hint the user to tap again.
- Keep `urlCache` so the second tap is instant (and synchronous play is then trivially within gesture).

**`src/routes/app.debrief.tsx`** — handle the new `playback_blocked` error type with a short toast like "Tap Listen again to play." (rare fallback; the gesture-safe path should already work).

## Out of scope

- No server changes. The server function, caching, quota, and bucket plumbing are working.
- No fallback to `speechSynthesis` — ElevenLabs is the chosen voice.

## Verification

After the edit, test on the mobile preview:
1. Open a past debrief from history → tap Listen → audio plays.
2. Tap again → cache hit, plays instantly.
3. Generate a new debrief → tap Listen → audio plays.
