
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile + default user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ONBOARDING ANSWERS
CREATE TABLE public.onboarding_answers (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  age TEXT,
  duration TEXT,
  control INT,
  apps JSONB DEFAULT '[]'::jsonb,
  timing TEXT,
  feeling TEXT,
  story TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_answers TO authenticated;
GRANT ALL ON public.onboarding_answers TO service_role;
ALTER TABLE public.onboarding_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own answers" ON public.onboarding_answers FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- LOOPS (AI-generated)
CREATE TABLE public.loops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  trigger_chain JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary TEXT NOT NULL,
  model TEXT,
  prompt_version TEXT,
  answers_snapshot JSONB,
  is_current BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_loops_user_current ON public.loops(user_id, is_current);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loops TO authenticated;
GRANT ALL ON public.loops TO service_role;
ALTER TABLE public.loops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own loops" ON public.loops FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own loops" ON public.loops FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own loops" ON public.loops FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all loops" ON public.loops FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- CHECKINS
CREATE TABLE public.checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  energy TEXT NOT NULL,
  emotion TEXT NOT NULL,
  activity TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_checkins_user_date ON public.checkins(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checkins TO authenticated;
GRANT ALL ON public.checkins TO service_role;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own checkins" ON public.checkins FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DEBRIEFS (AI-generated reframe)
CREATE TABLE public.debriefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  input_text TEXT NOT NULL,
  pattern TEXT,
  reframe TEXT,
  micro_action TEXT,
  model TEXT,
  prompt_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_debriefs_user_date ON public.debriefs(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.debriefs TO authenticated;
GRANT ALL ON public.debriefs TO service_role;
ALTER TABLE public.debriefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own debriefs" ON public.debriefs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all debriefs" ON public.debriefs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- AI FEEDBACK (thumbs up/down on outputs)
CREATE TYPE public.ai_surface AS ENUM ('loop_card', 'debrief_card', 'monthly_report');
CREATE TYPE public.ai_rating AS ENUM ('up', 'down');
CREATE TYPE public.ai_feedback_reason AS ENUM ('generic', 'inaccurate', 'tone_off', 'too_long', 'other');

CREATE TABLE public.ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  surface public.ai_surface NOT NULL,
  source_id UUID NOT NULL,
  rating public.ai_rating NOT NULL,
  reason public.ai_feedback_reason,
  comment TEXT,
  model TEXT,
  prompt_version TEXT,
  answers_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_feedback_surface_version ON public.ai_feedback(surface, prompt_version, created_at DESC);
GRANT SELECT, INSERT ON public.ai_feedback TO authenticated;
GRANT ALL ON public.ai_feedback TO service_role;
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own feedback" ON public.ai_feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own feedback" ON public.ai_feedback FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all feedback" ON public.ai_feedback FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- SUBSCRIPTIONS
CREATE TABLE public.subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT,
  status TEXT NOT NULL DEFAULT 'inactive',
  trial_end TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own subscription" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
