import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronRight, Bell, Lock, CreditCard, LogOut, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { deriveLoopName, resetOnboarding, useOnboarding, useStreak } from "@/lib/onboarding-store";

export const Route = createFileRoute("/app/profile")({
  component: Profile,
});

function Profile() {
  const { answers } = useOnboarding();
  const { streak } = useStreak();
  const nav = useNavigate();
  const loopName = deriveLoopName(answers);

  const restart = () => {
    resetOnboarding();
    nav({ to: "/onboarding/welcome" });
  };
  const signOut = async () => {
    await supabase.auth.signOut();
    resetOnboarding();
    nav({ to: "/login" });
  };

  return (
    <div className="safe-top px-6 pb-4">
      <h1 className="pt-2 text-[28px] font-bold tracking-tight">You</h1>

      <div className="mt-5 rounded-3xl border border-white/8 bg-card p-5">
        <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Your loop</div>
        <div className="mt-1 text-xl font-semibold text-primary">{loopName}</div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <Stat n={streak} label="Streak" />
        <Stat n={47} label="Check-ins" />
        <Stat n={12} label="Debriefs" />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/8 bg-card">
        <Row icon={Bell} label="Drift alerts" detail="On" />
        <Row icon={Lock} label="Privacy & data" />
        <Row icon={CreditCard} label="Manage subscription" detail="Annual" />
        <Row icon={RotateCcw} label="Restart onboarding (dev)" onClick={restart} />
        <Row icon={LogOut} label="Sign out" onClick={signOut} last />
      </div>

      <p className="mt-6 text-center text-[11px] text-muted-foreground/60">LOOP · prototype build · v0.1</p>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-card p-4 text-center">
      <div className="text-2xl font-bold tabular-nums text-foreground">{n}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function Row({ icon: Icon, label, detail, onClick, last }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; detail?: string; onClick?: () => void; last?: boolean }) {
  return (
    <button onClick={onClick} className={`tap-scale flex w-full items-center gap-4 px-4 py-4 text-left ${!last && "border-b border-white/5"}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-muted-foreground">
        <Icon size={18} />
      </span>
      <span className="flex-1 text-[15px] font-medium text-foreground">{label}</span>
      {detail && <span className="text-xs text-muted-foreground">{detail}</span>}
      <ChevronRight size={16} className="text-muted-foreground/60" />
    </button>
  );
}
