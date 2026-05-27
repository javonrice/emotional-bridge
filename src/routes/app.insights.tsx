import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Apple, Sparkles } from "lucide-react";
import { getCheckinStats } from "@/lib/checkins.functions";
import { IosWaitlistSheet } from "@/components/ios/ComingSoonBadge";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useOnboarding } from "@/lib/onboarding-store";

export const Route = createFileRoute("/app/insights")({
  component: Insights,
});

type Tab = "gateway" | "loop" | "monthly";

function Insights() {
  const [tab, setTab] = useState<Tab>("gateway");
  const [waitlist, setWaitlist] = useState(false);
  const { tier } = useEntitlements();
  const { answers } = useOnboarding();
  const selfReportedApps: string[] = Array.isArray(answers.apps) ? answers.apps : [];
  const statsFn = useServerFn(getCheckinStats);
  const tzOffset = typeof window !== "undefined" ? new Date().getTimezoneOffset() : 0;
  const { data: stats } = useQuery({
    queryKey: ["checkin-stats", tzOffset],
    queryFn: () => statsFn({ data: { tz_offset_minutes: tzOffset } }),
  });

  const total = stats?.total ?? 0;
  const daysCount = stats?.days?.length ?? 0;
  const streak = stats?.streak ?? 0;
  const topEmotion = stats?.emotions?.[0];
  const topEmotionShare =
    total > 0 && topEmotion ? Math.round((topEmotion.count / total) * 100) : 0;

  return (
    <div className="safe-top px-6 pb-4">
      <h1 className="pt-2 text-[28px] font-bold tracking-tight">Insights</h1>
      <div className="mt-4 grid grid-cols-3 gap-1 rounded-full bg-card p-1">
        {(["gateway", "loop", "monthly"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`tap-scale rounded-full py-2 text-xs font-semibold capitalize transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "gateway" && (
          <motion.section key="g" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5">
            <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-[#0A0A0F] to-[#1A1540] p-6">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                <Apple size={13} className="text-primary" /> Auto-detect · iOS
              </div>
              <div className="mt-3 text-[22px] font-bold leading-tight">
                Your real gateway apps light up here — once iOS auto-tracking ships.
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                We'll read your Screen Time on-device and pinpoint exactly which app opens your loop, with no typing. Today, self-report only captures what you remember.
              </p>
              <button
                onClick={() => setWaitlist(true)}
                className="ios-pill tap-scale mt-5 flex h-12 w-full items-center justify-center bg-primary text-sm font-semibold text-primary-foreground"
              >
                Notify me when it ships
              </button>
              <p className="mt-2 text-center text-[11px] text-muted-foreground/70">No spam. One email when it goes live.</p>
            </div>

            {selfReportedApps.length > 0 && (
              <div className="mt-4 rounded-3xl border border-white/8 bg-card p-5">
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Apps you flagged</div>
                <p className="mt-1 text-xs text-muted-foreground/80">From your onboarding — not measured, just remembered.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selfReportedApps.map((a) => (
                    <span key={a} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-foreground/90">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.section>
        )}

        {tab === "loop" && (
          <motion.section key="l" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5">
            <div className="overflow-hidden rounded-3xl border border-white/8 bg-card p-4">
              {stats && stats.total >= 3 ? (
                <>
                  {stats.total < 14 && (
                    <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-primary">
                      Early sketch · gets sharper after 14 check-ins
                    </div>
                  )}
                  {tier === "free" && (
                    <Link
                      to="/paywall"
                      search={{ source: "insights" }}
                      className="mb-3 ml-2 inline-block text-xs font-medium text-primary"
                    >
                      Full map unlocks with membership →
                    </Link>
                  )}
                  <LoopMap emotions={stats.emotions} edges={stats.edges} />
                </>
              ) : (
                <div className="flex h-[320px] flex-col items-center justify-center px-6 text-center">
                  <div className="text-sm font-medium text-foreground/80">Your map is still drawing.</div>
                  <p className="mt-2 max-w-xs text-xs text-muted-foreground">
                    Log a few more check-ins. Once we see 3+ transitions between feelings, the loop appears here.
                  </p>
                </div>
              )}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Nodes are emotional states. Edges show what leads where. The brighter the node, the more often you start there.
            </p>
          </motion.section>
        )}

        {tab === "monthly" && (
          <motion.section key="m" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5">
            {total === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-white/8 bg-card px-6 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Sparkles size={22} />
                </div>
                <div className="mt-4 text-base font-semibold">Your month hasn't started yet</div>
                <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                  Log your first check-in. Your monthly cards build themselves from there.
                </p>
                <Link
                  to="/app/checkin"
                  className="ios-pill tap-scale mt-5 inline-flex h-11 items-center justify-center bg-primary px-6 text-sm font-semibold text-primary-foreground"
                >
                  Start your first check-in
                </Link>
              </div>
            ) : (
              <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 no-scrollbar">
                <MonthlyCard title="The month" hero={String(daysCount)} sub={`days of awareness · ${streak}-day streak`} />
                {topEmotion && (
                  <MonthlyCard
                    title="Most loud"
                    hero={topEmotion.label.charAt(0).toUpperCase() + topEmotion.label.slice(1)}
                    sub={`${topEmotionShare}% of your check-ins`}
                  />
                )}
                <MonthlyCard title="Check-ins" hero={String(total)} sub="moments you stopped to notice" />
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>
      <IosWaitlistSheet open={waitlist} onClose={() => setWaitlist(false)} source="insights_gateway" />
    </div>
  );
}


function MonthlyCard({ title, hero, sub, small }: { title: string; hero: string; sub: string; small?: boolean }) {
  return (
    <div className="relative aspect-[9/12] w-[78vw] max-w-[300px] snap-center shrink-0 overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-[#0A0A0F] to-[#1A1540] p-5">
      <div className="absolute right-3 top-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">LOOP</div>
      <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{title}</div>
      <div className={`mt-3 font-bold leading-tight text-primary text-glow ${small ? "text-2xl" : "text-[44px]"}`}>{hero}</div>
      <div className="absolute bottom-5 left-5 right-5 text-sm text-muted-foreground">{sub}</div>
    </div>
  );
}

function LoopMap({
  emotions,
  edges,
}: {
  emotions: { label: string; count: number }[];
  edges: { from: string; to: string; count: number }[];
}) {
  const top = emotions.slice(0, 7);
  const cx = 170, cy = 170, R = 115;
  const maxCount = Math.max(...top.map((e) => e.count), 1);
  const hotThreshold = maxCount * 0.6;
  const positioned = top.map((e, i) => {
    const angle = (i / top.length) * Math.PI * 2 - Math.PI / 2;
    return {
      id: e.label,
      x: cx + Math.cos(angle) * R,
      y: cy + Math.sin(angle) * R,
      r: 16 + Math.min(14, (e.count / maxCount) * 14),
      label: e.label.charAt(0).toUpperCase() + e.label.slice(1),
      hot: e.count >= hotThreshold,
    };
  });
  const pos = Object.fromEntries(positioned.map((n) => [n.id, n]));
  const maxEdge = Math.max(...edges.map((e) => e.count), 1);
  const visibleEdges = edges.filter((e) => pos[e.from] && pos[e.to]);

  return (
    <svg viewBox="0 0 340 340" className="h-[340px] w-full">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id="nodeHot">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#6C63FF" />
        </radialGradient>
      </defs>
      {visibleEdges.map((edge, i) => {
        const p1 = pos[edge.from]; const p2 = pos[edge.to];
        const mx = (p1.x + p2.x) / 2; const my = (p1.y + p2.y) / 2 - 18;
        const weight = 0.8 + (edge.count / maxEdge) * 2.4;
        const opacity = 0.25 + (edge.count / maxEdge) * 0.55;
        return (
          <path
            key={i}
            d={`M${p1.x},${p1.y} Q${mx},${my} ${p2.x},${p2.y}`}
            stroke={`rgba(108,99,255,${opacity.toFixed(2)})`}
            strokeWidth={weight}
            fill="none"
          />
        );
      })}
      {positioned.map((n) => (
        <g key={n.id} filter={n.hot ? "url(#glow)" : undefined}>
          <circle cx={n.x} cy={n.y} r={n.r} fill={n.hot ? "url(#nodeHot)" : "#1E1E30"} stroke="rgba(108,99,255,0.6)" strokeWidth={1.2} />
          <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="#F0F0F8">{n.label}</text>
        </g>
      ))}
    </svg>
  );
}
