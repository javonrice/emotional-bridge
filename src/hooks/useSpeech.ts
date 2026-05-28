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
      cancelledRef.current = false;
      stop();
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

        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => {
          setIsSpeaking(false);
          urlCache.delete(debriefId); // signed URL may have expired
        };

        setIsLoading(false);
        setIsSpeaking(true);
        await audio.play();
        return { ok: true };
      } catch (err) {
        console.warn("[useSpeech] failed:", err);
        setIsLoading(false);
        setIsSpeaking(false);
        return { ok: false, error: "failed" };
      }
    },
    [supported, stop, synth],
  );

  return { supported, isSpeaking, isLoading, speak, stop };
}
