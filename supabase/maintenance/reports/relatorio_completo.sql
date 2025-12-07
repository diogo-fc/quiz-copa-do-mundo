-- ============================================
-- RELATÓRIO COMPLETO DE CONSISTÊNCIA
-- Execute este script para uma visão geral do estado dos dados
-- ============================================

-- ============================================
-- 1. ESTATÍSTICAS GERAIS
-- ============================================
SELECT '📊 ESTATÍSTICAS GERAIS' as secao;

SELECT 
  (SELECT COUNT(*) FROM profiles) as total_usuarios,
  (SELECT COUNT(*) FROM profiles WHERE xp > 0) as usuarios_com_xp,
  (SELECT COUNT(*) FROM game_sessions) as total_partidas,
  (SELECT COUNT(*) FROM user_achievements) as total_conquistas,
  (SELECT COUNT(*) FROM duels) as total_duelos,
  (SELECT COUNT(*) FROM daily_completions) as total_quiz_diarios;

-- ============================================
-- 2. VERIFICAÇÃO DE XP
-- ============================================
SELECT '💰 VERIFICAÇÃO DE XP' as secao;

WITH xp_calculado AS (
  SELECT 
    gs.user_id,
    SUM(
      FLOOR(
        gs.score * 
        CASE gs.mode
          WHEN 'treino' THEN 0.5
          WHEN 'desafio' THEN 1.0
          WHEN 'diario' THEN 1.2
          WHEN 'duelo' THEN 1.5
          ELSE 1.0
        END * 0.1
      )
    ) as xp_esperado
  FROM game_sessions gs
  WHERE gs.user_id IS NOT NULL
  GROUP BY gs.user_id
)
SELECT 
  COUNT(*) FILTER (WHERE p.xp = COALESCE(xc.xp_esperado, 0)) as xp_correto,
  COUNT(*) FILTER (WHERE p.xp != COALESCE(xc.xp_esperado, 0)) as xp_incorreto,
  COUNT(*) as total_verificado
FROM profiles p
LEFT JOIN xp_calculado xc ON p.id = xc.user_id
WHERE p.xp > 0 OR xc.xp_esperado > 0;

-- ============================================
-- 3. VERIFICAÇÃO DE NÍVEL
-- ============================================
SELECT '📈 VERIFICAÇÃO DE NÍVEL' as secao;

WITH nivel_calculado AS (
  SELECT 
    id,
    level as nivel_atual,
    (
      SELECT COALESCE(MAX(n), 1)
      FROM generate_series(1, 200) AS n 
      WHERE FLOOR(100 * POWER(n, 1.5)) <= p.xp
    ) as nivel_esperado
  FROM profiles p
  WHERE xp > 0
)
SELECT 
  COUNT(*) FILTER (WHERE nivel_atual = nivel_esperado) as nivel_correto,
  COUNT(*) FILTER (WHERE nivel_atual != nivel_esperado) as nivel_incorreto,
  COUNT(*) as total_verificado
FROM nivel_calculado;

-- ============================================
-- 4. VERIFICAÇÃO DE STREAK
-- ============================================
SELECT '🔥 VERIFICAÇÃO DE STREAK' as secao;

SELECT 
  COUNT(*) FILTER (
    WHERE streak_days = 0 
    OR DATE(last_played_at AT TIME ZONE 'America/Sao_Paulo') >= CURRENT_DATE - 1
  ) as streak_valido,
  COUNT(*) FILTER (
    WHERE streak_days > 0 
    AND (last_played_at IS NULL OR DATE(last_played_at AT TIME ZONE 'America/Sao_Paulo') < CURRENT_DATE - 1)
  ) as streak_quebrado,
  COUNT(*) as total_verificado
FROM profiles
WHERE streak_days > 0 OR last_played_at IS NOT NULL;

-- ============================================
-- 5. CONQUISTAS FALTANDO
-- ============================================
SELECT '🏆 CONQUISTAS FALTANDO' as secao;

SELECT 
  (
    SELECT COUNT(DISTINCT p.id)
    FROM profiles p
    WHERE EXISTS (SELECT 1 FROM game_sessions gs WHERE gs.user_id = p.id)
      AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = p.id AND ua.achievement_type = 'first_quiz')
  ) as faltando_first_quiz,
  (
    SELECT COUNT(*)
    FROM profiles p
    WHERE p.level >= 10
      AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = p.id AND ua.achievement_type = 'level_10')
  ) as faltando_level_10;

-- ============================================
-- 6. RESUMO FINAL
-- ============================================
SELECT '✅ RESUMO FINAL' as secao;

WITH problemas AS (
  SELECT 
    (SELECT COUNT(*) FROM profiles p 
     LEFT JOIN (
       SELECT user_id, SUM(FLOOR(score * CASE mode WHEN 'treino' THEN 0.5 WHEN 'desafio' THEN 1.0 WHEN 'diario' THEN 1.2 WHEN 'duelo' THEN 1.5 ELSE 1.0 END * 0.1)) as xp_calc 
       FROM game_sessions GROUP BY user_id
     ) xc ON p.id = xc.user_id 
     WHERE p.xp != COALESCE(xc.xp_calc, 0) AND (p.xp > 0 OR xc.xp_calc > 0)
    ) as problemas_xp,
    (SELECT COUNT(*) FROM profiles WHERE streak_days > 0 
     AND (last_played_at IS NULL OR DATE(last_played_at AT TIME ZONE 'America/Sao_Paulo') < CURRENT_DATE - 1)
    ) as problemas_streak
)
SELECT 
  CASE WHEN problemas_xp = 0 AND problemas_streak = 0 
    THEN '✅ Todos os dados estão consistentes!' 
    ELSE '⚠️ Existem ' || (problemas_xp + problemas_streak) || ' problemas a corrigir'
  END as status_geral,
  problemas_xp as "Problemas de XP",
  problemas_streak as "Streaks quebrados"
FROM problemas;
