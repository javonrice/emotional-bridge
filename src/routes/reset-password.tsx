import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ name: "robots", content: "noindex,nofollow" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Supabase establishes the recovery session from the URL hash automatically
  // via detectSessionInUrl. Wait for an auth event before letting the user submit.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (password.length < 8) { setErr("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setErr("Passwords don't match."); return; }
    setBusy(true); setErr(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => nav({ to: "/app/today", replace: true }), 1200);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not update password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col gradient-hero safe-top safe-bottom px-6 pt-10">
      <div className="text-xs uppercase tracking-[0.18em] text-primary">LOOP</div>
      <h1 className="mt-3 text-[32px] font-bold leading-tight tracking-tight">Set a new password</h1>
      {!ready && (
        <p className="mt-2 text-sm text-muted-foreground">Verifying your reset link…</p>
      )}
      {done ? (
        <p className="mt-8 text-sm text-foreground">Password updated. Taking you in…</p>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-3">
          <input
            type="password" required minLength={8} autoComplete="new-password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="New password (min 8 characters)"
            className="h-13 w-full rounded-2xl border border-white/10 bg-card px-4 py-3.5 text-base text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
          />
          <input
            type="password" required minLength={8} autoComplete="new-password"
            value={confirm} onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password"
            className="h-13 w-full rounded-2xl border border-white/10 bg-card px-4 py-3.5 text-base text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
          />
          {err && <p className="text-xs text-destructive">{err}</p>}
          <button
            type="submit" disabled={busy || !ready}
            className="ios-pill tap-scale flex h-14 w-full items-center justify-center bg-primary text-base font-semibold text-primary-foreground glow disabled:opacity-60"
          >
            {busy ? "…" : "Update password"}
          </button>
        </form>
      )}
    </div>
  );
}
