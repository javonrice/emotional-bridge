import { useCallback, useEffect, useRef, useState } from "react";

// ---------- Kokoro singleton (loaded once per session) ----------
let kokoroPromise: Promise<any> | null = null;

async function loadKokoro(): Promise<any> {
  if (kokoroPromise) return kokoroPromise;
  kokoroPromise = (async () => {
    const { KokoroTTS } = await import("kokoro-js");
    // Prefer WebGPU, fall back to wasm. q8 is a good size/quality tradeoff (~85MB).
    const hasWebGPU =
      typeof navigator !== "undefined" && (navigator as any).gpu != null;
    const device: "webgpu" | "wasm" = hasWebGPU ? "webgpu" : "wasm";
    try {
      return await KokoroTTS.from_pretrained(
        "onnx-community/Kokoro-82M-v1.0-ONNX",
        { dtype: "q8", device },
      );
    } catch (err) {
      // If webgpu init fails, retry on wasm once.
      if (device === "webgpu") {
        return await KokoroTTS.from_pretrained(
          "onnx-community/Kokoro-82M-v1.0-ONNX",
          { dtype: "q8", device: "wasm" },
        );
      }
      throw err;
    }
  })();
  return kokoroPromise;
}

// ---------- Web Speech fallback ----------
const PREMIUM_PATTERN = /enhanced|premium|neural|natural|siri/i;
const KNOWN_GOOD_PATTERN = /samantha|karen|daniel|google|aria|jenny|ava|evan/i;

function pickBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const english = voices.filter((v) => v.lang?.toLowerCase().startsWith("en"));
  const pool = english.length ? english : voices;
  let best: SpeechSynthesisVoice | null = null;
  let bestScore = -Infinity;
  for (const v of pool) {
    let score = 0;
    if (PREMIUM_PATTERN.test(v.name)) score += 10;
    if (KNOWN_GOOD_PATTERN.test(v.name)) score += 5;
    if (v.localService) score += 3;
    if (v.lang === "en-US") score += 2;
    if (score > bestScore) {
      bestScore = score;
      best = v;
    }
  }
  return best ?? pool[0];
}

function speakWithWebSpeech(text: string, onEnd: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const v = pickBestVoice(synth.getVoices());
  if (v) {
    u.voice = v;
    u.lang = v.lang;
  }
  u.rate = 1.0;
  u.pitch = 1.0;
  u.onend = onEnd;
  u.onerror = onEnd;
  synth.speak(u);
}

// ---------- Hook ----------
export function useSpeech() {
  const supported = typeof window !== "undefined";
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const cancelledRef = useRef(false);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (audioRef.current) audioRef.current.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!supported || !text) return;
      cancelledRef.current = false;
      stop();
      cancelledRef.current = false;

      setIsLoading(true);
      try {
        const tts = await loadKokoro();
        if (cancelledRef.current) return;

        const audioResult = await tts.generate(text, { voice: "af_heart" });
        if (cancelledRef.current) return;

        const blob: Blob = audioResult.toBlob();
        const url = URL.createObjectURL(blob);
        urlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          setIsSpeaking(false);
          if (urlRef.current === url) {
            URL.revokeObjectURL(url);
            urlRef.current = null;
          }
        };
        audio.onerror = () => setIsSpeaking(false);

        setIsLoading(false);
        setIsSpeaking(true);
        await audio.play();
      } catch (err) {
        console.warn("[useSpeech] Kokoro failed, falling back to Web Speech:", err);
        setIsLoading(false);
        if (cancelledRef.current) return;
        setIsSpeaking(true);
        speakWithWebSpeech(text, () => setIsSpeaking(false));
      }
    },
    [supported, stop],
  );

  return { supported, isSpeaking, isLoading, speak, stop };
}
