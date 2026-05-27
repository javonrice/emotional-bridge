DROP POLICY "Anyone can join waitlist" ON public.ios_waitlist;

CREATE POLICY "Authenticated joins must use own id"
ON public.ios_waitlist
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anonymous joins must be anonymous"
ON public.ios_waitlist
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);