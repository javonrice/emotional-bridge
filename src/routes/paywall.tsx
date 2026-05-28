import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Lock, Sparkles, X } from "lucide-react";
import { completeOnboarding, deriveLoopName, useOnboarding } from "@/lib/onboarding-store";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useAuth } from "@/hooks/use-auth";
import { track } from "@/lib/analytics.functions";

export const Route = createFileRoute("/paywall")({
  validateSearch: (search: Record<string, unknown>): { source?: string } => ({
    source: typeof search.source === "string" ? search.source : undefined,
  }),
  component: Paywall,
});

type Plan = "annual" | "monthly" | "lifetime";

const PLANS: Record<Plan, { label: string; price: string; per: string; tag?: string; trial?: string; priceId: string }> = {
  annual: { label: "Annual", price: "$59.99", per: "/year · ~$5/mo", tag: "Best value · save 67%", trial: "7-day free trial", priceId: "loop_annual" },
  monthly: { label: "Monthly", price: "$14.99", per: "/month", priceId: "loop_monthly" },
  lifetime: { label: "Lifetime", price: "$149", per: "one-time · forever", priceId: "loop_lifetime" },
};

function Paywall() {
  const nav = useNavigate();
  const router = useRouter();
  const { answers } = useOnboarding();
  const { source } = Route.useSearch();
  const { user } = useAuth();
  const { openCheckout, checkoutElement, isOpen, closeCheckout } = useStripeCheckout();
  const [plan, setPlanState] = useState<Plan>("annual");
  const [showSheet, setShowSheet] = useState(false);
  const loopName = deriveLoopName(answers);

  useEffect(() => {
    void track("paywall.view", { source: source ?? "unknown", loopName });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setPlan = (p: Plan) => {
    setPlanState(p);
    void track("paywall.plan_select", { plan: p });
  };

  const start = () => {
    completeOnboarding();
    const p = PLANS[plan];
    void track("paywall.checkout_start", { plan, source: source ?? "unknown" });
    openCheckout({
      priceId: p.priceId,
      customerEmail: user?.email,
      userId: user?.id,
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });
  };

  const skip = () => {
    completeOnboarding();
    nav({ to: "/app/today" });
  };

  return (
    <div className="relative flex min-h-screen flex-col gradient-hero safe-top">
      <div className="flex h-12 items-center justify-end px-4">
        <button onClick={skip} aria-label="Close" className="tap-scale flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-muted-foreground">
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-primary">
            <Sparkles size={14} /> Your plan is ready
          </div>
          <h1 className="mt-3 text-[36px] font-bold leading-[1.05] tracking-tight">
            Unlock <span className="text-primary text-glow">{loopName}</span>
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Everything you just told me — your trigger chain, your drift windows, your gateway apps — lives behind this button. Without it, the loop keeps running you.
          </p>
        </motion.div>

        <div className="mt-6 space-y-3">
          {(Object.keys(PLANS) as Plan[]).map((k) => {
            const p = PLANS[k];
            const active = plan === k;
            return (
              <button
                key={k}
                onClick={() => setPlan(k)}
                className={`tap-scale relative flex w-full items-center justify-between rounded-2xl border bg-card p-4 text-left transition-colors ${
                  active ? "border-primary shadow-[0_0_0_3px_rgba(108,99,255,0.18)]" : "border-white/8"
                }`}
              >
                {p.tag && (
                  <span className="absolute -top-2 left-4 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                    {p.tag}
                  </span>
                )}
                <div>
                  <div className="text-base font-semibold text-foreground">{p.label}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{p.per}</div>
                  {p.trial && <div className="mt-1 text-xs font-medium text-success">{p.trial}</div>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-lg font-bold text-foreground">{p.price}</div>
                  </div>
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full border ${active ? "border-primary bg-primary" : "border-white/20"}`}>
                    {active && <Check size={14} className="text-primary-foreground" />}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <ul className="mt-6 space-y-2.5">
          {[
            "Full Loop visualization after 14 days",
            "Drift alerts at your high-risk windows",
            "Daily check-ins + voice debriefs",
            "Monthly pattern report",
            "Encrypted. Anonymous. No accountability partner ever.",
          ].map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <Check size={16} className="mt-0.5 shrink-0 text-success" />
              {b}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground/70">
          <Lock size={12} /> Cancel anytime in Settings
        </div>
      </div>

      <div className="ios-blur safe-bottom border-t border-white/5 px-6 pt-3">
        <button
          onClick={start}
          className="ios-pill tap-scale flex h-14 w-full items-center justify-center bg-primary text-base font-semibold text-primary-foreground glow"
        >
          {plan === "annual" ? "Start 7-day free trial" : plan === "lifetime" ? "Get lifetime access" : "Start membership"}
        </button>
        <button onClick={skip} className="mt-2 block w-full text-center text-xs text-muted-foreground/70">
          Not now — continue with limited access
        </button>
      </div>

      <AnimatePresence>
        {showSheet && <Objection onClose={() => setShowSheet(false)} onSkip={skip} />}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeCheckout}
              className="fixed inset-0 z-[60] bg-black/70"
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 36 }}
              className="fixed inset-x-0 bottom-0 z-[70] max-h-[92vh] overflow-y-auto rounded-t-3xl bg-surface p-4 safe-bottom"
            >
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/15" />
              <div className="flex items-center justify-between px-2 pb-2">
                <h3 className="text-base font-semibold text-foreground">Complete your purchase</h3>
                <button onClick={closeCheckout} aria-label="Close" className="tap-scale flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-muted-foreground">
                  <X size={16} />
                </button>
              </div>
              {checkoutElement}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function Objection({ onClose, onSkip }: { onClose: () => void; onSkip: () => void }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 z-40 bg-black/60"
      />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
        className="absolute inset-x-0 bottom-0 z-50 rounded-t-3xl bg-surface p-6 safe-bottom"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/15" />
        <h3 className="text-xl font-bold text-foreground">Before you go —</h3>
        <p className="mt-2 text-[15px] text-muted-foreground">
          You already paid the cost in hours. The only question is whether the next year looks like the last one.
        </p>
        <button
          onClick={onClose}
          className="ios-pill tap-scale mt-5 flex h-13 w-full items-center justify-center bg-primary py-3 text-base font-semibold text-primary-foreground"
        >
          Take me back
        </button>
        <button onClick={onSkip} className="mt-2 block w-full py-2 text-center text-xs text-muted-foreground/70">
          Continue with limited access
        </button>
      </motion.div>
    </>
  );
}
