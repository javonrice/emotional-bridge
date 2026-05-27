import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { saveCheckin } from "@/lib/checkins.functions";

export const Route = createFileRoute("/app/checkin")({
  component: CheckIn,
});

const STEPS = [
  { key: "energy", title: "How's your energy?", options: ["Low", "Medium", "High"] },
  { key: "emotion", title: "What feeling is loudest?", options: ["Lonely", "Stressed", "Numb", "Restless", "Bored", "Calm", "Connected"] },
  { key: "activity", title: "What were you just doing?", options: ["Work", "Scrolling", "Resting", "Out with people", "Training", "Just woke up"] },
] as const;

function CheckIn() {
  const nav = useNavigate();
  const save = useServerFn(saveCheckin);
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = STEPS[step];

  const pick = async (v: string) => {
    const next = { ...picks, [current.key]: v };
    setPicks(next);
    if (step < STEPS.length - 1) {
      setTimeout(() => setStep(step + 1), 220);
      return;
    }
    // last step → persist
    try {
      const res = await save({
        data: {
          energy: next.energy,
          emotion: next.emotion,
          activity: next.activity,
          tz_offset_minutes: new Date().getTimezoneOffset(),
        },
      });
      if (!res.ok) setError(res.error ?? "Could not save check-in.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save check-in.");
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className="safe-top flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex h-20 w-20 items-center justify-center rounded-full bg-success/20 text-success">
          <Check size={36} />
        </motion.div>
        <h2 className="mt-6 text-2xl font-bold">Logged.</h2>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">Every check-in builds your map. Your loop is getting clearer.</p>
        {error && <p className="mt-3 max-w-xs text-xs text-destructive">{error}</p>}
        <button onClick={() => nav({ to: "/app/today" })} className="ios-pill tap-scale mt-8 h-12 w-full max-w-xs bg-primary px-6 font-semibold text-primary-foreground">
          Back to today
        </button>
      </div>
    );
  }

  return (
    <div className="safe-top px-6 pb-4">
      <div className="flex items-center justify-between pt-2">
        <button onClick={() => (step > 0 ? setStep(step - 1) : nav({ to: "/app/today" }))} className="tap-scale text-sm text-muted-foreground">
          Cancel
        </button>
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <span key={i} className={`h-1.5 w-6 rounded-full ${i <= step ? "bg-primary" : "bg-white/10"}`} />
          ))}
        </div>
        <span className="w-12" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.key}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.28 }}
          className="mt-10"
        >
          <h1 className="text-[28px] font-bold leading-tight tracking-tight">{current.title}</h1>
          <div className="mt-8 space-y-3">
            {current.options.map((o) => {
              const active = picks[current.key] === o;
              return (
                <button
                  key={o}
                  onClick={() => pick(o)}
                  className={`tap-scale flex h-16 w-full items-center justify-between rounded-2xl border px-5 text-base font-medium transition-colors ${
                    active ? "border-primary bg-primary/15 text-foreground" : "border-white/8 bg-card text-foreground"
                  }`}
                >
                  {o}
                  {active && <Check size={18} className="text-primary" />}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
