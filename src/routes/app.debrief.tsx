import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, Share2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { generateDebrief } from "@/lib/ai.functions";
import { getDebriefHistory } from "@/lib/checkins.functions";
import { AIFeedback } from "@/components/loop/AIFeedback";

export const Route = createFileRoute("/app/debrief")({
  component: Debrief,
});

type Stage = "input" | "thinking" | "card";
type DebriefRow = {
  id: string;
  pattern: string | null;
  reframe: string | null;
  micro_action: string | null;
};

function Debrief() {
  const submit = useServerFn(generateDebrief);
  const [stage, setStage] = useState<Stage>("input");
  const [text, setText] = useState("");
  const [debrief, setDebrief] = useState<DebriefRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);

  const startVoice = () => {
    const SR =
      (typeof window !== "undefined" &&
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
      null;
    if (!SR) {
      setError("Voice input isn't supported on this browser yet.");
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = true;
    setListening(true);
    rec.onresult = (e: any) => {
      let chunk = "";
      for (let i = e.resultIndex; i < e.results.length; i++) chunk += e.results[i][0].transcript;
      setText((prev) => (prev ? prev + " " : "") + chunk);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
  };

  const handleSubmit = async () => {
    setStage("thinking");
    setError(null);
    try {
      const res = await submit({ data: { text } });
      if (res.error || !res.debrief) {
        setError(res.error ?? "Something went wrong.");
        setStage("input");
        return;
      }
      setDebrief(res.debrief as DebriefRow);
      setStage("card");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStage("input");
    }
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
            <button
              onClick={startVoice}
              className={`tap-scale mt-3 flex items-center gap-2 rounded-full bg-card px-4 py-2 text-xs ${listening ? "text-primary" : "text-muted-foreground"}`}
            >
              <Mic size={14} /> {listening ? "Listening…" : "Speak instead"}
            </button>
            {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
            <button
              onClick={handleSubmit}
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

        {stage === "card" && debrief && (
          <motion.div key="c" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-[#0A0A0F] to-[#1A1540] p-6">
              <div className="absolute right-4 top-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">LOOP</div>
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Debrief · today</div>

              <div className="mt-5 text-xs uppercase tracking-[0.16em] text-muted-foreground">Pattern</div>
              <p className="mt-2 text-[15px] leading-relaxed text-foreground/90">{debrief.pattern}</p>

              <div className="mt-5 text-xs uppercase tracking-[0.16em] text-muted-foreground">Reframe</div>
              <p className="mt-2 text-[15px] italic leading-relaxed text-foreground/90">{debrief.reframe}</p>

              <div className="mt-5 text-xs uppercase tracking-[0.16em] text-muted-foreground">Try next time</div>
              <p className="mt-2 text-[15px] leading-relaxed text-primary">{debrief.micro_action}</p>

              <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                <div className="text-[11px] text-muted-foreground">Awareness logged</div>
                <button className="tap-scale flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1.5 text-xs font-medium text-foreground opacity-60">
                  <Share2 size={12} /> Save card · soon
                </button>
              </div>
            </div>

            <AIFeedback surface="debrief_card" sourceId={debrief.id} />

            <button onClick={() => { setStage("input"); setText(""); setDebrief(null); }} className="mt-4 block w-full text-center text-xs text-muted-foreground">
              New debrief
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
