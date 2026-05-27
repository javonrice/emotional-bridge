import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// GDPR data export: returns all of the user's rows as a serializable JSON blob.
export const exportUserData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [profile, answers, checkins, debriefs, loops, feedback, subscription, waitlist] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("onboarding_answers").select("*").eq("user_id", userId),
      supabase.from("checkins").select("*").eq("user_id", userId),
      supabase.from("debriefs").select("*").eq("user_id", userId),
      supabase.from("loops").select("*").eq("user_id", userId),
      supabase.from("ai_feedback").select("*").eq("user_id", userId),
      supabase.from("subscriptions").select("*").eq("user_id", userId),
      supabase.from("ios_waitlist").select("*").eq("user_id", userId),
    ]);
    return {
      exported_at: new Date().toISOString(),
      user_id: userId,
      profile: profile.data ?? null,
      onboarding_answers: answers.data ?? [],
      checkins: checkins.data ?? [],
      debriefs: debriefs.data ?? [],
      loops: loops.data ?? [],
      ai_feedback: feedback.data ?? [],
      subscriptions: subscription.data ?? [],
      ios_waitlist: waitlist.data ?? [],
    };
  });

// GDPR account deletion. Removes all user-owned rows, logs the deletion, then deletes the auth user.
export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;

    // Capture email for the audit log before deleting the auth user.
    const { data: userRow } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = userRow?.user?.email ?? null;

    // Delete user-owned data (service role bypasses RLS; user_roles + subscriptions cascade conceptually).
    const tables = [
      "ai_feedback",
      "debriefs",
      "checkins",
      "loops",
      "onboarding_answers",
      "ios_waitlist",
      "subscriptions",
      "user_roles",
      "profiles",
    ] as const;
    for (const t of tables) {
      // profiles uses `id` instead of `user_id`
      const col = t === "profiles" ? "id" : "user_id";
      await supabaseAdmin.from(t).delete().eq(col, userId);
    }

    await supabaseAdmin.from("account_deletions").insert({ user_id: userId, email, reason: "user_request" });

    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (delErr) return { ok: false, error: delErr.message };
    return { ok: true, error: null as string | null };
  });
