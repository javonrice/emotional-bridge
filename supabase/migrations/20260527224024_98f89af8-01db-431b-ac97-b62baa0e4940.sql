CREATE TABLE public.monthly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  period_end date NOT NULL,
  the_number integer NOT NULL DEFAULT 0,
  most_loud text,
  pattern text,
  top_gateway text,
  the_shift text,
  model text,
  prompt_version text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, period_end)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.monthly_reports TO authenticated;
GRANT ALL ON public.monthly_reports TO service_role;

ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own monthly reports"
ON public.monthly_reports
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all monthly reports"
ON public.monthly_reports
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_monthly_reports_user_period ON public.monthly_reports (user_id, period_end DESC);
