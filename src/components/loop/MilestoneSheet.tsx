import { motion } from "motion/react";
import { Share2, ChevronRight } from "lucide-react";

type MilestoneKind = 7 | 14 | 30;

type Props = {
  kind: MilestoneKind;
  streak: number;
  total: number;
  topEmotion?: string;
  onContinue: () => void;
};

function copyFor(kind: MilestoneKind, total: number, topEmotion?: string) {
  if (kind === 7) {
    return {
      eyebrow: "Week one",
      headline: "Seven days. Your pattern is forming.",
      body: `${total} check-ins logged${topEmotion ? ` · most loud: ${topEmotion}` : ""}. You've built a small but real map.`,
      shareText: "Day 7 with LOOP. My pattern is forming.",
    };
  }
  if (kind === 14) {
    return {
      eyebrow: "Two weeks",
      headline: "Your loop map is fully visible.",
      body: `${total} check-ins. Enough data to see what leads where. Time to look at the map.`,
      shareText: "Two weeks with LOOP. The map is real.",
    };
  }
  return {
    eyebrow: "30 days",
    headline: "You have a real map now.",
    body: `${total} check-ins across 30 days${topEmotion ? ` · ${topEmotion} ran loudest` : ""}. Your monthly report is ready.`,
    shareText: "30 days with LOOP. Real awareness, real map.",
  };
}

export function MilestoneSheet({ kind, streak, total, topEmotion, onContinue }: Props) {
  const c = copyFor(kind, total, topEmotion);

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "LOOP", text: c.shareText });
      } catch {
        /* user cancelled */
      }
    }
  };

  const r = 100;
  const circ = 2 * Math.PI * r;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background px-6 text-center"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary"
      >
        {c.eyebrow}
      </motion.div>

      <div className="relative mt-6 h-[240px] w-[240px]">
        <svg viewBox="0 0 240 240" className="h-full w-full -rotate-90">
          <circle cx="120" cy="120" r={r} stroke="rgba(255,255,255,0.06)" strokeWidth="10" fill="none" />
          <motion.circle
            cx="120"
            cy="120"
            r={r}
            stroke="url(#mg)"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 1.8, ease: [0.2, 0.8, 0.2, 1], delay: 0.1 }}
          />
          <defs>
            <linearGradient id="mg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6C63FF" />
              <stop offset="100%" stopColor="#A78BFA" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[72px] font-bold leading-none tracking-tight text-foreground text-glow tabular-nums">
            {streak}
          </div>
          <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">days</div>
        </div>
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 max-w-sm text-2xl font-bold leading-tight"
      >
        {c.headline}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-3 max-w-sm text-sm text-muted-foreground"
      >
        {c.body}
      </motion.p>

      <div className="mt-10 w-full max-w-xs space-y-3">
        <button
          onClick={onContinue}
          className="ios-pill tap-scale flex h-13 w-full items-center justify-center gap-1 bg-primary px-6 py-3 text-base font-semibold text-primary-foreground"
        >
          Continue <ChevronRight size={16} />
        </button>
        <button
          onClick={handleShare}
          className="tap-scale flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white/8 text-xs font-medium text-foreground"
        >
          <Share2 size={14} /> Share milestone
        </button>
      </div>
    </motion.div>
  );
}
