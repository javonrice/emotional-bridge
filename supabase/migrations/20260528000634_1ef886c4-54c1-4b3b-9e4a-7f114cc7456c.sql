-- Stripe webhook idempotency
CREATE TABLE IF NOT EXISTS public.stripe_events (
  event_id text PRIMARY KEY,
  type text NOT NULL,
  environment text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.stripe_events TO service_role;
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages stripe_events"
  ON public.stripe_events FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Dedup waitlist by email (case-insensitive)
DELETE FROM public.ios_waitlist a
  USING public.ios_waitlist b
  WHERE a.ctid < b.ctid
    AND lower(a.email) = lower(b.email);
CREATE UNIQUE INDEX IF NOT EXISTS ios_waitlist_email_lower_uniq
  ON public.ios_waitlist (lower(email));