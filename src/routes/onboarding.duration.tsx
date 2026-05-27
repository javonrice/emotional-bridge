import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ScreenShell, H1, Sub, PrimaryButton } from "@/components/loop/Screen";
import { setAnswer, useOnboarding } from "@/lib/onboarding-store";

export const Route = createFileRoute("/onboarding/duration")({
  component: Duration,
});

const OPTIONS = [
  { v: "1", label: "About a year" },
  { v: "3", label: "A few years" },
  { v: "5", label: "Half my life feels like it" },
  { v: "10", label: "As long as I can remember" },
];

function Duration() {
  const nav = useNavigate();
  const { answers } = useOnboarding();
  return (
    <ScreenShell progress={{ step: 2, total: 9 }}>
      <H1>How long has this loop been running?</H1>
      <Sub>Be honest. The reveal on the next screen depends on it.</Sub>
      <div className="mt-8 space-y-3">
        {OPTIONS.map((o) => {
          const active = answers.duration === o.v;
          return (
            <button
              key={o.v}
              onClick={() => setAnswer("duration", o.v)}
              className={`tap-scale flex h-16 w-full items-center rounded-2xl border px-5 text-left text-base font-medium transition-colors ${
                active ? "border-primary bg-primary/10 text-foreground" : "border-white/8 bg-card text-muted-foreground"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <div className="flex-1" />
      <PrimaryButton onClick={() => nav({ to: "/onboarding/reveal-hours" })} disabled={!answers.duration}>
        Continue
      </PrimaryButton>
    </ScreenShell>
  );
}
