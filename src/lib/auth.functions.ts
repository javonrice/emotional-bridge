import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const AnswersSchema = z.object({
  age: z.string().max(50).optional().nullable(),
  duration: z.string().max(10).optional().nullable(),
  control: z.number().int().min(1).max(10).optional().nullable(),
  apps: z.array(z.string().max(50)).max(20).optional().nullable(),
  timing: z.string().max(50).optional().nullable(),
  feeling: z.string().max(50).optional().nullable(),
  story: z.string().max(4000).optional().nullable(),
});

export const migrateLocalAnswers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AnswersSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("onboarding_answers")
      .upsert({
        user_id: userId,
        age: data.age ?? null,
        duration: data.duration ?? null,
        control: data.control ?? null,
        apps: data.apps ?? [],
        timing: data.timing ?? null,
        feeling: data.feeling ?? null,
        story: data.story ?? null,
        completed_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    if (error) return { ok: false, error: error.message };
    return { ok: true, error: null as string | null };
  });

export const getCurrentLoop = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("loops")
      .select("*")
      .eq("user_id", userId)
      .eq("is_current", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return { loop: null, error: error.message };
    return { loop: data, error: null as string | null };
  });
