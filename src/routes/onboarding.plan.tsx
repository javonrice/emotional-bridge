import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { ScreenShell, H1, PrimaryButton, Eyebrow } from "@/components/loop/Screen";
import { Check } from "lucide-react";

export const Route = createFileRoute("/onboarding/plan")({
  component: Plan,
});

const STEPS = [
  "Mapping your trigger chain",
  "Calibrating your drift windows",
  "Personalizing your loop",
  "Building your awareness streak",
  "Preparing your first insight",
];

function Plan() {
  const nav = useNavigate();
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (done >= STEPS.length) {
      const t = setTimeout(() => nav({ to: "/paywall", search: { source: "onboarding" } }), 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setDone((d) => d + 1), 650);
    return () => clearTimeout(t);
  }, [done, nav]);

  return (
    <ScreenShell>
      <Eyebrow>Building your plan</Eyebrow>
      <H1>Hold tight. This is yours alone.</H1>
      <div className="mt-10 flex-1 space-y-3">
        {STEPS.map((s, i) => {
          const isDone = i < done;
          const isActive = i === done;
          return (
            <motion.div
              key={s}
              initial={{ opacity: 0.3 }}
              animate={{ opacity: isDone || isActive ? 1 : 0.35 }}
              className="flex items-center gap-3 rounded-2xl border border-white/8 bg-card px-4 py-4"
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full ${
                  isDone ? "bg-success text-background" : "bg-white/10 text-muted-foreground"
                }`}
              >
                {isDone ? <Check size={14} /> : (
                  <span className={`h-2 w-2 rounded-full ${isActive ? "bg-primary animate-pulse" : "bg-white/30"}`} />
                )}
              </span>
              <span className="text-[15px] font-medium text-foreground">{s}</span>
            </motion.div>
          );
        })}
      </div>
      <PrimaryButton onClick={() => nav({ to: "/paywall" })}>
        {done >= STEPS.length ? "Your plan is ready" : "Preparing…"}
      </PrimaryButton>
    </ScreenShell>
  );
}
