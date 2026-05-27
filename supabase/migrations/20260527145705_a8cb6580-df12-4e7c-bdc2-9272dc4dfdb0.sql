
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  session_id text,
  name text NOT NULL,
  props jsonb NOT NULL DEFAULT '{}'::jsonb,
  path text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_events_name_created ON public.events (name, created_at DESC);
CREATE INDEX idx_events_user_created ON public.events (user_id, created_at DESC);

GRANT INSERT ON public.events TO anon;
GRANT INSERT, SELECT ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon insert anonymous events"
  ON public.events FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Auth insert own events"
  ON public.events FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users view own events"
  ON public.events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all events"
  ON public.events FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Account deletion log so admins can audit deletions
CREATE TABLE public.account_deletions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  email text,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT ALL ON public.account_deletions TO service_role;
ALTER TABLE public.account_deletions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view deletions"
  ON public.account_deletions FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
