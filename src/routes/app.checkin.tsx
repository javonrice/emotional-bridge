import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronRight } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { saveCheckin, getCheckinStats } from "@/lib/checkins.functions";
import { track } from "@/lib/analytics.functions";
import { MilestoneSheet } from "@/components/loop/MilestoneSheet";


export const Route = createFileRoute("/app/checkin")({
  component: CheckIn,
});

const STEPS = [
  { key: "energy", title: "How's your energy?", options: ["Low", "Medium", "High"] },
  { key: "emotion", title: "What feeling is loudest?", options: ["Lonely", "Stressed", "Numb", "Restless", "Bored", "Calm", "Connected"] },
  { key: "activity", title: "What were you just doing?", options: ["Work", "Scrolling", "Resting", "Out with people", "Training", "Just woke up"] },
] as const;

function milestoneFor(streak: number): { eyebrow: string; headline: string } | null {
  if (streak === 1) return { eyebrow: "First check-in", headline: "Day one. Your map starts now." };
  if (streak === 7) return { eyebrow: "Week one", headline: "Seven days. Your pattern is forming." };
  if (streak === 14)
    return { eyebrow: "Two weeks", headline: "Your loop map is now fully visible." };
  if (streak === 30)
    return { eyebrow: "30 days", headline: "You have a real map now. Your report is ready." };
  return null;
}

function CheckIn() {
  const nav = useNavigate();
  const save = useServerFn(saveCheckin);
  const statsFn = useServerFn(getCheckinStats);
  const qc = useQueryClient();
  const tzOffset = typeof window !== "undefined" ? new Date().getTimezoneOffset() : 0;
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = STEPS[step];

  // Fetch fresh stats once we're in the done state
  const { data: stats } = useQuery({
    queryKey: ["checkin-stats", tzOffset],
    queryFn: () => statsFn({ data: { tz_offset_minutes: tzOffset } }),
    enabled: done,
  });

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
          tz_offset_minutes: tzOffset,
        },
      });
      if (!res.ok) setError(res.error ?? "Could not save check-in.");
      else {
        void track("checkin.save", { emotion: next.emotion, energy: next.energy });
        await qc.invalidateQueries({ queryKey: ["checkin-stats", tzOffset] });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save check-in.");
    }
    setDone(true);
  };


  if (done) {
    const streak = stats?.streak ?? 0;
    const milestone = milestoneFor(streak);
    const isDayOne = streak === 1;
    const isFullScreen = streak === 7 || streak === 14 || streak === 30;
    const topEmotion = stats?.emotions?.[0]?.label;

    if (isFullScreen && stats) {
      return (
        <MilestoneSheet
          kind={streak as 7 | 14 | 30}
          streak={streak}
          total={stats.total ?? 0}
          topEmotion={topEmotion}
          onContinue={() => {
            if (streak === 14) nav({ to: "/app/insights", search: { tab: "loop" } });
            else nav({ to: "/app/today" });
          }}
        />
      );
    }


    return (
      <div className="safe-top flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
        {milestone && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary"
          >
            {milestone.eyebrow}
          </motion.div>
        )}

        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/15 text-primary"
        >
          {streak > 0 ? (
            <span className="text-4xl font-bold tabular-nums text-glow">{streak}</span>
          ) : (
            <Check size={36} />
          )}
        </motion.div>

        <h2 className="mt-6 text-2xl font-bold leading-tight">
          {milestone ? milestone.headline : "Logged."}
        </h2>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          {milestone
            ? "Every check-in builds your map. Your loop is getting clearer."
            : `${streak}-day streak. Every check-in builds your map.`}
        </p>
        {error && <p className="mt-3 max-w-xs text-xs text-destructive">{error}</p>}

        <Link
          to="/app/debrief"
          className="ios-pill tap-scale mt-8 flex h-12 w-full max-w-xs items-center justify-center gap-1 bg-primary px-6 font-semibold text-primary-foreground"
        >
          Anything on your mind? Talk it out <ChevronRight size={16} />
        </Link>

        <button
          onClick={() => nav({ to: "/app/today" })}
          className="tap-scale mt-3 text-sm font-medium text-muted-foreground"
        >
          Not right now
        </button>

        {isDayOne && (
          <button
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.share) {
                navigator
                  .share({
                    title: "LOOP",
                    text: "Day one. My map starts now.",
                  })
                  .catch(() => {});
              }
            }}
            className="tap-scale mt-6 text-[11px] uppercase tracking-wider text-muted-foreground/70"
          >
            Share your start
          </button>
        )}
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
