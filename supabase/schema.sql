-- ============================================
-- Copa Quiz Battle - Database Schema
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  favorite_team TEXT,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak_days INTEGER DEFAULT 0,
  last_played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- QUESTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  options JSONB NOT NULL, -- ["opção A", "opção B", "opção C", "opção D"]
  correct_answer INTEGER NOT NULL CHECK (correct_answer >= 0 AND correct_answer <= 3),
  category TEXT NOT NULL CHECK (category IN ('selecoes', 'finais', 'artilheiros', 'curiosidades', 'copa2026')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('facil', 'medio', 'dificil')),
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GAME SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('treino', 'desafio', 'duelo', 'diario')),
  score INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  time_spent INTEGER, -- segundos
  category TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_type)
);

-- ============================================
-- DUELS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.duels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenger_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  opponent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  question_ids JSONB NOT NULL, -- array de UUIDs das perguntas
  challenger_score INTEGER,
  opponent_score INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- DAILY QUIZ COMPLETIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.daily_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_date DATE NOT NULL,
  score INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, quiz_date)
);

-- ============================================
-- RANKINGS TABLE (updated by function/cron)
-- ============================================
CREATE TABLE IF NOT EXISTS public.rankings (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly', 'alltime')),
  score INTEGER DEFAULT 0,
  position INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, period)
);

-- ============================================
-- FRIENDSHIPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- ============================================
-- ACTIVITY FEED TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('quiz_completed', 'achievement_unlocked', 'level_up', 'duel_won', 'streak_milestone')),
  data JSONB DEFAULT '{}', -- { score, mode, achievement_id, new_level, streak_days, etc }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PUSH SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  keys JSONB NOT NULL, -- { p256dh, auth }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_questions_category ON public.questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON public.game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_mode ON public.game_sessions(mode);
CREATE INDEX IF NOT EXISTS idx_rankings_period_position ON public.rankings(period, position);
CREATE INDEX IF NOT EXISTS idx_daily_completions_date ON public.daily_completions(quiz_date);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id ON public.activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON public.activity_feed(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, but only update their own
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Questions: everyone can read
DROP POLICY IF EXISTS "Questions are viewable by everyone" ON public.questions;
CREATE POLICY "Questions are viewable by everyone" ON public.questions
  FOR SELECT USING (true);

-- Game Sessions: users can read all, insert/update their own
DROP POLICY IF EXISTS "Game sessions are viewable by everyone" ON public.game_sessions;
CREATE POLICY "Game sessions are viewable by everyone" ON public.game_sessions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own game sessions" ON public.game_sessions;
CREATE POLICY "Users can insert their own game sessions" ON public.game_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Achievements: users can read all, insert their own
DROP POLICY IF EXISTS "Achievements are viewable by everyone" ON public.user_achievements;
CREATE POLICY "Achievements are viewable by everyone" ON public.user_achievements
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own achievements" ON public.user_achievements;
CREATE POLICY "Users can insert their own achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Duels: readable by participants, insertable by authenticated users
DROP POLICY IF EXISTS "Duels are viewable by participants" ON public.duels;
CREATE POLICY "Duels are viewable by participants" ON public.duels
  FOR SELECT USING (auth.uid() = challenger_id OR auth.uid() = opponent_id OR status = 'pending');

DROP POLICY IF EXISTS "Authenticated users can create duels" ON public.duels;
CREATE POLICY "Authenticated users can create duels" ON public.duels
  FOR INSERT WITH CHECK (auth.uid() = challenger_id);

DROP POLICY IF EXISTS "Participants can update duels" ON public.duels;
CREATE POLICY "Participants can update duels" ON public.duels
  FOR UPDATE USING (
    auth.uid() = challenger_id 
    OR auth.uid() = opponent_id 
    OR (status = 'pending' AND opponent_id IS NULL)  -- Permite que qualquer usuário entre em duelos pendentes
  );

-- Daily Completions: users can read/insert their own
DROP POLICY IF EXISTS "Users can view their own daily completions" ON public.daily_completions;
CREATE POLICY "Users can view their own daily completions" ON public.daily_completions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own daily completions" ON public.daily_completions;
CREATE POLICY "Users can insert their own daily completions" ON public.daily_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Rankings: everyone can read
DROP POLICY IF EXISTS "Rankings are viewable by everyone" ON public.rankings;
CREATE POLICY "Rankings are viewable by everyone" ON public.rankings
  FOR SELECT USING (true);

-- Friendships: users can manage their own friendships
DROP POLICY IF EXISTS "Users can view their friendships" ON public.friendships;
CREATE POLICY "Users can view their friendships" ON public.friendships
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Users can create friendships" ON public.friendships;
CREATE POLICY "Users can create friendships" ON public.friendships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their friendships" ON public.friendships;
CREATE POLICY "Users can delete their friendships" ON public.friendships
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Users can update their friendships" ON public.friendships;
CREATE POLICY "Users can update their friendships" ON public.friendships
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Activity Feed: everyone can read, users insert their own
DROP POLICY IF EXISTS "Activity feed is viewable by everyone" ON public.activity_feed;
CREATE POLICY "Activity feed is viewable by everyone" ON public.activity_feed
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own activities" ON public.activity_feed;
CREATE POLICY "Users can insert their own activities" ON public.activity_feed
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Push Subscriptions: users can manage their own
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can view their own subscriptions" ON public.push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can insert their own subscriptions" ON public.push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can update their own subscriptions" ON public.push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can delete their own subscriptions" ON public.push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update user XP and level
CREATE OR REPLACE FUNCTION public.add_user_xp(user_uuid UUID, xp_amount INTEGER)
RETURNS void AS $$
DECLARE
  new_xp INTEGER;
  new_level INTEGER;
BEGIN
  -- Get current XP and add new amount
  SELECT xp + xp_amount INTO new_xp FROM public.profiles WHERE id = user_uuid;
  
  -- Calculate new level (100 * level^1.5 formula)
  new_level := 1;
  WHILE (100 * POWER(new_level + 1, 1.5)) <= new_xp LOOP
    new_level := new_level + 1;
  END LOOP;
  
  -- Update profile
  UPDATE public.profiles
  SET xp = new_xp, level = new_level, updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get random questions
CREATE OR REPLACE FUNCTION public.get_random_questions(
  category_filter TEXT DEFAULT NULL,
  difficulty_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 10
)
RETURNS SETOF public.questions AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.questions
  WHERE (category_filter IS NULL OR category = category_filter)
    AND (difficulty_filter IS NULL OR difficulty = difficulty_filter)
  ORDER BY RANDOM()
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- END OF SCHEMA
-- ============================================
