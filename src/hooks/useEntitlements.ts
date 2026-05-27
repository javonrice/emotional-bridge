import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { useSubscription } from "./useSubscription";

const FREE_DEBRIEF_LIMIT = 3;

export type Entitlements = {
  tier: "free" | "paid";
  isPaid: boolean;
  debriefsRemaining: number | null;
  debriefsUsed: number | null;
  freeLimit: number;
  loading: boolean;
  refresh: () => void;
};

export function useEntitlements(): Entitlements {
  const { user, loading: authLoading } = useAuth();
  const { isActive, loading: subLoading } = useSubscription();
  const [lifetimeCount, setLifetimeCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (authLoading || subLoading) return;
    if (!user || isActive) {
      setLifetimeCount(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { count } = await supabase
        .from("debriefs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (!cancelled) {
        setLifetimeCount(count ?? 0);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading, subLoading, isActive, tick]);

  if (isActive) {
    return {
      tier: "paid",
      isPaid: true,
      debriefsRemaining: null,
      debriefsUsed: null,
      freeLimit: FREE_DEBRIEF_LIMIT,
      loading: subLoading || authLoading,
      refresh,
    };
  }
  return {
    tier: "free",
    isPaid: false,
    debriefsRemaining:
      lifetimeCount === null ? null : Math.max(0, FREE_DEBRIEF_LIMIT - lifetimeCount),
    debriefsUsed: lifetimeCount,
    freeLimit: FREE_DEBRIEF_LIMIT,
    loading,
    refresh,
  };
}
