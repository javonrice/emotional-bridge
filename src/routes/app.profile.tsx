import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ChevronRight,
  Bell,
  Lock,
  CreditCard,
  LogOut,
  Apple,
  LifeBuoy,
  Download,
  Trash2,
  FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { deriveLoopName, resetOnboarding, useOnboarding, useStreak } from "@/lib/onboarding-store";
import { IosWaitlistSheet } from "@/components/ios/ComingSoonBadge";
import { exportUserData, deleteAccount } from "@/lib/account.functions";

export const Route = createFileRoute("/app/profile")({
  component: Profile,
});

function Profile() {
  const { answers } = useOnboarding();
  const { streak } = useStreak();
  const nav = useNavigate();
  const loopName = deriveLoopName(answers);
  const [waitlist, setWaitlist] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState<"export" | "delete" | null>(null);
  const exportFn = useServerFn(exportUserData);
  const deleteFn = useServerFn(deleteAccount);

  const signOut = async () => {
    await supabase.auth.signOut();
    resetOnboarding();
    nav({ to: "/login" });
  };

  const onExport = async () => {
    setBusy("export");
    try {
      const data = await exportFn();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `loop-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(null);
    }
  };

  const onDelete = async () => {
    setBusy("delete");
    try {
      const res = await deleteFn();
      if (res.ok) {
        await supabase.auth.signOut();
        resetOnboarding();
        nav({ to: "/login" });
      } else {
        alert(res.error ?? "Could not delete account.");
      }
    } finally {
      setBusy(null);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="safe-top px-6 pb-24">
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
        <Row icon={Apple} label="Connect iOS Screen Time" detail="Soon" onClick={() => setWaitlist(true)} accent />
        <Row icon={Bell} label="Drift alerts" detail="On" />
        <Row icon={CreditCard} label="Manage subscription" detail="Annual" />
        <RowLink icon={LifeBuoy} label="Crisis resources" to="/crisis" />
        <RowLink icon={Lock} label="Privacy & data" to="/legal/privacy" />
        <RowLink icon={FileText} label="Terms of Service" to="/legal/terms" />
        <Row icon={Download} label={busy === "export" ? "Preparing export…" : "Export my data"} onClick={onExport} />
        <Row icon={Trash2} label="Delete account" onClick={() => setConfirmDelete(true)} danger />
        <Row icon={LogOut} label="Sign out" onClick={signOut} last />
      </div>

      <p className="mt-6 text-center text-[11px] text-muted-foreground/60">
        LOOP · v0.1 · <Link to="/legal/eula" className="underline">EULA</Link>
      </p>

      <IosWaitlistSheet open={waitlist} onClose={() => setWaitlist(false)} source="profile_connect_ios" />

      {confirmDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-[400px] rounded-3xl border border-destructive/30 bg-card p-6 safe-bottom">
            <h2 id="delete-title" className="text-lg font-bold text-foreground">Delete your account?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This permanently deletes your loop, check-ins, debriefs, and all related data. There's no undo.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="tap-scale flex-1 rounded-full border border-white/15 px-4 py-3 text-sm font-medium text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={onDelete}
                disabled={busy === "delete"}
                className="tap-scale flex-1 rounded-full bg-destructive px-4 py-3 text-sm font-semibold text-destructive-foreground disabled:opacity-50"
              >
                {busy === "delete" ? "Deleting…" : "Delete forever"}
              </button>
            </div>
          </div>
        </div>
      )}
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

type RowProps = {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  detail?: string;
  onClick?: () => void;
  last?: boolean;
  accent?: boolean;
  danger?: boolean;
};

function Row({ icon: Icon, label, detail, onClick, last, accent, danger }: RowProps) {
  return (
    <button
      onClick={onClick}
      className={`tap-scale flex w-full items-center gap-4 px-4 py-4 text-left ${!last ? "border-b border-white/5" : ""}`}
    >
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${
        accent ? "bg-primary/15 text-primary"
          : danger ? "bg-destructive/15 text-destructive"
            : "bg-white/5 text-muted-foreground"
      }`}>
        <Icon size={18} />
      </span>
      <span className={`flex-1 text-[15px] font-medium ${danger ? "text-destructive" : "text-foreground"}`}>{label}</span>
      {detail && <span className={`text-xs ${accent ? "text-primary" : "text-muted-foreground"}`}>{detail}</span>}
      <ChevronRight size={16} className="text-muted-foreground/60" aria-hidden="true" />
    </button>
  );
}

function RowLink({ icon: Icon, label, to }: { icon: RowProps["icon"]; label: string; to: string }) {
  return (
    <Link to={to} className="tap-scale flex w-full items-center gap-4 border-b border-white/5 px-4 py-4 text-left">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-muted-foreground">
        <Icon size={18} />
      </span>
      <span className="flex-1 text-[15px] font-medium text-foreground">{label}</span>
      <ChevronRight size={16} className="text-muted-foreground/60" aria-hidden="true" />
    </Link>
  );
}
