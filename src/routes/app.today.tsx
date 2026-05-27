import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import { deriveLoopName, useOnboarding, useStreak } from "@/lib/onboarding-store";

export const Route = createFileRoute("/app/today")({
  component: Today,
});

function StreakRing({ value }: { value: number }) {
  const r = 92;
  const c = 2 * Math.PI * r;
  const pct = (value % 30) / 30;
  return (
    <div className="relative h-[220px] w-[220px]">
      <svg viewBox="0 0 220 220" className="h-full w-full -rotate-90">
        <circle cx="110" cy="110" r={r} stroke="rgba(255,255,255,0.06)" strokeWidth="10" fill="none" />
        <motion.circle
          cx="110" cy="110" r={r}
          stroke="url(#g)" strokeWidth="10" fill="none" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - c * pct }}
          transition={{ duration: 1.4, ease: [0.2, 0.8, 0.2, 1] }}
        />
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6C63FF" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[64px] font-bold leading-none tracking-tight text-foreground text-glow">{value}</div>
        <div className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">days of awareness</div>
      </div>
    </div>
  );
}

function Today() {
  const { answers } = useOnboarding();
  const { streak } = useStreak();
  const [greeting, setGreeting] = useState("Hello");
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
  }, []);

  return (
    <div className="safe-top px-6 pb-4">
      <div className="pt-2">
        <div className="text-sm text-muted-foreground">{greeting}.</div>
        <h1 className="mt-1 text-[28px] font-bold tracking-tight">Today</h1>
      </div>

      <div className="mt-6 flex justify-center">
        <StreakRing value={streak} />
      </div>

      <Link
        to="/app/checkin"
        className="tap-scale mt-6 flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 p-5"
      >
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles size={14} /> Daily check-in
          </div>
          <div className="mt-1 text-base font-semibold text-foreground">3 taps. About 20 seconds.</div>
        </div>
        <ChevronRight className="text-primary" />
      </Link>

      <div className="mt-3 rounded-2xl border border-white/8 bg-card p-5">
        <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Your loop</div>
        <div className="mt-1 text-lg font-semibold text-primary">{loopName}</div>
        <p className="mt-2 text-sm text-muted-foreground">
          Tonight looks like a soft drift window based on last week's pattern. Heads up — not an alarm.
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Link to="/app/debrief" className="tap-scale rounded-2xl border border-white/8 bg-card p-5">
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Debrief</div>
          <div className="mt-1 text-base font-semibold">Talk it out</div>
        </Link>
        <Link to="/app/insights" className="tap-scale rounded-2xl border border-white/8 bg-card p-5">
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Insights</div>
          <div className="mt-1 text-base font-semibold">See the map</div>
        </Link>
      </div>
    </div>
  );
}
