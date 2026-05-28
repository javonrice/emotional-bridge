import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, Share2, Lock } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toPng } from "html-to-image";
import { generateDebrief } from "@/lib/ai.functions";
import { getDebriefHistory } from "@/lib/checkins.functions";
import { AIFeedback } from "@/components/loop/AIFeedback";
import { CrisisBanner } from "@/components/safety/CrisisBanner";
import { NotTherapyDisclaimer } from "@/components/safety/NotTherapyDisclaimer";
import { detectRisk } from "@/lib/safety";
import { track } from "@/lib/analytics.functions";
import { useEntitlements } from "@/hooks/useEntitlements";

export const Route = createFileRoute("/app/debrief")({
  component: Debrief,
});


type Stage = "input" | "thinking" | "card" | "paywall";
type DebriefRow = {
  id: string;
  pattern: string | null;
  reframe: string | null;
  micro_action: string | null;
};

function Debrief() {
  const submit = useServerFn(generateDebrief);
  const historyFn = useServerFn(getDebriefHistory);
  const qc = useQueryClient();
  const ent = useEntitlements();
  const { data: history } = useQuery({
    queryKey: ["debrief-history"],
    queryFn: () => historyFn(),
  });
  const [stage, setStage] = useState<Stage>("input");
  const [text, setText] = useState("");
  const [debrief, setDebrief] = useState<DebriefRow | null>(null);
  const [viewingPast, setViewingPast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [sharing, setSharing] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const recRef = useRef<any>(null);
  const baselineRef = useRef<string>("");
  const committedRef = useRef<string>("");

  const startVoice = () => {
    if (listening && recRef.current) {
      try { recRef.current.stop(); } catch { /* noop */ }
      return;
    }
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
    baselineRef.current = text ? text.replace(/\s+$/, "") + " " : "";
    committedRef.current = "";
    setListening(true);
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const t = r[0].transcript as string;
        if (r.isFinal) {
          const needsSpace = committedRef.current && !committedRef.current.endsWith(" ");
          committedRef.current += (needsSpace ? " " : "") + t.trim();
        } else {
          interim += t;
        }
      }
      const tail = interim ? (committedRef.current ? " " : "") + interim : "";
      setText(baselineRef.current + committedRef.current + tail);
    };
    rec.onend = () => {
      setListening(false);
      setText(baselineRef.current + committedRef.current);
      recRef.current = null;
    };
    rec.onerror = () => {
      setListening(false);
      recRef.current = null;
    };
    recRef.current = rec;
    rec.start();
  };

  const openSaved = (it: DebriefRow & { created_at?: string }) => {
    setDebrief(it);
    setViewingPast(it.id);
    setStage("card");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const backToList = () => {
    setViewingPast(null);
    setDebrief(null);
    setStage("input");
  };

  const risk = useMemo(() => detectRisk(text), [text]);

  const handleSubmit = async () => {
    setStage("thinking");
    setError(null);
    void track("debrief.submit", { length: text.length, risk });
    try {
      const res = await submit({ data: { text } });
      if ((res as { upgradeRequired?: boolean }).upgradeRequired) {
        void track("paywall.gate_hit", { source: "debrief_limit" });
        setStage("paywall");
        return;
      }
      if (res.error || !res.debrief) {
        setError(res.error ?? "Something went wrong.");
        setStage("input");
        return;
      }
      setDebrief(res.debrief as DebriefRow);
      qc.invalidateQueries({ queryKey: ["debrief-history"] });
      ent.refresh();
      setStage("card");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStage("input");
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#0A0A0F",
      });
      void track("debrief.share", { id: debrief?.id });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "loop-debrief.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({ files: [file], title: "LOOP debrief" });
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = "loop-debrief.png";
        a.click();
      }
    } catch {
      setError("Couldn't generate share card.");
    } finally {
      setSharing(false);
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
            {risk && <CrisisBanner />}
            <button
              onClick={startVoice}
              aria-label={listening ? "Stop voice input" : "Start voice input"}
              className={`tap-scale mt-3 flex items-center gap-2 rounded-full bg-card px-4 py-2 text-xs ${listening ? "text-primary" : "text-muted-foreground"}`}
            >
              <Mic size={14} aria-hidden="true" /> {listening ? "Listening…" : "Speak instead"}
            </button>
            {error && (
              <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3" role="alert">
                <p className="text-xs text-destructive">{error}</p>
                <button
                  onClick={handleSubmit}
                  className="mt-2 text-xs font-semibold text-primary underline-offset-2 hover:underline"
                >
                  Retry
                </button>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={text.trim().length < 6}
              className="ios-pill tap-scale mt-6 flex h-14 w-full items-center justify-center bg-primary text-base font-semibold text-primary-foreground disabled:opacity-40"
            >
              Read it back to me
            </button>

            {ent.tier === "free" && ent.debriefsRemaining !== null && (
              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                {ent.debriefsRemaining > 0
                  ? `${ent.debriefsRemaining} free debrief${ent.debriefsRemaining === 1 ? "" : "s"} remaining`
                  : "You've used your free debriefs"}
                {ent.debriefsRemaining <= 1 && (
                  <>
                    {" · "}
                    <Link to="/paywall" search={{ source: "debrief_limit" }} className="text-primary underline-offset-2 hover:underline">
                      Unlock unlimited
                    </Link>
                  </>
                )}
              </p>
            )}

            {history?.items && history.items.length > 0 && (
              <div className="mt-10">
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Past debriefs</div>
                <ul className="mt-3 space-y-2">
                  {history.items.map((it) => (
                    <li key={it.id} className="rounded-2xl border border-white/8 bg-card p-4">
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        {new Date(it.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </div>
                      {it.pattern && <div className="mt-1 text-sm font-medium text-foreground/90">{it.pattern}</div>}
                      {it.micro_action && <div className="mt-1 text-xs text-primary">{it.micro_action}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
            <div ref={cardRef} className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-[#0A0A0F] to-[#1A1540] p-6">
              <div className="absolute right-4 top-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">LOOP</div>
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Debrief · today</div>

              <div className="mt-5 text-xs uppercase tracking-[0.16em] text-muted-foreground">Pattern</div>
              <p className="mt-2 text-[15px] leading-relaxed text-foreground/90">{debrief.pattern}</p>

              <div className="mt-5 text-xs uppercase tracking-[0.16em] text-muted-foreground">Reframe</div>
              <p className="mt-2 text-[15px] italic leading-relaxed text-foreground/90">{debrief.reframe}</p>

              <div className="mt-5 text-xs uppercase tracking-[0.16em] text-muted-foreground">Try next time</div>
              <p className="mt-2 text-[15px] leading-relaxed text-primary">{debrief.micro_action}</p>

              <div className="mt-6 border-t border-white/5 pt-4 text-[11px] text-muted-foreground">
                Awareness logged · seeyourloop.com
              </div>
            </div>

            <button
              onClick={handleShare}
              disabled={sharing}
              className="tap-scale mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-white/8 px-4 py-2.5 text-xs font-medium text-foreground disabled:opacity-50"
            >
              <Share2 size={14} /> {sharing ? "Preparing…" : "Share this insight"}
            </button>

            {ent.tier === "free" && ent.debriefsRemaining !== null && (
              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                {ent.debriefsRemaining > 0
                  ? `${ent.debriefsRemaining} free debrief${ent.debriefsRemaining === 1 ? "" : "s"} remaining`
                  : "That was your last free debrief"}
                {ent.debriefsRemaining <= 1 && (
                  <>
                    {" · "}
                    <Link to="/paywall" search={{ source: "debrief_limit" }} className="text-primary underline-offset-2 hover:underline">
                      Unlock unlimited
                    </Link>
                  </>
                )}
              </p>
            )}

            <NotTherapyDisclaimer />
            <AIFeedback surface="debrief_card" sourceId={debrief.id} />


            <button onClick={() => { setStage("input"); setText(""); setDebrief(null); }} className="mt-4 block w-full text-center text-xs text-muted-foreground">
              New debrief
            </button>
          </motion.div>
        )}

        {stage === "paywall" && (
          <motion.div key="p" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-[#0A0A0F] to-[#1A1540] p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Lock size={20} />
              </div>
              <h2 className="mt-4 text-xl font-bold text-foreground">You've used your 3 free debriefs</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                Unlock unlimited debriefs, your full Loop Map, and monthly pattern reports.
              </p>
              <Link
                to="/paywall"
                search={{ source: "debrief_limit" }}
                className="ios-pill tap-scale mt-5 flex h-13 w-full items-center justify-center bg-primary py-3 text-base font-semibold text-primary-foreground glow"
              >
                Unlock LOOP · $14.99/mo
              </Link>
              <button
                onClick={() => setStage("input")}
                className="mt-3 block w-full text-center text-xs text-muted-foreground"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
