import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CheckinSchema = z.object({
  energy: z.string().min(1).max(40),
  emotion: z.string().min(1).max(40),
  activity: z.string().min(1).max(40),
  tz_offset_minutes: z.number().int().min(-14 * 60).max(14 * 60),
});

export const saveCheckin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CheckinSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("checkins").insert({
      user_id: userId,
      energy: data.energy,
      emotion: data.emotion,
      activity: data.activity,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, error: null as string | null };
  });

// Local-day key in user's timezone
function localDayKey(iso: string, tzOffsetMin: number): string {
  const t = new Date(iso).getTime() - tzOffsetMin * 60 * 1000;
  return new Date(t).toISOString().slice(0, 10);
}

export const getCheckinStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ tz_offset_minutes: z.number().int().min(-14 * 60).max(14 * 60) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString();
    const [checkinsRes, debriefsRes] = await Promise.all([
      supabase
        .from("checkins")
        .select("created_at, emotion, activity, energy")
        .eq("user_id", userId)
        .gte("created_at", since)
        .order("created_at", { ascending: false }),
      supabase
        .from("debriefs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
    ]);

    const rows = checkinsRes.data;
    const error = checkinsRes.error;
    const totalDebriefs = debriefsRes.count ?? 0;

    if (error)
      return {
        streak: 0,
        total: 0,
        totalDebriefs,
        days: [],
        checkedInToday: false,
        emotions: [],
        edges: [],
        error: error.message,
      };

    const days = new Set<string>();
    const emotionsCount: Record<string, number> = {};
    const edgesCount: Record<string, number> = {};
    let prevEmotion: string | null = null;
    // Walk oldest→newest for edges
    const oldestFirst = [...(rows ?? [])].reverse();
    for (const r of oldestFirst) {
      const dayKey = localDayKey(r.created_at as string, data.tz_offset_minutes);
      days.add(dayKey);
      const e = (r.emotion as string).toLowerCase();
      emotionsCount[e] = (emotionsCount[e] ?? 0) + 1;
      if (prevEmotion && prevEmotion !== e) {
        const key = `${prevEmotion}|${e}`;
        edgesCount[key] = (edgesCount[key] ?? 0) + 1;
      }
      prevEmotion = e;
    }

    // Streak: consecutive local days back from today (or yesterday if no today)
    const todayKey = localDayKey(new Date().toISOString(), data.tz_offset_minutes);
    let streak = 0;
    const cursor = new Date(todayKey + "T00:00:00Z");
    if (!days.has(todayKey)) cursor.setUTCDate(cursor.getUTCDate() - 1);
    while (days.has(cursor.toISOString().slice(0, 10))) {
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    const emotions = Object.entries(emotionsCount)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);

    const edges = Object.entries(edgesCount)
      .map(([key, count]) => {
        const [from, to] = key.split("|");
        return { from, to, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      streak,
      total: rows?.length ?? 0,
      totalDebriefs,
      days: Array.from(days),
      checkedInToday: days.has(todayKey),
      emotions,
      edges,
      error: null as string | null,
    };
  });

export const getDebriefHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("debriefs")
      .select("id, created_at, pattern, reframe, micro_action, input_text")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) return { items: [], error: error.message };
    return { items: data ?? [], error: null as string | null };
  });
