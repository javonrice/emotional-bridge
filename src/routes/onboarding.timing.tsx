import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ScreenShell, H1, Sub, PrimaryButton } from "@/components/loop/Screen";
import { setAnswer, useOnboarding } from "@/lib/onboarding-store";

export const Route = createFileRoute("/onboarding/timing")({
  component: Timing,
});

const OPTS = ["Morning", "Afternoon", "Late night", "After conflict"];

function Timing() {
  const nav = useNavigate();
  const { answers } = useOnboarding();
  return (
    <ScreenShell progress={{ step: 5, total: 9 }}>
      <H1>When does it usually happen?</H1>
      <Sub>Pattern recognition starts with time. Pick the one that feels most true.</Sub>
      <div className="mt-8 space-y-3">
        {OPTS.map((o) => {
          const a = answers.timing === o;
          return (
            <button
              key={o}
              onClick={() => setAnswer("timing", o)}
              className={`tap-scale flex h-16 w-full items-center rounded-2xl border px-5 text-base font-medium transition-colors ${
                a ? "border-primary bg-primary/10 text-foreground" : "border-white/8 bg-card text-muted-foreground"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
      <div className="flex-1" />
      <PrimaryButton onClick={() => nav({ to: "/onboarding/feeling" })} disabled={!answers.timing}>
        Continue
      </PrimaryButton>
    </ScreenShell>
  );
}
