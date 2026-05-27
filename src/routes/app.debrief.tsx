import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, Share2 } from "lucide-react";
import { deriveLoopName, useOnboarding } from "@/lib/onboarding-store";

export const Route = createFileRoute("/app/debrief")({
  component: Debrief,
});

type Stage = "input" | "thinking" | "card";

function Debrief() {
  const { answers } = useOnboarding();
  const [stage, setStage] = useState<Stage>("input");
  const [text, setText] = useState("");
  const loopName = deriveLoopName(answers);

  const submit = () => {
    setStage("thinking");
    setTimeout(() => setStage("card"), 2400);
  };

  return (
    <div className="safe-top px-6 pb-4">
      <h1 className="pt-2 text-[28px] font-bold tracking-tight">Debrief</h1>
      <p className="mt-1 text-sm text-muted-foreground">No judgment. Just data.</p>

      <AnimatePresence mode="wait">
        {stage === "input" && (
          <motion.div key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What just happened? Where were you, what were you feeling before…"
              rows={8}
              className="w-full resize-none rounded-2xl border border-white/8 bg-card p-4 text-[16px] leading-relaxed placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
            />
            <button className="tap-scale mt-3 flex items-center gap-2 rounded-full bg-card px-4 py-2 text-xs text-muted-foreground">
              <Mic size={14} /> Speak instead
            </button>
            <button
              onClick={submit}
              disabled={text.trim().length < 6}
              className="ios-pill tap-scale mt-6 flex h-14 w-full items-center justify-center bg-primary text-base font-semibold text-primary-foreground disabled:opacity-40"
            >
              Read it back to me
            </button>
          </motion.div>
        )}

        {stage === "thinking" && (
          <motion.div key="t" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-20 flex flex-col items-center text-center">
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="h-16 w-16 rounded-full bg-primary/30 glow"
            />
            <p className="mt-6 text-sm text-muted-foreground">Reading the chain underneath…</p>
          </motion.div>
        )}

        {stage === "card" && (
          <motion.div key="c" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-[#0A0A0F] to-[#1A1540] p-6">
              <div className="absolute right-4 top-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">LOOP</div>
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Debrief · today</div>
              <div className="mt-3 text-2xl font-bold leading-tight text-primary text-glow">{loopName}</div>

              <div className="mt-5 text-xs uppercase tracking-[0.16em] text-muted-foreground">What I see</div>
              <p className="mt-2 text-[15px] leading-relaxed text-foreground/90">
                The pull didn't start when you opened the app. It started ~90 minutes earlier when the {answers.feeling?.toLowerCase() ?? "loneliness"} showed up and you didn't name it. The phone was the exit, not the cause.
              </p>

              <div className="mt-5 text-xs uppercase tracking-[0.16em] text-muted-foreground">Reframe</div>
              <p className="mt-2 text-[15px] italic leading-relaxed text-foreground/90">
                "I felt {answers.feeling?.toLowerCase() ?? "lonely"} and I needed something. That's real. The loop just took the call."
              </p>

              <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                <div className="text-[11px] text-muted-foreground">Awareness logged</div>
                <button className="tap-scale flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1.5 text-xs font-medium text-foreground">
                  <Share2 size={12} /> Save card
                </button>
              </div>
            </div>
            <button onClick={() => { setStage("input"); setText(""); }} className="mt-4 block w-full text-center text-xs text-muted-foreground">
              New debrief
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
