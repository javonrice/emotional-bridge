import { useState } from "react";
import { ThumbsUp, ThumbsDown, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useServerFn } from "@tanstack/react-start";
import { recordAIFeedback } from "@/lib/ai.functions";

type Surface = "loop_card" | "debrief_card" | "monthly_report";
type Reason = "generic" | "inaccurate" | "tone_off" | "too_long" | "other";

const REASONS: { value: Reason; label: string }[] = [
  { value: "generic", label: "Too generic" },
  { value: "inaccurate", label: "Doesn't fit me" },
  { value: "tone_off", label: "Tone is off" },
  { value: "too_long", label: "Too long" },
  { value: "other", label: "Other" },
];

export function AIFeedback({ surface, sourceId }: { surface: Surface; sourceId: string | null | undefined }) {
  const submit = useServerFn(recordAIFeedback);
  const [rated, setRated] = useState<"up" | "down" | null>(null);
  const [sheet, setSheet] = useState(false);
  const [reason, setReason] = useState<Reason | null>(null);
  const [comment, setComment] = useState("");

  if (!sourceId) return null;

  const handleUp = async () => {
    setRated("up");
    try { await submit({ data: { surface, source_id: sourceId, rating: "up" } }); } catch {}
  };
  const handleDown = () => { setRated("down"); setSheet(true); };
  const handleSend = async () => {
    setSheet(false);
    try {
      await submit({ data: { surface, source_id: sourceId, rating: "down", reason, comment: comment.slice(0, 500) || null } });
    } catch {}
  };

  return (
    <>
      <div className="mt-4 flex items-center gap-2 text-muted-foreground/70">
        <span className="text-[11px] uppercase tracking-wider">Did this land?</span>
        <button
          onClick={handleUp}
          disabled={rated !== null}
          aria-label="Thumbs up"
          className={`tap-scale flex h-7 w-7 items-center justify-center rounded-full border ${rated === "up" ? "border-success bg-success/15 text-success" : "border-white/10 hover:text-foreground"}`}
        >
          <ThumbsUp size={13} />
        </button>
        <button
          onClick={handleDown}
          disabled={rated !== null}
          aria-label="Thumbs down"
          className={`tap-scale flex h-7 w-7 items-center justify-center rounded-full border ${rated === "down" ? "border-destructive bg-destructive/15 text-destructive" : "border-white/10 hover:text-foreground"}`}
        >
          <ThumbsDown size={13} />
        </button>
        {rated === "up" && <span className="text-[11px] text-success">Thanks.</span>}
      </div>

      <AnimatePresence>
        {sheet && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheet(false)} className="fixed inset-0 z-40 bg-black/60" />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[430px] rounded-t-3xl bg-surface p-6 safe-bottom"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-foreground">What was off?</div>
                <button onClick={() => setSheet(false)} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-muted-foreground"><X size={16} /></button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {REASONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className={`tap-scale rounded-full border px-3 py-1.5 text-xs font-medium ${reason === r.value ? "border-primary bg-primary/15 text-primary" : "border-white/10 text-muted-foreground"}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                placeholder="Optional: what would have landed?"
                className="mt-4 h-20 w-full resize-none rounded-2xl border border-white/10 bg-background/60 p-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
              />
              <button
                onClick={handleSend}
                className="ios-pill tap-scale mt-4 flex h-12 w-full items-center justify-center bg-primary text-sm font-semibold text-primary-foreground"
              >
                Send feedback
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
