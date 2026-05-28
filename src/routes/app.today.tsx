import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { ChevronRight, Sparkles, Check, MessageCircle, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getCheckinStats } from "@/lib/checkins.functions";
import { getCurrentLoop } from "@/lib/auth.functions";
import { deriveLoopName, useOnboarding } from "@/lib/onboarding-store";
import { useEntitlements } from "@/hooks/useEntitlements";

export const Route = createFileRoute("/app/today")({
  component: Today,
});

const ORIENT_KEY = "loop.today.orient.dismissed.v1";

function StreakRing({ value }: { value: number }) {
  const r = 92;
  const c = 2 * Math.PI * r;
  const pct = (value % 30) / 30 || 1;
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

function StartStreakGlyph() {
  return (
    <div className="flex h-[220px] w-[220px] flex-col items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        className="text-[88px] leading-none text-primary text-glow"
      >
        ◎
      </motion.div>
      <p className="mt-4 max-w-[180px] text-center text-sm text-muted-foreground">
        Your awareness streak starts today.
      </p>
    </div>
  );
}

function Today() {
  const { answers } = useOnboarding();
  const statsFn = useServerFn(getCheckinStats);
  const loopFn = useServerFn(getCurrentLoop);
  const tzOffset = typeof window !== "undefined" ? new Date().getTimezoneOffset() : 0;
  const { tier, debriefsRemaining } = useEntitlements();

  const { data: stats } = useQuery({
    queryKey: ["checkin-stats", tzOffset],
    queryFn: () => statsFn({ data: { tz_offset_minutes: tzOffset } }),
  });
  const { data: loopRes } = useQuery({
    queryKey: ["current-loop"],
    queryFn: () => loopFn(),
  });

  const streak = stats?.streak ?? 0;
  const total = stats?.total ?? 0;
  const checkedInToday = stats?.checkedInToday ?? false;
  const loop = loopRes?.loop;
  const loopName = loop?.name ?? deriveLoopName(answers);

  const [greeting, setGreeting] = useState("Hello");
  const [orientDismissed, setOrientDismissed] = useState(true);
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
    setOrientDismissed(localStorage.getItem(ORIENT_KEY) === "1");
  }, []);

  const dismissOrient = () => {
    localStorage.setItem(ORIENT_KEY, "1");
    setOrientDismissed(true);
  };

  // Loop card copy branches by check-in count
  const loopBody = (() => {
    if (total === 0)
      return "Your loop is named. Check in today — even 30 seconds builds your map.";
    if (total < 7)
      return `${total} check-in${total === 1 ? "" : "s"} logged. Your pattern is starting to take shape.`;
    if (total < 14)
      return loop?.summary ?? "Your pattern is becoming visible. Keep checking in.";
    return (
      loop?.summary ??
      "Your loop is getting clearer with every check-in. Heads up — not an alarm."
    );
  })();

  const showOrientation = !orientDismissed && total === 0;

  return (
    <div className="safe-top px-6 pb-4">
      <div className="pt-2">
        <div className="text-sm text-muted-foreground">{greeting}.</div>
        <h1 className="mt-1 text-[28px] font-bold tracking-tight">Today</h1>
      </div>

      <div className="mt-6 flex justify-center">
        {streak === 0 ? <StartStreakGlyph /> : <StreakRing value={streak} />}
      </div>

      {checkedInToday ? (
        <div className="mt-6 rounded-2xl border border-success/30 bg-success/10 p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-success">
            <Check size={14} /> Checked in today
          </div>
          <Link
            to="/app/debrief"
            className="tap-scale mt-2 flex items-center justify-between"
          >
            <div>
              <div className="text-base font-semibold text-foreground">Had an urge? Talk it out</div>
              <div className="mt-0.5 text-xs text-muted-foreground">Debrief in 60 seconds</div>
            </div>
            <ChevronRight className="text-success" />
          </Link>
          <Link
            to="/app/checkin"
            className="tap-scale mt-3 inline-flex items-center gap-1 text-xs font-medium text-success/90 underline-offset-2 hover:underline"
          >
            Check in again
          </Link>
        </div>
      ) : (
        <div className="mt-6">
          <motion.div
            animate={total === 0 ? { scale: [1, 1.02, 1] } : undefined}
            transition={total === 0 ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" } : undefined}
          >
            <Link
              to="/app/checkin"
              className="ios-pill tap-scale flex h-16 w-full items-center justify-center gap-2 bg-primary text-base font-semibold text-primary-foreground glow"
            >
              <Sparkles size={18} aria-hidden="true" />
              {total === 0 ? "Start your first check-in" : "Check in now · 20 seconds"}
              <ChevronRight size={18} aria-hidden="true" />
            </Link>
          </motion.div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            3 taps. Builds your map.
          </p>
        </div>
      )}

      <div className="mt-3 rounded-2xl border border-white/8 bg-card p-5">
        <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Your loop</div>
        <div className="mt-1 text-lg font-semibold text-primary">{loopName}</div>
        <p className="mt-2 text-sm text-muted-foreground">{loopBody}</p>
      </div>

      {showOrientation && (
        <div className="relative mt-3 rounded-2xl border border-primary/20 bg-gradient-to-br from-[#13102B] to-[#0A0A0F] p-5">
          <button
            onClick={dismissOrient}
            aria-label="Dismiss"
            className="absolute right-3 top-3 tap-scale rounded-full p-1 text-muted-foreground/70"
          >
            <X size={16} />
          </button>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            How LOOP works
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Check in daily. The map gets sharper every day. Your streak never breaks on a hard
            night — only if you miss a day.
          </p>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Link to="/app/debrief" className="tap-scale rounded-2xl border border-white/8 bg-card p-5">
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            <MessageCircle size={12} /> Debrief
          </div>
          <div className="mt-1 text-base font-semibold">Talk it out</div>
          {tier === "free" && debriefsRemaining !== null && (
            <div className="mt-2 inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {debriefsRemaining > 0
                ? `${debriefsRemaining} free debrief${debriefsRemaining === 1 ? "" : "s"} left`
                : "Free debriefs used"}
            </div>
          )}
        </Link>
        <Link to="/app/insights" className="tap-scale rounded-2xl border border-white/8 bg-card p-5">
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Insights</div>
          <div className="mt-1 text-base font-semibold">See the map</div>
        </Link>
      </div>
    </div>
  );
}
