import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const MIN_SAMPLE_N = 5;

const QuerySchema = z.object({
  days: z.number().int().min(1).max(365).default(30),
});

export const getAIQualityStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => QuerySchema.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return { authorized: false as const };

    const since = new Date(Date.now() - data.days * 24 * 60 * 60 * 1000).toISOString();
    const { data: rows, error } = await supabase
      .from("ai_feedback")
      .select("surface, rating, reason, model, prompt_version, comment, answers_snapshot, source_id, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) return { authorized: true as const, error: error.message, summary: [], recentBad: [] };

    const buckets = new Map<string, { up: number; down: number }>();
    const recentBad: typeof rows = [];
    for (const r of rows ?? []) {
      const key = `${r.surface}|${r.prompt_version ?? "?"}|${r.model ?? "?"}`;
      const b = buckets.get(key) ?? { up: 0, down: 0 };
      if (r.rating === "up") b.up++;
      else b.down++;
      buckets.set(key, b);
      if (r.rating === "down" && recentBad.length < 30) recentBad.push(r);
    }

    const summary = Array.from(buckets.entries())
      .map(([key, v]) => {
        const [surface, prompt_version, model] = key.split("|");
        const total = v.up + v.down;
        const enoughSamples = total >= MIN_SAMPLE_N;
        return {
          surface,
          prompt_version,
          model,
          up: v.up,
          down: v.down,
          total,
          up_rate: enoughSamples ? Math.round((v.up / total) * 100) : null,
          enough_samples: enoughSamples,
        };
      })
      .sort((a, b) => b.total - a.total);

    return { authorized: true as const, error: null as string | null, summary, recentBad, min_sample_n: MIN_SAMPLE_N };
  });
