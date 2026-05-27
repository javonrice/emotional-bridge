import { createFileRoute } from "@tanstack/react-router";
import { ScreenShell, H1, PrimaryButton, GhostButton, Eyebrow } from "@/components/loop/Screen";

export const Route = createFileRoute("/onboarding/commit")({
  component: Commit,
});

function Commit() {
  return (
    <ScreenShell>
      <div className="flex flex-1 flex-col justify-center">
        <Eyebrow>One question</Eyebrow>
        <H1>
          Are you ready to <span className="text-primary">see your loop clearly?</span>
        </H1>
        <p className="mt-4 text-base text-muted-foreground">
          Most people never get this far. The next 30 seconds decide the next 30 days.
        </p>
      </div>
      <div className="space-y-3">
        <PrimaryButton to="/login" search={{ redirect: "/onboarding/plan" }}>Yes — show me everything</PrimaryButton>
        <GhostButton to="/login" search={{ redirect: "/onboarding/plan" }}>I want to keep going</GhostButton>
      </div>
    </ScreenShell>
  );
}
