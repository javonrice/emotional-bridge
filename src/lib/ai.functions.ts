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
