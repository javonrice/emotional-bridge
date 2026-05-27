import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, Output } from "ai";
import { z } from "zod";
import { getGateway, MODEL_ID, PROMPT_VERSION } from "./ai-gateway.server";

const AnswersSchema = z.object({
  age: z.string().optional(),
  duration: z.string().optional(),
  control: z.number().optional(),
  apps: z.array(z.string()).optional(),
  timing: z.string().optional(),
  feeling: z.string().optional(),
  story: z.string().optional(),
});

const LoopOutputSchema = z.object({
  name: z.string().describe("A short, evocative 3-6 word name for this user's behavioral loop, in title case. Example: 'The Late Night Lonely Spiral'."),
  trigger_chain: z.array(z.string()).length(3).describe("Three short 1-3 word pills showing the chain: feeling → gateway → outcome. Example: ['Lonely', 'Instagram', 'Numb scroll']."),
  summary: z.string().describe("Three sentences, second-person, warm and non-shaming, naming the pattern back to the user with specificity. Do not give advice."),
});

export const generateLoop = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AnswersSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Per-user rate limit: max 3 loop generations per hour.
    const sinceHour = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: loopCount } = await supabase
      .from("loops")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", sinceHour);
    if ((loopCount ?? 0) >= 3) {
      return { loop: null, error: "You've generated a few loops recently — give it an hour and try again." };
    }

    const gateway = getGateway();
    const prompt = `You are LOOP — an emotional pattern intelligence tool, not therapy.

A user just answered an onboarding questionnaire about a compulsive behavioral loop they want to understand. Map their answers into a single named "loop" with a trigger chain and a 3-sentence summary that reflects their pattern back to them. Tone: warm, observational, never shaming, never preachy, never giving advice. Speak in the second person ("you").

User answers:
- Age range: ${data.age ?? "unspecified"}
- How long the loop has been running: ${data.duration ?? "unspecified"} years
- Sense of control (1=none, 10=full): ${data.control ?? "unspecified"}
- Gateway apps: ${(data.apps ?? []).join(", ") || "unspecified"}
- When it usually happens: ${data.timing ?? "unspecified"}
- First feeling that shows up: ${data.feeling ?? "unspecified"}
- Their own words about the last time: ${data.story?.slice(0, 1000) ?? "they did not share"}

Generate the loop now.`;

    try {
      const { experimental_output } = await generateText({
        model: gateway(MODEL_ID),
        experimental_output: Output.object({ schema: LoopOutputSchema }),
        prompt,
      });

      // Mark prior loops as not current, insert new
      await supabase.from("loops").update({ is_current: false }).eq("user_id", userId).eq("is_current", true);

      const { data: inserted, error } = await supabase
        .from("loops")
        .insert({
          user_id: userId,
          name: experimental_output.name,
          trigger_chain: experimental_output.trigger_chain,
          summary: experimental_output.summary,
          model: MODEL_ID,
          prompt_version: PROMPT_VERSION,
          answers_snapshot: data,
          is_current: true,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return { loop: inserted, error: null as string | null };
    } catch (err) {
      console.error("generateLoop failed", err);
      const message = err instanceof Error ? err.message : "AI generation failed";
      return { loop: null, error: message };
    }
  });

const DebriefOutputSchema = z.object({
  pattern: z.string().describe("One sentence naming the pattern you see in what the user wrote."),
  reframe: z.string().describe("Two sentences offering a gentle, non-shaming reframe. Speak in the second person."),
  micro_action: z.string().describe("One concrete, tiny action (under 10 words) the user could try next time."),
});

export const generateDebrief = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ text: z.string().min(1).max(4000) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Hourly abuse rate limit — applies to ALL users (paid included).
    // Runs BEFORE the free-tier paywall gate below.
    const sinceHour = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: hourlyCount } = await supabase
      .from("debriefs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", sinceHour);
    if ((hourlyCount ?? 0) >= 3) {
      return { debrief: null, error: "You've hit your hourly limit. Try again in a bit." };
    }

    // Free-tier gate — 3 lifetime debriefs for users without an active subscription.
    const { data: activeSub } = await supabase
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", userId)
      .in("status", ["active", "trialing", "past_due", "canceled"])
      .order("created_at", { ascending: false })
      .limit(5);
    const now = Date.now();
    const isPaid = (activeSub ?? []).some((s) => {
      const end = s.current_period_end ? new Date(s.current_period_end).getTime() : null;
      if (["active", "trialing", "past_due"].includes(s.status)) return end === null || end > now;
      if (s.status === "canceled" && end && end > now) return true;
      return false;
    });
    if (!isPaid) {
      const { count: lifetimeCount } = await supabase
        .from("debriefs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      if ((lifetimeCount ?? 0) >= 3) {
        return { debrief: null, error: "PAYWALL", upgradeRequired: true };
      }
    }

    const gateway = getGateway();

    const prompt = `You are LOOP. The user just submitted a debrief of a recent loop episode. Read it carefully and reflect it back to them in three parts: pattern, reframe, micro_action. Be warm, observational, specific, non-shaming, never preachy. Do not diagnose. Do not say "I'm sorry you're going through this." Speak in second person ("you").

User debrief:
${data.text}`;

    try {
      const { experimental_output } = await generateText({
        model: gateway(MODEL_ID),
        experimental_output: Output.object({ schema: DebriefOutputSchema }),
        prompt,
      });

      const { data: inserted, error } = await supabase
        .from("debriefs")
        .insert({
          user_id: userId,
          input_text: data.text,
          pattern: experimental_output.pattern,
          reframe: experimental_output.reframe,
          micro_action: experimental_output.micro_action,
          model: MODEL_ID,
          prompt_version: PROMPT_VERSION,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return { debrief: inserted, error: null as string | null };
    } catch (err) {
      console.error("generateDebrief failed", err);
      const message = err instanceof Error ? err.message : "AI generation failed";
      return { debrief: null, error: message };
    }
  });

// AI feedback
const FeedbackSchema = z.object({
  surface: z.enum(["loop_card", "debrief_card", "monthly_report"]),
  source_id: z.string().uuid(),
  rating: z.enum(["up", "down"]),
  reason: z.enum(["generic", "inaccurate", "tone_off", "too_long", "other"]).optional().nullable(),
  comment: z.string().max(500).optional().nullable(),
});

export const recordAIFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => FeedbackSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Fetch the source row to snapshot model + prompt_version + answers
    let model: string | null = null;
    let prompt_version: string | null = null;
    let answers_snapshot: any = null;

    if (data.surface === "loop_card") {
      const { data: row } = await supabase.from("loops").select("model, prompt_version, answers_snapshot").eq("id", data.source_id).maybeSingle();
      model = row?.model ?? null;
      prompt_version = row?.prompt_version ?? null;
      answers_snapshot = row?.answers_snapshot ?? null;
    } else if (data.surface === "debrief_card") {
      const { data: row } = await supabase.from("debriefs").select("model, prompt_version").eq("id", data.source_id).maybeSingle();
      model = row?.model ?? null;
      prompt_version = row?.prompt_version ?? null;
    }

    const { error } = await supabase.from("ai_feedback").insert({
      user_id: userId,
      surface: data.surface,
      source_id: data.source_id,
      rating: data.rating,
      reason: data.reason ?? null,
      comment: data.comment ?? null,
      model,
      prompt_version,
      answers_snapshot,
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true, error: null as string | null };
  });

// ============= Monthly report =============

const MonthlyInput = z.object({
  tz_offset_minutes: z.number().int().min(-14 * 60).max(14 * 60),
  force: z.boolean().optional(),
});

const MonthlyOutputSchema = z.object({
  pattern: z.string().describe("One short sentence (max 18 words), second-person, naming the dominant emotional pattern across the last 30 days. Warm, observational, never shaming."),
  the_shift: z.string().describe("One short sentence (max 18 words) describing what shifted across the month — fewer late-night spirals, more calm mornings, or honestly noting little has changed yet. Second-person."),
});

function localDayKeyUTC(iso: string, tzOffsetMin: number): string {
  const t = new Date(iso).getTime() - tzOffsetMin * 60 * 1000;
  return new Date(t).toISOString().slice(0, 10);
}

export const generateMonthlyReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => MonthlyInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const todayKey = localDayKeyUTC(new Date().toISOString(), data.tz_offset_minutes);

    if (!data.force) {
      const { data: cached } = await supabase
        .from("monthly_reports")
        .select("*")
        .eq("user_id", userId)
        .eq("period_end", todayKey)
        .maybeSingle();
      if (cached) return { report: cached, error: null as string | null };
    }

    const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString();
    const { data: rows, error: checkErr } = await supabase
      .from("checkins")
      .select("created_at, emotion, activity, energy")
      .eq("user_id", userId)
      .gte("created_at", since)
      .order("created_at", { ascending: true });
    if (checkErr) return { report: null, error: checkErr.message };

    const total = rows?.length ?? 0;
    if (total < 30) {
      return { report: null, error: "Need at least 30 check-ins to generate a monthly report." };
    }

    const emotionCount: Record<string, number> = {};
    const activityCount: Record<string, number> = {};
    for (const r of rows ?? []) {
      const e = (r.emotion as string).toLowerCase();
      const a = (r.activity as string).toLowerCase();
      emotionCount[e] = (emotionCount[e] ?? 0) + 1;
      activityCount[a] = (activityCount[a] ?? 0) + 1;
    }
    const mostLoud = Object.entries(emotionCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const topGateway = Object.entries(activityCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    const half = Math.floor((rows ?? []).length / 2);
    const countTop = (arr: typeof rows) => {
      const m: Record<string, number> = {};
      for (const r of arr ?? []) {
        const e = (r!.emotion as string).toLowerCase();
        m[e] = (m[e] ?? 0) + 1;
      }
      return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 3);
    };
    const firstHalfTop = countTop((rows ?? []).slice(0, half));
    const secondHalfTop = countTop((rows ?? []).slice(half));

    const prompt = `You are LOOP. Generate two short reflections for a user's 30-day awareness report. Tone: warm, observational, second-person, no advice, no shaming, no diagnosis.

Data:
- Total check-ins (last 30 days): ${total}
- Most loud feeling: ${mostLoud ?? "none"}
- Top activity context: ${topGateway ?? "none"}
- First half top feelings: ${firstHalfTop.map(([k, v]) => `${k}(${v})`).join(", ")}
- Second half top feelings: ${secondHalfTop.map(([k, v]) => `${k}(${v})`).join(", ")}

Write a "pattern" sentence and a "the_shift" sentence. If little changed, say so honestly.`;

    let pattern: string | null = null;
    let the_shift: string | null = null;
    try {
      const gateway = getGateway();
      const { experimental_output } = await generateText({
        model: gateway(MODEL_ID),
        experimental_output: Output.object({ schema: MonthlyOutputSchema }),
        prompt,
      });
      pattern = experimental_output.pattern;
      the_shift = experimental_output.the_shift;
    } catch (e) {
      pattern = mostLoud
        ? `${mostLoud.charAt(0).toUpperCase() + mostLoud.slice(1)} ran underneath most of your month.`
        : "Your month had a steady rhythm of awareness.";
      the_shift = "You showed up every day this month. That is the shift.";
      console.error("monthly report ai error", e);
    }

    const insertPayload = {
      user_id: userId,
      period_end: todayKey,
      the_number: total,
      most_loud: mostLoud,
      pattern,
      top_gateway: topGateway,
      the_shift,
      model: MODEL_ID,
      prompt_version: PROMPT_VERSION,
    };

    const { data: upserted, error: upErr } = await supabase
      .from("monthly_reports")
      .upsert(insertPayload, { onConflict: "user_id,period_end" })
      .select()
      .single();
    if (upErr) return { report: null, error: upErr.message };

    return { report: upserted, error: null as string | null };
  });
