import { createFileRoute } from "@tanstack/react-router";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { useEffect, useState } from "react";
import { ScreenShell, H1, Sub, PrimaryButton, Eyebrow } from "@/components/loop/Screen";
import { deriveHoursLost, useOnboarding } from "@/lib/onboarding-store";

export const Route = createFileRoute("/onboarding/reveal-hours")({
  component: RevealHours,
});

function RevealHours() {
  const { answers } = useOnboarding();
  const target = deriveHoursLost(answers);
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString());
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    const ctrl = animate(count, target, { duration: 2.4, ease: [0.2, 0.8, 0.2, 1] });
    const unsub = rounded.on("change", (v) => setDisplay(v));
    return () => { ctrl.stop(); unsub(); };
  }, [target, count, rounded]);

  const days = Math.round(target / 24);

  return (
    <ScreenShell>
      <div className="flex flex-1 flex-col justify-center text-center">
        <Eyebrow>Based on what you just told me</Eyebrow>
        <H1>You've spent roughly</H1>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="my-8 text-[88px] font-bold leading-none tracking-tight text-primary text-glow"
        >
          {display}
        </motion.div>
        <p className="text-2xl font-semibold text-foreground">hours inside the loop.</p>
        <p className="mt-4 text-sm text-muted-foreground">
          That's about <span className="text-foreground">{days.toLocaleString()} full days</span> of your life.
          Not to shame you — to show you what the cost actually looks like.
        </p>
      </div>
      <PrimaryButton to="/onboarding/control">Show me why</PrimaryButton>
    </ScreenShell>
  );
}
