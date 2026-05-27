import { createFileRoute } from "@tanstack/react-router";
import { ScreenShell, H1, PrimaryButton, Eyebrow } from "@/components/loop/Screen";

export const Route = createFileRoute("/onboarding/proof")({
  component: Proof,
});

const QUOTES = [
  {
    body: "I'd tried every blocker app. None of them touched the actual problem. LOOP named the feeling I'd been avoiding for ten years on day three.",
    name: "Marcus",
    age: 28,
  },
  {
    body: "The first time the drift alert pinged me, I just sat there and laughed. It knew. I didn't even know yet, and it knew.",
    name: "James",
    age: 31,
  },
  {
    body: "I still relapse sometimes. But I see it coming now. That changes everything. Awareness really is the mechanism.",
    name: "Aisha",
    age: 24,
  },
];

function Proof() {
  return (
    <ScreenShell>
      <Eyebrow>Others who saw their loop</Eyebrow>
      <H1>You're not the only one.</H1>
      <div className="mt-6 flex-1 space-y-3">
        {QUOTES.map((q) => (
          <div key={q.name} className="rounded-2xl border border-white/8 bg-card p-5">
            <p className="text-[15px] leading-relaxed text-foreground/90">"{q.body}"</p>
            <p className="mt-3 text-xs text-muted-foreground">— {q.name}, {q.age}</p>
          </div>
        ))}
      </div>
      <PrimaryButton to="/onboarding/science">Continue</PrimaryButton>
    </ScreenShell>
  );
}
