import { createHash } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Sarah
export const MODEL_ID = "eleven_turbo_v2_5";
export const OUTPUT_FORMAT = "mp3_22050_32";
export const BUCKET = "tts-cache";

export const LIMITS = {
  freeMonthly: Number(process.env.TTS_FREE_MONTHLY_CHARS ?? 5000),
  paidMonthly: Number(process.env.TTS_PAID_MONTHLY_CHARS ?? 50000),
  dailyCap: Number(process.env.TTS_DAILY_CHAR_CAP ?? 200000),
  maxPerRequest: Number(process.env.TTS_MAX_CHARS_PER_REQUEST ?? 800),
};

export function hashContent(text: string): string {
  return createHash("sha256")
    .update(`${VOICE_ID}|${MODEL_ID}|${text}`)
    .digest("hex");
}

export function monthStart(d = new Date()): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
}

export function dayStart(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export async function signCachedUrl(audioPath: string): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(audioPath, 60 * 60);
  if (error || !data) throw new Error(error?.message ?? "sign failed");
  return data.signedUrl;
}

export async function synthesizeElevenLabs(text: string): Promise<ArrayBuffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY not configured");

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=${OUTPUT_FORMAT}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs ${res.status}: ${err.slice(0, 200)}`);
  }
  return res.arrayBuffer();
}
