## Goal

Replace the robotic Web Speech voice on the debrief Listen button with **Kokoro TTS** — a high-quality neural voice that runs entirely in the user's browser. Free forever, no API key, no server.

## How it works

Kokoro is an ~82M-param neural TTS model from Hugging Face. It runs via `kokoro-js` (which uses `transformers.js` under the hood) — WebGPU if available, WASM fallback otherwise. First use downloads the model (~80–300MB) and caches it in the browser; subsequent uses are instant.

## Changes

1. **Install** `kokoro-js` via `bun add`.

2. **Rewrite `src/hooks/useSpeech.ts`** to wrap Kokoro instead of `speechSynthesis`:
   - Lazy-load the model on first `speak()` call (not on mount) so the page stays fast.
   - Cache the model instance in a module-level singleton — only loaded once per session.
   - Expose the same API the debrief screen already uses: `supported`, `isSpeaking`, `speak(text)`, `stop()`.
   - Add a new `isLoading` flag for the first-call download/warm-up so the button can show a spinner.
   - Default voice: `af_heart` (warm female, the most natural-sounding default in Kokoro). 
   - Play via a single `HTMLAudioElement`; `stop()` pauses and clears it.
   - Graceful fallback to Web Speech if Kokoro fails to load (e.g. very old browser, offline first use) so the button never breaks.

3. **Update the Listen button in `src/routes/app.debrief.tsx`**:
   - Show "Loading voice…" with the existing `Loader2` spinner on the first click while the model downloads.
   - Otherwise unchanged — same Listen / Stop toggle, same analytics event, same stop-on-navigate behavior.

## Trade-offs (worth knowing)

- **First use is slow**: 80–300MB download + ~1–3s warm-up. Cached after that. The loading state makes this visible instead of confusing.
- **Modern browsers only**: Chrome/Edge/Safari 17+/Firefox recent. Falls back to Web Speech on older browsers.
- **Low-end Android**: may be sluggish or run out of memory. Fallback covers this.
- **No streaming**: the full audio clip is generated before playback starts (a few seconds for a typical debrief). Acceptable for short paragraphs.

## Files

- `src/hooks/useSpeech.ts` — rewrite (Kokoro + Web Speech fallback).
- `src/routes/app.debrief.tsx` — small button tweak for the loading state.
- `package.json` — add `kokoro-js`.

## Out of scope

- No voice picker UI (one good default; can add later).
- No server-side TTS.
- No changes to any other screen.
