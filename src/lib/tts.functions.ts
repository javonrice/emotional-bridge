import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  BUCKET,
  LIMITS,
  dayStart,
  hashContent,
  monthStart,
  signCachedUrl,
  synthesizeElevenLabs,
} from "./tts.server";

export const synthesizeDebrief = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ debriefId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // 1. Load the debrief (RLS scoped to user)
    const { data: debrief, error: dbErr } = await supabase
      .from("debriefs")
      .select("id, pattern, reframe, micro_action")
      .eq("id", data.debriefId)
      .maybeSingle();
    if (dbErr) throw new Error(dbErr.message);
    if (!debrief) return { error: "not_found" as const };

    const text = [
      debrief.pattern && `Pattern. ${debrief.pattern}.`,
      debrief.reframe && `Reframe. ${debrief.reframe}.`,
      debrief.micro_action && `Try next time. ${debrief.micro_action}.`,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (!text) return { error: "empty" as const };
    if (text.length > LIMITS.maxPerRequest) {
      return { error: "too_long" as const };
    }

    // 2. Cache lookup
    const hash = hashContent(text);
    const { data: cached } = await supabaseAdmin
      .from("tts_cache")
      .select("audio_path")
      .eq("content_hash", hash)
      .maybeSingle();

    if (cached?.audio_path) {
      await supabaseAdmin
        .from("tts_cache")
        .update({
          last_used_at: new Date().toISOString(),
          hit_count: ((cached as any).hit_count ?? 0) + 1,
        })
        .eq("content_hash", hash);
      const url = await signCachedUrl(cached.audio_path);
      return { audioUrl: url, cached: true as const };
    }

    // 3. Global daily cap
    const today = dayStart();
    const { data: global } = await supabaseAdmin
      .from("tts_global_usage")
      .select("chars_used")
      .eq("day", today)
      .maybeSingle();
    const globalUsed = global?.chars_used ?? 0;
    if (globalUsed + text.length > LIMITS.dailyCap) {
      return { error: "tts_unavailable" as const };
    }

    // 4. Per-user monthly quota
    const month = monthStart();
    const { data: usage } = await supabaseAdmin
      .from("tts_usage")
      .select("chars_used")
      .eq("user_id", userId)
      .eq("month", month)
      .maybeSingle();
    const userUsed = usage?.chars_used ?? 0;

    const { data: isPaid } = await supabaseAdmin.rpc("has_active_subscription", {
      user_uuid: userId,
      check_env: "live",
    });
    const monthlyCap = isPaid ? LIMITS.paidMonthly : LIMITS.freeMonthly;

    if (userUsed + text.length > monthlyCap) {
      return {
        error: "quota_exceeded" as const,
        remainingChars: Math.max(0, monthlyCap - userUsed),
        isPaid: !!isPaid,
      };
    }

    // 5. Synthesize
    const audio = await synthesizeElevenLabs(text);
    const audioPath = `${hash}.mp3`;

    const { error: upErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(audioPath, new Uint8Array(audio), {
        contentType: "audio/mpeg",
        upsert: true,
      });
    if (upErr) throw new Error(`upload: ${upErr.message}`);

    // 6. Persist cache + usage (best-effort; failures don't block playback)
    await Promise.all([
      supabaseAdmin.from("tts_cache").upsert({
        content_hash: hash,
        audio_path: audioPath,
        chars: text.length,
        last_used_at: new Date().toISOString(),
      }),
      supabaseAdmin.from("tts_usage").upsert(
        {
          user_id: userId,
          month,
          chars_used: userUsed + text.length,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,month" },
      ),
      supabaseAdmin.from("tts_global_usage").upsert(
        {
          day: today,
          chars_used: globalUsed + text.length,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "day" },
      ),
    ]);

    const url = await signCachedUrl(audioPath);
    return {
      audioUrl: url,
      cached: false as const,
      remainingChars: Math.max(0, monthlyCap - userUsed - text.length),
    };
  });
