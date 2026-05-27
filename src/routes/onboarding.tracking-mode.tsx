import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Apple, Edit3, Check } from "lucide-react";
import { IosWaitlistSheet } from "@/components/ios/ComingSoonBadge";

export const Route = createFileRoute("/onboarding/tracking-mode")({
  component: TrackingMode,
});

function TrackingMode() {
  const nav = useNavigate();
  const [waitlist, setWaitlist] = useState(false);

  return (
    <div className="min-h-screen gradient-hero px-6 pt-16 pb-10 safe-top safe-bottom">
      <div className="mx-auto max-w-md">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">How LOOP sees you</p>
        <h1 className="mt-3 text-[28px] font-bold leading-tight">
          Two ways to map your loop. One is here now.
        </h1>
        <p className="mt-3 text-[15px] text-muted-foreground">
          Pick what fits today. You can flip later.
        </p>

        <button
          onClick={() => nav({ to: "/onboarding/opener" })}
          className="tap-scale mt-8 block w-full rounded-3xl border border-primary/40 bg-card p-5 text-left"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Edit3 size={13} /> Available now
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check size={14} />
            </span>
          </div>
          <div className="mt-3 text-lg font-semibold">Self-report</div>
          <p className="mt-1 text-sm text-muted-foreground">
            You tell LOOP what just happened. Two-tap check-ins, voice debriefs. Honest, fast, no permissions.
          </p>
        </button>

        <button
          onClick={() => setWaitlist(true)}
          className="tap-scale mt-3 block w-full rounded-3xl border border-white/10 bg-card/60 p-5 text-left"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              <Apple size={11} /> iOS · coming soon
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">Join waitlist</span>
          </div>
          <div className="mt-3 text-lg font-semibold text-foreground/80">Auto-tracking</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Native iOS app reads Screen Time and pinpoints your drift windows automatically. No typing.
          </p>
        </button>

        <button
          onClick={() => nav({ to: "/onboarding/opener" })}
          className="tap-scale mt-8 block w-full text-center text-xs text-muted-foreground"
        >
          Continue with self-report →
        </button>
      </div>
      <IosWaitlistSheet open={waitlist} onClose={() => setWaitlist(false)} source="onboarding_tracking_mode" />
    </div>
  );
}
