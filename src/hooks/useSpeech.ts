import { useCallback, useEffect, useRef, useState } from "react";

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

export function useSpeech() {
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    const refresh = () => {
      voiceRef.current = pickBestVoice(synth.getVoices());
    };
    refresh();
    synth.addEventListener("voiceschanged", refresh);
    return () => {
      synth.removeEventListener("voiceschanged", refresh);
      synth.cancel();
      setIsSpeaking(false);
    };
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [supported]);

  const speak = useCallback(
    (text: string) => {
      if (!supported || !text) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (voiceRef.current) {
        u.voice = voiceRef.current;
        u.lang = voiceRef.current.lang;
      }
      u.rate = 1.0;
      u.pitch = 1.0;
      u.onstart = () => setIsSpeaking(true);
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => setIsSpeaking(false);
      utteranceRef.current = u;
      synth.speak(u);
    },
    [supported],
  );

  return { supported, isSpeaking, speak, stop };
}
