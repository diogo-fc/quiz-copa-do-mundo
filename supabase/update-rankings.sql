-- ============================================
-- Copa Quiz Battle - Ranking Update Functions
-- Execute no Supabase SQL Editor
-- ============================================

-- Function to update rankings for all periods
CREATE OR REPLACE FUNCTION public.update_rankings()
RETURNS void AS $$
DECLARE
  current_week_start DATE;
  current_month_start DATE;
BEGIN
  -- Calculate period start dates
  current_week_start := date_trunc('week', CURRENT_DATE)::DATE;
  current_month_start := date_trunc('month', CURRENT_DATE)::DATE;

  -- Clear existing rankings
  DELETE FROM public.rankings;

  -- Insert weekly rankings (games from this week)
  INSERT INTO public.rankings (user_id, period, score, position, updated_at)
  SELECT 
    user_id,
    'weekly'::TEXT,
    COALESCE(SUM(score), 0) as total_score,
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(score), 0) DESC) as position,
    NOW()
  FROM public.game_sessions
  WHERE completed_at >= current_week_start
    AND user_id IS NOT NULL
  GROUP BY user_id
  ORDER BY total_score DESC
  LIMIT 100;

  -- Insert monthly rankings (games from this month)
  INSERT INTO public.rankings (user_id, period, score, position, updated_at)
  SELECT 
    user_id,
    'monthly'::TEXT,
    COALESCE(SUM(score), 0) as total_score,
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(score), 0) DESC) as position,
    NOW()
  FROM public.game_sessions
  WHERE completed_at >= current_month_start
    AND user_id IS NOT NULL
  GROUP BY user_id
  ORDER BY total_score DESC
  LIMIT 100;

  -- Insert all-time rankings (total XP from profiles)
  INSERT INTO public.rankings (user_id, period, score, position, updated_at)
  SELECT 
    id as user_id,
    'alltime'::TEXT,
    xp as total_score,
    ROW_NUMBER() OVER (ORDER BY xp DESC) as position,
    NOW()
  FROM public.profiles
  WHERE xp > 0
  ORDER BY xp DESC
  LIMIT 100;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_rankings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_rankings() TO anon;

-- ============================================
-- CRON JOB (usando pg_cron no Supabase)
-- Nota: pg_cron precisa ser habilitado no dashboard
-- ============================================

-- Para habilitar pg_cron:
-- 1. Vá para Settings > Database > Extensions
-- 2. Procure por "pg_cron" e ative

-- Depois de ativar, execute:
-- SELECT cron.schedule(
--   'update-rankings-hourly',   -- nome do job
--   '0 * * * *',                -- a cada hora (minuto 0)
--   'SELECT public.update_rankings()'
-- );

-- Para ver jobs agendados:
-- SELECT * FROM cron.job;

-- Para remover um job:
-- SELECT cron.unschedule('update-rankings-hourly');

-- ============================================
-- ALTERNATIVA: Edge Function (Deno)
-- Crie um arquivo em supabase/functions/update-rankings/index.ts
-- e configure um webhook ou cron externo para chamá-lo
-- ============================================

-- ============================================
-- Executar manualmente para popular rankings iniciais
-- ============================================
SELECT public.update_rankings();
