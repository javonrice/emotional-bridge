import { createFileRoute } from "@tanstack/react-router";
import { ScreenShell, H1, Sub, PrimaryButton, Eyebrow } from "@/components/loop/Screen";

export const Route = createFileRoute("/onboarding/opener")({
  component: Opener,
});

function Opener() {
  return (
    <ScreenShell>
      <div className="flex flex-1 flex-col justify-center">
        <Eyebrow>Read this slowly</Eyebrow>
        <H1>This isn't another blocker app.</H1>
        <Sub>
          The behavior isn't your problem. It's the symptom. By the time you reach for the phone, the loop has already been running for hours.
        </Sub>
        <Sub>
          We're going to find the moment <span className="text-foreground">before</span> the moment.
        </Sub>
      </div>
      <PrimaryButton to="/onboarding/age">I'm ready</PrimaryButton>
    </ScreenShell>
  );
}
