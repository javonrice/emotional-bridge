import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Apple, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function ComingSoonBadge({ source, label = "Auto-tracking · iOS soon" }: { source: string; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="tap-scale inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"
      >
        <Apple size={11} /> {label}
      </button>
      <IosWaitlistSheet open={open} onClose={() => setOpen(false)} source={source} />
    </>
  );
}

export function IosWaitlistSheet({ open, onClose, source }: { open: boolean; onClose: () => void; source: string }) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email && !email) setEmail(data.user.email);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { data: userRes } = await supabase.auth.getUser();
    const { error: insertErr } = await supabase
      .from("ios_waitlist")
      .insert({ email: email.trim().toLowerCase(), source, user_id: userRes.user?.id ?? null });
    setSubmitting(false);
    if (insertErr) {
      setError(insertErr.message);
      return;
    }
    setDone(true);
  };

  const close = () => {
    onClose();
    setTimeout(() => { setDone(false); setError(null); }, 300);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} className="fixed inset-0 z-40 bg-black/60" />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[430px] rounded-t-3xl bg-surface p-6 safe-bottom"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Apple size={16} className="text-primary" /> Auto-tracking · iOS
              </div>
              <button onClick={close} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-muted-foreground">
                <X size={16} />
              </button>
            </div>

            {!done ? (
              <>
                <p className="mt-4 text-[15px] leading-relaxed text-foreground/90">
                  Native auto-detection of your loops via iOS Screen Time is shipping in the LOOP iOS app.
                  Today this runs as self-report — drop your email and we'll tell you the moment it goes live.
                </p>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="mt-4 h-12 w-full rounded-2xl border border-white/10 bg-background/60 px-4 text-[15px] text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                />
                {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="ios-pill tap-scale mt-4 flex h-12 w-full items-center justify-center bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {submitting ? "Adding you…" : "Notify me when it ships"}
                </button>
                <p className="mt-3 text-center text-[11px] text-muted-foreground/70">No spam. One email when it goes live.</p>
              </>
            ) : (
              <div className="py-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/20 text-success">
                  <Check size={22} />
                </div>
                <p className="mt-3 text-[15px] font-semibold">You're on the list.</p>
                <p className="mt-1 text-xs text-muted-foreground">We'll email {email} when iOS auto-tracking ships.</p>
                <button onClick={close} className="ios-pill tap-scale mt-5 inline-flex h-11 items-center justify-center bg-card px-6 text-sm font-medium">
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
