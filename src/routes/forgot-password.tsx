import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ name: "robots", content: "noindex,nofollow" }] }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setErr(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/reset-password",
      });
      if (error) throw error;
      setSent(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not send reset email");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col gradient-hero safe-top safe-bottom px-6 pt-10">
      <div className="text-xs uppercase tracking-[0.18em] text-primary">LOOP</div>
      <h1 className="mt-3 text-[32px] font-bold leading-tight tracking-tight">Reset your password</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter your email and we'll send you a link to set a new password.
      </p>

      {sent ? (
        <div className="mt-8 rounded-2xl border border-white/10 bg-card p-5">
          <p className="text-sm text-foreground">
            If an account exists for <span className="font-semibold">{email}</span>, a reset link is on its way. Check your inbox.
          </p>
          <Link to="/login" className="mt-5 inline-flex text-sm text-primary">Back to sign in</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-3">
          <input
            type="email" required autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="h-13 w-full rounded-2xl border border-white/10 bg-card px-4 py-3.5 text-base text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
          />
          {err && <p className="text-xs text-destructive">{err}</p>}
          <button
            type="submit" disabled={busy}
            className="ios-pill tap-scale flex h-14 w-full items-center justify-center bg-primary text-base font-semibold text-primary-foreground glow disabled:opacity-60"
          >
            {busy ? "…" : "Send reset link"}
          </button>
          <Link to="/login" className="mt-2 block text-center text-sm text-muted-foreground">
            Back to sign in
          </Link>
        </form>
      )}
    </div>
  );
}
