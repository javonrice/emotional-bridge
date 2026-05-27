import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Check } from "lucide-react";
import { track } from "@/lib/analytics.functions";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  useEffect(() => {
    if (session_id) void track("paywall.checkout_complete", { session_id });
  }, [session_id]);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gradient-hero px-6 text-center safe-top">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success glow">
        <Check size={28} />
      </div>
      <h1 className="mt-6 text-2xl font-bold">You're in.</h1>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        {session_id ? "Your loop just unlocked. Welcome." : "Confirming your payment…"}
      </p>
      <Link
        to="/app/today"
        className="ios-pill tap-scale mt-8 flex h-13 items-center justify-center bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground glow"
      >
        Open LOOP
      </Link>
    </div>
  );
}
