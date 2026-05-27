import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ScreenShell, H1, PrimaryButton, Eyebrow } from "@/components/loop/Screen";
import { useOnboarding } from "@/lib/onboarding-store";

export const Route = createFileRoute("/onboarding/reveal-mirror")({
  component: RevealMirror,
});

function RevealMirror() {
  const { answers } = useOnboarding();
  const feeling = answers.feeling ?? "Lonely";
  const app = answers.apps?.[0] ?? "Instagram";
  const timing = answers.timing ?? "Late night";
  const chain = [feeling, timing, app, "the loop"];

  return (
    <ScreenShell>
      <div className="flex flex-1 flex-col justify-center">
        <Eyebrow>9,420 people answered like you</Eyebrow>
        <H1>
          They all described the <span className="text-primary">same</span> sequence.
        </H1>
        <div className="mt-10 space-y-3">
          {chain.map((c, i) => (
            <motion.div
              key={c}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.35, duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                {i + 1}
              </span>
              <span className="rounded-full border border-white/10 bg-card px-4 py-2 text-base font-medium text-foreground">
                {c}
              </span>
            </motion.div>
          ))}
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 + chain.length * 0.35 + 0.2, duration: 0.6 }}
          className="mt-10 text-base text-muted-foreground"
        >
          You're not broken. You're running a pattern. And patterns can be seen.
        </motion.p>
      </div>
      <PrimaryButton to="/onboarding/story">Show me mine</PrimaryButton>
    </ScreenShell>
  );
}
