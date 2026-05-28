import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { synthesizeDebrief } from "@/lib/tts.functions";

const urlCache = new Map<string, string>(); // debriefId -> signed URL (session)

export type SpeakError =
  | "not_found"
  | "empty"
  | "too_long"
  | "tts_unavailable"
  | "quota_exceeded"
  | "playback_blocked"
  | "failed";

export function useSpeech() {
  const supported = typeof window !== "undefined";
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cancelledRef = useRef(false);
  const synth = useServerFn(synthesizeDebrief);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setIsSpeaking(false);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  const speak = useCallback(
    async (
      debriefId: string,
    ): Promise<{ ok: true } | { ok: false; error: SpeakError }> => {
      if (!supported || !debriefId) return { ok: false, error: "failed" };

      // CRITICAL (iOS Safari / mobile Chrome): the Audio element must be
      // instantiated synchronously inside the user gesture, BEFORE any
      // await. Otherwise audio.play() is silently blocked once the awaited
      // server roundtrip resolves and the gesture chain is broken.
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {
          /* noop */
        }
        audioRef.current = null;
      }
      const audio = new Audio();
      audio.preload = "auto";
      audioRef.current = audio;
      audio.onended = () => setIsSpeaking(false);

      cancelledRef.current = false;
      setIsLoading(true);

      try {
        let url = urlCache.get(debriefId);
        if (!url) {
          const res = await synth({ data: { debriefId } });
          if (cancelledRef.current) return { ok: true };
          if ("error" in res && res.error) {
            setIsLoading(false);
            return { ok: false, error: res.error as SpeakError };
          }
          if (!("audioUrl" in res) || !res.audioUrl) {
            setIsLoading(false);
            return { ok: false, error: "failed" };
          }
          url = res.audioUrl;
          urlCache.set(debriefId, url);
        }

        if (cancelledRef.current || audioRef.current !== audio) {
          return { ok: true };
        }

        audio.onerror = () => {
          setIsSpeaking(false);
          urlCache.delete(debriefId); // signed URL may have expired
        };
        audio.src = url;

        setIsLoading(false);
        setIsSpeaking(true);
        try {
          await audio.play();
        } catch (playErr) {
          console.warn("[useSpeech] play() blocked:", playErr);
          setIsSpeaking(false);
          return { ok: false, error: "playback_blocked" };
        }
        return { ok: true };
      } catch (err) {
        console.warn("[useSpeech] failed:", err);
        setIsLoading(false);
        setIsSpeaking(false);
        return { ok: false, error: "failed" };
      }
    },
    [supported, synth],
  );

  return { supported, isSpeaking, isLoading, speak, stop };
}
