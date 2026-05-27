
-- user_roles: explicitly deny INSERT/UPDATE/DELETE to authenticated; only service_role may write
CREATE POLICY "Only service role inserts roles"
ON public.user_roles FOR INSERT TO service_role
WITH CHECK (true);

CREATE POLICY "Only service role updates roles"
ON public.user_roles FOR UPDATE TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Only service role deletes roles"
ON public.user_roles FOR DELETE TO service_role
USING (true);

-- account_deletions: allow user to insert own record; only service_role may delete
CREATE POLICY "Users insert own deletion record"
ON public.account_deletions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role inserts deletions"
ON public.account_deletions FOR INSERT TO service_role
WITH CHECK (true);

CREATE POLICY "Service role deletes deletions"
ON public.account_deletions FOR DELETE TO service_role
USING (true);
