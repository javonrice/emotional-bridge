import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ScreenShell, H1, Sub, PrimaryButton } from "@/components/loop/Screen";
import { setAnswer, useOnboarding } from "@/lib/onboarding-store";
import { Check } from "lucide-react";

export const Route = createFileRoute("/onboarding/apps")({
  component: Apps,
});

const APPS = ["Instagram", "TikTok", "Reddit", "X / Twitter", "YouTube", "Dating apps", "Discord", "Other"];

function Apps() {
  const nav = useNavigate();
  const { answers } = useOnboarding();
  const selected = answers.apps ?? [];
  const toggle = (a: string) => {
    const next = selected.includes(a) ? selected.filter((x) => x !== a) : [...selected, a];
    setAnswer("apps", next);
  };

  return (
    <ScreenShell progress={{ step: 4, total: 9 }}>
      <H1>Which apps pull you in?</H1>
      <Sub>The gateway is rarely the destination. Pick everything that's even a maybe.</Sub>
      <div className="mt-6 space-y-2">
        {APPS.map((a) => {
          const on = selected.includes(a);
          return (
            <button
              key={a}
              onClick={() => toggle(a)}
              className={`tap-scale flex h-14 w-full items-center justify-between rounded-2xl border px-5 text-base font-medium transition-colors ${
                on ? "border-primary bg-primary/10 text-foreground" : "border-white/8 bg-card text-muted-foreground"
              }`}
            >
              <span>{a}</span>
              {on && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                  <Check size={14} className="text-primary-foreground" />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex-1 min-h-6" />
      <PrimaryButton onClick={() => nav({ to: "/onboarding/timing" })} disabled={selected.length === 0}>
        Continue
      </PrimaryButton>
    </ScreenShell>
  );
}
