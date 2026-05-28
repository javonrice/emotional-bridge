## Remove TTS / Listen feature

Strip the text-to-speech feature end-to-end to keep the app lean.

### Frontend
- `src/routes/app.debrief.tsx`: remove the `useSpeech` import, `speech` hook call, the entire Listen `<button>` block (lines ~290–326), and unused icons (`Volume2`, `Square`, `Loader2` if not used elsewhere). The Share button stays.
- Delete `src/hooks/useSpeech.ts`.

### Server
- Delete `src/lib/tts.functions.ts` and `src/lib/tts.server.ts`.
- Remove the `elevenlabs` package from `package.json` if present (check first).

### Database migration (new)
Add a migration that drops:
- `public.tts_cache`, `public.tts_usage`, `public.tts_global_usage` tables
- the `tts-cache` storage bucket (and any objects in it)

### Secrets
- Note to user: `ELEVENLABS_API_KEY` can be removed from project secrets manually (won't delete it automatically in case other features use it).

### Out of scope
No other UI/behavior changes. Tracking event `debrief.listen` will simply stop firing.