import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export const Route = createFileRoute("/app/insights")({
  component: Insights,
});

type Tab = "gateway" | "loop" | "monthly";

const APPS = [
  { name: "Instagram", pct: 92 },
  { name: "Reddit", pct: 71 },
  { name: "X / Twitter", pct: 58 },
  { name: "TikTok", pct: 44 },
  { name: "YouTube", pct: 31 },
];

function Insights() {
  const [tab, setTab] = useState<Tab>("gateway");

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
            <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-[#0A0A0F] to-[#1A1540] p-6">
              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Your gateway apps</div>
              <div className="mt-2 text-2xl font-bold">Your #1 gateway: <span className="text-primary">Instagram</span></div>
              <div className="mt-6 space-y-4">
                {APPS.map((a, i) => (
                  <div key={a.name}>
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-primary">#{i + 1}</span>
                        <span className="text-[15px] font-medium">{a.name}</span>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">{a.pct}% correlation</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${a.pct}%` }} transition={{ delay: i * 0.08, duration: 0.8 }}
                        className="h-full rounded-full bg-primary"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-[11px] text-muted-foreground/70">Based on 30 days of check-in data</p>
            </div>
          </motion.section>
        )}

        {tab === "loop" && (
          <motion.section key="l" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5">
            <div className="overflow-hidden rounded-3xl border border-white/8 bg-card p-4">
              <LoopMap />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Nodes are emotional states. Edges show what leads where. The brighter the node, the more often you start there.
            </p>
          </motion.section>
        )}

        {tab === "monthly" && (
          <motion.section key="m" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5">
            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 no-scrollbar">
              <MonthlyCard title="The month" hero="23" sub="days of awareness · longest streak ever" />
              <MonthlyCard title="Most loud" hero="Lonely" sub="38% of your check-ins this month" />
              <MonthlyCard title="Your pattern" hero="Late Night Lonely Spiral" sub="trigger → app → loop" small />
              <MonthlyCard title="Top gateway" hero="Instagram" sub="92% correlation with drift" />
              <MonthlyCard title="The shift" hero="↓ 41%" sub="urges, last 15 days vs first 15" />
            </div>
          </motion.section>
        )}
      </AnimatePresence>
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

function LoopMap() {
  // Hand-authored emotional flow graph.
  const nodes = [
    { id: "lonely", x: 60, y: 60, r: 24, label: "Lonely", hot: true },
    { id: "stressed", x: 220, y: 50, r: 20, label: "Stressed" },
    { id: "numb", x: 280, y: 160, r: 22, label: "Numb", hot: true },
    { id: "scroll", x: 140, y: 180, r: 26, label: "Scroll", hot: true },
    { id: "shame", x: 60, y: 280, r: 18, label: "Shame" },
    { id: "reset", x: 240, y: 280, r: 18, label: "Reset" },
  ];
  const edges = [
    ["lonely", "scroll"], ["stressed", "numb"], ["numb", "scroll"],
    ["scroll", "shame"], ["scroll", "reset"], ["lonely", "numb"],
  ] as const;
  const pos = Object.fromEntries(nodes.map((n) => [n.id, n]));

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
      {edges.map(([a, b], i) => {
        const p1 = pos[a]; const p2 = pos[b];
        const mx = (p1.x + p2.x) / 2; const my = (p1.y + p2.y) / 2 - 18;
        return (
          <path
            key={i}
            d={`M${p1.x},${p1.y} Q${mx},${my} ${p2.x},${p2.y}`}
            stroke="rgba(108,99,255,0.45)"
            strokeWidth={1.4}
            fill="none"
          />
        );
      })}
      {nodes.map((n) => (
        <g key={n.id} filter={n.hot ? "url(#glow)" : undefined}>
          <circle cx={n.x} cy={n.y} r={n.r} fill={n.hot ? "url(#nodeHot)" : "#1E1E30"} stroke="rgba(108,99,255,0.6)" strokeWidth={1.2} />
          <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="#F0F0F8">{n.label}</text>
        </g>
      ))}
    </svg>
  );
}
