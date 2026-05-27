import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { useAuth } from "./use-auth";

export type SubscriptionRow = {
  id: string;
  user_id: string;
  status: string;
  plan: string | null;
  price_id: string | null;
  product_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  environment: string;
};

function computeIsActive(row: SubscriptionRow | null): boolean {
  if (!row) return false;
  const end = row.current_period_end ? new Date(row.current_period_end).getTime() : null;
  const now = Date.now();
  if (["active", "trialing", "past_due"].includes(row.status)) {
    return end === null || end > now;
  }
  if (row.status === "canceled" && end && end > now) return true;
  return false;
}

export function useSubscription() {
  const { user, loading: authLoading } = useAuth();
  const [row, setRow] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const env = getStripeEnvironment();

  const fetchSub = async (userId: string) => {
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("environment", env)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setRow((data as SubscriptionRow | null) ?? null);
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRow(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchSub(user.id);

    const channel = supabase
      .channel(`subs-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` },
        () => fetchSub(user.id),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading, env]);

  return { subscription: row, isActive: computeIsActive(row), loading };
}
