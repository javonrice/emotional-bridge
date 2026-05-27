import { createFileRoute } from "@tanstack/react-router";
import { ScreenShell, H1, PrimaryButton, Eyebrow } from "@/components/loop/Screen";
import { Brain, Eye, ShieldOff } from "lucide-react";

export const Route = createFileRoute("/onboarding/science")({
  component: Science,
});

const POINTS = [
  { icon: Eye, title: "Awareness is the mechanism", body: "Behavioral research shows pattern visibility reduces compulsive acts by up to 60% without willpower." },
  { icon: Brain, title: "Pre-relapse is predictable", body: "The 90-minute window before a compulsive act has a measurable emotional signature. We learn yours." },
  { icon: ShieldOff, title: "Streaks make it worse", body: "Streak-loss shame correlates with faster relapse. We track awareness, not perfection." },
];

function Science() {
  return (
    <ScreenShell>
      <Eyebrow>Why this works</Eyebrow>
      <H1>Built on a single insight.</H1>
      <p className="mt-3 text-base text-muted-foreground">Relapse starts before the behavior. We work the moment before the moment.</p>
      <div className="mt-8 space-y-3">
        {POINTS.map((p) => (
          <div key={p.title} className="flex gap-4 rounded-2xl border border-white/8 bg-card p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <p.icon size={20} />
            </div>
            <div>
              <div className="text-[15px] font-semibold text-foreground">{p.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{p.body}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex-1" />
      <PrimaryButton to="/onboarding/commit">I'm in</PrimaryButton>
    </ScreenShell>
  );
}
