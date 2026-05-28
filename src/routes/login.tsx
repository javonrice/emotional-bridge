import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { useServerFn } from "@tanstack/react-start";
import { migrateLocalAnswers } from "@/lib/auth.functions";
import { useOnboarding } from "@/lib/onboarding-store";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ name: "robots", content: "noindex,nofollow" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ redirect: (s.redirect as string) || "/app/today" }),
  component: Login,
});


function Login() {
  const nav = useNavigate();
  const search = Route.useSearch();
  const { isAuthenticated, loading } = useAuth();
  const { answers } = useOnboarding();
  const migrate = useServerFn(migrateLocalAnswers);

  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (isAuthenticated) {
      // Migrate any local answers on first sign-in
      (async () => {
        try {
          if (Object.keys(answers).length > 0) {
            await migrate({ data: {
              age: answers.age ?? null,
              duration: answers.duration ?? null,
              control: answers.control ?? null,
              apps: answers.apps ?? [],
              timing: answers.timing ?? null,
              feeling: answers.feeling ?? null,
              story: answers.story ?? null,
            } });
          }
        } catch {}
        // Resume incomplete onboarding if user has a last step but never completed.
        let dest = search.redirect;
        try {
          const done = localStorage.getItem("loop.onboarded.v1") === "1";
          const lastStep = localStorage.getItem("loop.onboarding.lastStep.v1");
          if (!done && lastStep && lastStep.startsWith("/onboarding/")) {
            dest = lastStep;
          }
        } catch {}
        nav({ to: dest, replace: true });
      })();
    }
  }, [isAuthenticated, loading]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setErr(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/login" },
        });
        if (error) throw error;
        // Supabase returns 200 with no session and an empty identities array when the email
        // is already registered (anti-enumeration). Flip to sign-in mode so the user can continue.
        if (data.user && !data.session && (data.user.identities?.length ?? 0) === 0) {
          setMode("signin");
          setErr("An account with this email already exists — sign in to continue.");
          return;
        }
        // Auto-confirm is enabled; if no session came back, surface that explicitly.
        if (!data.session) {
          setErr("Check your email to confirm your account, then sign in.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Auth failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setErr(null);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/login" });
      if (result.error) setErr("Google sign-in failed");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Google sign-in failed");
    }
  };

  return (
    <div className="flex min-h-screen flex-col gradient-hero safe-top safe-bottom px-6 pt-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-xs uppercase tracking-[0.18em] text-primary">LOOP</div>
        <h1 className="mt-3 text-[32px] font-bold leading-tight tracking-tight">
          {mode === "signup" ? "Save your loop." : "Welcome back."}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signup" ? "We'll keep your pattern private and synced across your devices." : "Your pattern is waiting."}
        </p>
      </motion.div>

      <form onSubmit={handleEmail} className="mt-8 space-y-3">
        <input
          type="email" required autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="h-13 w-full rounded-2xl border border-white/10 bg-card px-4 py-3.5 text-base text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
        />
        <input
          type="password" required minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min 8 characters)"
          className="h-13 w-full rounded-2xl border border-white/10 bg-card px-4 py-3.5 text-base text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
        />
        {err && <p className="text-xs text-destructive">{err}</p>}
        <button
          type="submit" disabled={busy}
          className="ios-pill tap-scale flex h-14 w-full items-center justify-center bg-primary text-base font-semibold text-primary-foreground glow disabled:opacity-60"
        >
          {busy ? "…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground/60">
        <div className="h-px flex-1 bg-white/10" /> or <div className="h-px flex-1 bg-white/10" />
      </div>

      <button
        onClick={handleGoogle}
        className="tap-scale flex h-14 w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-card text-sm font-semibold text-foreground"
      >
        Continue with Google
      </button>

      <button
        onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
        className="mt-6 text-center text-sm text-muted-foreground"
      >
        {mode === "signup" ? "Already have an account? Sign in" : "New here? Create account"}
      </button>

      <p className="mt-4 text-center text-[11px] text-muted-foreground/60">
        <Link to="/">Back</Link>
      </p>
    </div>
  );
}
