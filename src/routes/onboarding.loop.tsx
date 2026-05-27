import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ScreenShell, H1, PrimaryButton, Eyebrow } from "@/components/loop/Screen";
import { deriveLoopName, useOnboarding } from "@/lib/onboarding-store";

export const Route = createFileRoute("/onboarding/loop")({
  component: LoopReveal,
});

function LoopReveal() {
  const { answers } = useOnboarding();
  const loopName = deriveLoopName(answers);
  const chain = [
    answers.feeling ?? "Lonely",
    `${answers.timing ?? "Late night"} alone`,
    answers.apps?.[0] ?? "Instagram",
    "Scroll spiral",
    "The pull",
  ];

  return (
    <ScreenShell>
      <div className="flex flex-1 flex-col">
        <Eyebrow>Your loop, named</Eyebrow>
        <H1>This is yours.</H1>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="mt-6 rounded-3xl border border-primary/30 bg-card p-6 shadow-[0_20px_80px_-20px_rgba(108,99,255,0.5)]"
        >
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Loop name</div>
          <div className="mt-2 text-[28px] font-bold leading-tight tracking-tight text-primary text-glow">
            {loopName}
          </div>

          <div className="mt-6 text-xs uppercase tracking-[0.18em] text-muted-foreground">Trigger chain</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {chain.map((c, i) => (
              <motion.span
                key={c}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.12 }}
                className="rounded-full border border-white/10 bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground"
              >
                {c}
              </motion.span>
            ))}
          </div>

          <div className="mt-6 text-xs uppercase tracking-[0.18em] text-muted-foreground">Pattern summary</div>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground/90">
            Your loop tends to fire when {answers.feeling?.toLowerCase() ?? "loneliness"} hits during {answers.timing?.toLowerCase() ?? "late night"} hours. The gateway is usually {answers.apps?.[0] ?? "Instagram"} — but the real trigger is the feeling 90 minutes earlier. That's where the work lives.
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          className="mt-6 text-sm text-muted-foreground"
        >
          This is a sketch. After 14 days of check-ins, your real loop map appears — and it gets uncannily accurate.
        </motion.p>
      </div>
      <PrimaryButton to="/onboarding/proof">Keep going</PrimaryButton>
    </ScreenShell>
  );
}
