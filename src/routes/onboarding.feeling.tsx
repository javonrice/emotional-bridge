import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ScreenShell, H1, Sub, PrimaryButton } from "@/components/loop/Screen";
import { setAnswer, useOnboarding } from "@/lib/onboarding-store";

export const Route = createFileRoute("/onboarding/feeling")({
  component: Feeling,
});

const FEELINGS = ["Lonely", "Bored", "Stressed", "Numb", "Restless", "Ashamed", "Empty"];

function Feeling() {
  const nav = useNavigate();
  const { answers } = useOnboarding();
  return (
    <ScreenShell progress={{ step: 6, total: 9 }}>
      <H1>What feeling shows up first?</H1>
      <Sub>The one underneath, before you reach for the phone.</Sub>
      <div className="mt-6 flex flex-wrap gap-2">
        {FEELINGS.map((f) => {
          const a = answers.feeling === f;
          return (
            <button
              key={f}
              onClick={() => setAnswer("feeling", f)}
              className={`tap-scale ios-pill h-12 px-5 text-base font-medium border transition-colors ${
                a ? "border-primary bg-primary/15 text-foreground" : "border-white/8 bg-card text-muted-foreground"
              }`}
            >
              {f}
            </button>
          );
        })}
      </div>
      <div className="flex-1" />
      <PrimaryButton onClick={() => nav({ to: "/onboarding/reveal-mirror" })} disabled={!answers.feeling}>
        Continue
      </PrimaryButton>
    </ScreenShell>
  );
}
