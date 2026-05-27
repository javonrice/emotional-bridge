import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ScreenShell, H1, Sub, PrimaryButton } from "@/components/loop/Screen";
import { setAnswer, useOnboarding } from "@/lib/onboarding-store";

export const Route = createFileRoute("/onboarding/age")({
  component: Age,
});

const OPTIONS = ["18–24", "25–29", "30–34", "35+"];

function Age() {
  const nav = useNavigate();
  const { answers } = useOnboarding();
  return (
    <ScreenShell progress={{ step: 1, total: 9 }}>
      <H1>How old are you?</H1>
      <Sub>This calibrates how we read your pattern. Nothing leaves your device.</Sub>
      <div className="mt-8 grid grid-cols-2 gap-3">
        {OPTIONS.map((o) => {
          const active = answers.age === o;
          return (
            <button
              key={o}
              onClick={() => setAnswer("age", o)}
              className={`tap-scale h-20 rounded-2xl border text-lg font-semibold transition-colors ${
                active
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-white/8 bg-card text-muted-foreground"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
      <div className="flex-1" />
      <PrimaryButton onClick={() => nav({ to: "/onboarding/duration" })} disabled={!answers.age}>
        Continue
      </PrimaryButton>
    </ScreenShell>
  );
}
