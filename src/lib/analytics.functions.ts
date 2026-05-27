import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const EventSchema = z.object({
  name: z.string().min(1).max(80).regex(/^[a-z0-9_.:-]+$/i),
  props: z.record(z.string().max(80), z.any()).optional().nullable(),
  path: z.string().max(255).optional().nullable(),
  session_id: z.string().max(80).optional().nullable(),
  user_id: z.string().uuid().optional().nullable(),
});

// Server-side validator; accepts anonymous events (user_id may be null).
export const recordEvent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => EventSchema.parse(input))
  .handler(async ({ data }) => {
    // Use the publicly-policy-protected anon client via RLS — but here we want server insert.
    // Simpler: insert via the user's own session by calling from client. This serverFn is a no-op
    // shim for symmetry; real insert happens client-side through supabase-js below.
    return { ok: true, accepted: data.name };
  });

// Client-side fire-and-forget tracker. RLS allows: anon insert when user_id is null,
// auth insert when user_id matches auth.uid().
const SESSION_KEY = "loop:sid";
function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let sid = localStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)) as string;
    localStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

export async function track(name: string, props: Record<string, unknown> = {}): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id ?? null;
    await supabase.from("events").insert({
      name,
      props: props as never,
      path: window.location.pathname,
      session_id: getSessionId(),
      user_id: userId,
    });
  } catch {
    // analytics must never break the app
  }
}
