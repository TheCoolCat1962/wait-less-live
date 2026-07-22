CREATE TABLE public.reputation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  points INTEGER NOT NULL DEFAULT 0,
  rank TEXT NOT NULL DEFAULT 'New Reporter',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reputation TO anon, authenticated;
GRANT ALL ON public.reputation TO service_role;
ALTER TABLE public.reputation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reputation is publicly readable" ON public.reputation FOR SELECT USING (true);
CREATE POLICY "Users can view own reputation" ON public.reputation FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.badges (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  points_reward INTEGER NOT NULL DEFAULT 50,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.badges TO anon, authenticated;
GRANT ALL ON public.badges TO service_role;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badges are publicly readable" ON public.badges FOR SELECT USING (true);

CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);
GRANT SELECT ON public.user_badges TO anon, authenticated;
GRANT ALL ON public.user_badges TO service_role;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User badges are publicly readable" ON public.user_badges FOR SELECT USING (true);

-- Insert initial badges
INSERT INTO public.badges (id, name, description, icon, points_reward, requirement_type, requirement_value) VALUES
('early_bird', 'Early Bird', 'Submit a report before 8 AM', 'Zap', 50, 'time_before', 8),
('night_owl', 'Night Owl', 'Submit a report after 10 PM', 'Star', 50, 'time_after', 22),
('streaker', '7-Day Streak', 'Report for 7 consecutive days', 'Target', 100, 'streak', 7),
('century', 'Century Club', 'Submit 100 reports', 'Award', 500, 'total_reports', 100),
('accuracy_master', 'Accuracy Master', 'Achieve 95% verification rate', 'Shield', 200, 'accuracy', 95),
('local_expert', 'Local Expert', 'Report at 25 unique businesses', 'MapPin', 150, 'unique_businesses', 25),
('verifier', 'Community Verifier', 'Help verify 50 reports', 'Users', 150, 'verifications', 50),
('streak_master', 'Streak Master', 'Maintain a 30-day streak', 'TrendingUp', 500, 'streak', 30);
