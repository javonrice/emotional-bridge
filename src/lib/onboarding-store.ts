// Lightweight localStorage-backed store for onboarding answers + app flags.
// Pure mock layer — no backend.

import { useEffect, useState, useSyncExternalStore } from "react";

export type OnboardingAnswers = {
  age?: string;
  duration?: string; // "1" | "3" | "5" | "10"
  control?: number; // 1-10
  apps?: string[];
  timing?: string;
  feeling?: string;
  story?: string;
  loopName?: string;
};

const KEY = "loop.onboarding.v1";
const DONE_KEY = "loop.onboarded.v1";
const STREAK_KEY = "loop.streak.v1";
const LAST_STEP_KEY = "loop.onboarding.lastStep.v1";

type State = {
  answers: OnboardingAnswers;
  done: boolean;
  lastStep: string | null;
};

const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }

function read(): State {
  if (typeof window === "undefined") return { answers: {}, done: false, lastStep: null };
  try {
    const raw = localStorage.getItem(KEY);
    const answers = raw ? (JSON.parse(raw) as OnboardingAnswers) : {};
    const done = localStorage.getItem(DONE_KEY) === "1";
    const lastStep = localStorage.getItem(LAST_STEP_KEY);
    return { answers, done, lastStep };
  } catch {
    return { answers: {}, done: false, lastStep: null };
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getOnboardingState(): State {
  return read();
}

export function setLastStep(path: string) {
  if (typeof window === "undefined") return;
  if (!path.startsWith("/onboarding/")) return;
  localStorage.setItem(LAST_STEP_KEY, path);
  emit();
}

export function useOnboarding() {
  const state = useSyncExternalStore(
    subscribe,
    () => JSON.stringify(read()),
    () => JSON.stringify({ answers: {}, done: false, lastStep: null }),
  );
  const parsed: State = JSON.parse(state);
  return parsed;
}

export function setAnswer<K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) {
  const cur = read().answers;
  const next = { ...cur, [key]: value };
  localStorage.setItem(KEY, JSON.stringify(next));
  emit();
}

export function completeOnboarding() {
  localStorage.setItem(DONE_KEY, "1");
  emit();
}

export function resetOnboarding() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(DONE_KEY);
  localStorage.removeItem(STREAK_KEY);
  emit();
}

export function useStreak() {
  const [streak, setStreak] = useState(23);
  useEffect(() => {
    const v = localStorage.getItem(STREAK_KEY);
    if (v) setStreak(parseInt(v, 10));
  }, []);
  const bump = () => {
    const next = streak + 1;
    localStorage.setItem(STREAK_KEY, String(next));
    setStreak(next);
  };
  return { streak, bump };
}

// Derive a loop name from answers — feels personalized without an API.
export function deriveLoopName(a: OnboardingAnswers): string {
  const timing = a.timing || "Late Night";
  const feeling = a.feeling || "Lonely";
  const map: Record<string, string> = {
    "Morning": "Morning",
    "Afternoon": "Afternoon",
    "Late night": "Late Night",
    "After conflict": "Aftershock",
  };
  return `The ${map[timing] ?? timing} ${feeling} Spiral`;
}

export function deriveHoursLost(a: OnboardingAnswers): number {
  const years = parseInt(a.duration || "3", 10);
  // ~ 1.2 hrs/day average
  return Math.round(years * 365 * 1.2);
}
