CREATE TABLE public.ios_waitlist (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NULL,
  email text NOT NULL,
  source text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.ios_waitlist TO authenticated;
GRANT INSERT ON public.ios_waitlist TO anon;
GRANT ALL ON public.ios_waitlist TO service_role;

ALTER TABLE public.ios_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist"
ON public.ios_waitlist
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Users view own waitlist entries"
ON public.ios_waitlist
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all waitlist entries"
ON public.ios_waitlist
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX ios_waitlist_email_idx ON public.ios_waitlist (email);
CREATE INDEX ios_waitlist_created_at_idx ON public.ios_waitlist (created_at DESC);