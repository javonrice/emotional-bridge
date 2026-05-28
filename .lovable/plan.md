## Goal

Add a "Listen" button on the debrief card that reads the AI response aloud using the browser's built-in Web Speech API, with smart voice selection so it sounds as natural as possible (Samantha/Enhanced on iOS, Google Neural on Chrome/Android).

Free. No backend. No API key. No new dependencies.

## Implementation

### 1. New hook: `src/hooks/useSpeech.ts`

A small wrapper around `window.speechSynthesis`:

- `speak(text: string)` — cancels any in-flight utterance, then speaks.
- `stop()` — cancels.
- `isSpeaking: boolean` — driven by `onstart` / `onend` / `onerror`.
- `supported: boolean` — `typeof window !== "undefined" && "speechSynthesis" in window`.

**Smart voice selection** runs once on mount and re-runs on `voiceschanged`:

1. Get `speechSynthesis.getVoices()` filtered to `en-*`.
2. Score each voice and pick the highest:
   - +10 if name matches `/enhanced|premium|neural|natural|siri/i`
   - +5 if name matches `/samantha|karen|daniel|google|aria|jenny/i` (known-good named voices)
   - +3 if `voice.localService` is true (offline = usually higher quality on Apple)
   - +2 if `voice.lang === "en-US"`
3. Fall back to first `en-*` voice, then `voices[0]`.
4. Apply `rate: 1.0`, `pitch: 1.0`. Tunable later.

Cleanup: call `speechSynthesis.cancel()` on unmount.

iOS quirk to handle: Safari needs `speechSynthesis.speak()` to be called from a user-gesture handler — already satisfied (the user taps the button). No special workaround needed.

### 2. Wire into `src/routes/app.debrief.tsx`

On the debrief card (around line 286, between the card div and the Share button), add a Listen button:

- Icon: `Volume2` when idle, `Square` when speaking (lucide-react, already used elsewhere).
- Label: "Listen" / "Stop".
- Disabled / hidden if `!supported`.
- Reads a concatenation of the three fields, with natural pause phrasing:
  ```
  Pattern. <debrief.pattern>. Reframe. <debrief.reframe>. Try next time. <debrief.micro_action>.
  ```
- Style: same pill as the Share button (`bg-white/8` etc.) so it sits as a visual sibling.
- Cleanup: when the user leaves the card stage (new debrief, back to list) or unmounts the route, call `stop()` so the voice doesn't follow them.

### 3. Optional polish (low cost, recommended)

- Track analytics: `void track("debrief.listen", { id: debrief.id });` on play.
- Auto-stop if the user taps "New debrief" or navigates away (handled by the unmount cleanup, but also call `stop()` in the existing onClick handlers for safety).

## Files touched

- `src/hooks/useSpeech.ts` (new)
- `src/routes/app.debrief.tsx` (add button + wiring)

## Out of scope

- ElevenLabs / Kokoro / Google Cloud TTS — not now. If Web Speech sounds bad on the user's device after testing, swap engines behind the same hook signature.
- Entitlement gating — Listen is free for everyone.
- Listening to past debriefs from the history list — only the currently displayed debrief card. (Trivial to extend later if wanted.)
