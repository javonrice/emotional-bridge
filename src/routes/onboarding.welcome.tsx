import { createFileRoute, Link } from "@tanstack/react-router";
import loopIcon from "@/assets/loop-icon.png";

export const Route = createFileRoute("/onboarding/welcome")({
  component: Welcome,
});

function Welcome() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-between gradient-hero px-6 safe-top safe-bottom">
      <div />
      <div className="flex flex-col items-center text-center">
        <div className="animate-loop-pulse">
          <img src={loopIcon} alt="LOOP" width={128} height={128} className="h-32 w-32" />
        </div>
        <h1 className="mt-10 text-5xl font-bold tracking-tight text-foreground">LOOP</h1>
        <p className="mt-3 text-lg text-muted-foreground">See what's running you.</p>
      </div>
      <div className="w-full max-w-sm space-y-3">
        <Link
          to="/onboarding/tracking-mode"
          className="ios-pill tap-scale flex h-14 w-full items-center justify-center bg-primary text-base font-semibold text-primary-foreground glow"
        >
          Begin
        </Link>
        <p className="px-6 text-center text-xs text-muted-foreground/70">
          No streaks. No shame. Just your pattern.
        </p>
        <Link to="/login" className="tap-scale block text-center text-xs text-muted-foreground/90 underline-offset-2 hover:text-primary hover:underline">
          Returning user? Sign in
        </Link>
      </div>
    </div>
  );
}
