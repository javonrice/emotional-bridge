
-- 1. tts_cache
CREATE TABLE public.tts_cache (
  content_hash TEXT PRIMARY KEY,
  audio_path TEXT NOT NULL,
  chars INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  hit_count INTEGER NOT NULL DEFAULT 0
);
GRANT SELECT ON public.tts_cache TO authenticated;
GRANT ALL ON public.tts_cache TO service_role;
ALTER TABLE public.tts_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read cache" ON public.tts_cache FOR SELECT TO authenticated USING (true);

-- 2. tts_usage
CREATE TABLE public.tts_usage (
  user_id UUID NOT NULL,
  month DATE NOT NULL,
  chars_used INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, month)
);
GRANT SELECT ON public.tts_usage TO authenticated;
GRANT ALL ON public.tts_usage TO service_role;
ALTER TABLE public.tts_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own usage" ON public.tts_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 3. tts_global_usage
CREATE TABLE public.tts_global_usage (
  day DATE PRIMARY KEY,
  chars_used INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.tts_global_usage TO service_role;
ALTER TABLE public.tts_global_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view global usage" ON public.tts_global_usage FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('tts-cache', 'tts-cache', false)
ON CONFLICT (id) DO NOTHING;
-- No public select policy; signed URLs are issued by the server fn.
