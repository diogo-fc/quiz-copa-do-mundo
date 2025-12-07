-- ============================================
-- FIX 04: Sincronizar Conquistas
-- ⚠️ CUIDADO: Este script altera dados!
-- Adiciona conquistas que usuários deveriam ter
-- ============================================

-- Primeiro, visualize o que será adicionado (DRY RUN)
WITH conquistas_faltando AS (
  -- first_quiz
  SELECT p.id as user_id, 'first_quiz' as achievement_type
  FROM profiles p
  WHERE EXISTS (SELECT 1 FROM game_sessions gs WHERE gs.user_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = p.id AND ua.achievement_type = 'first_quiz')

  UNION ALL

  -- level_10
  SELECT p.id, 'level_10'
  FROM profiles p
  WHERE p.level >= 10
    AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = p.id AND ua.achievement_type = 'level_10')

  UNION ALL

  -- level_50
  SELECT p.id, 'level_50'
  FROM profiles p
  WHERE p.level >= 50
    AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = p.id AND ua.achievement_type = 'level_50')

  UNION ALL

  -- level_100
  SELECT p.id, 'level_100'
  FROM profiles p
  WHERE p.level >= 100
    AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = p.id AND ua.achievement_type = 'level_100')

  UNION ALL

  -- streak_7
  SELECT p.id, 'streak_7'
  FROM profiles p
  WHERE p.streak_days >= 7
    AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = p.id AND ua.achievement_type = 'streak_7')

  UNION ALL

  -- streak_30
  SELECT p.id, 'streak_30'
  FROM profiles p
  WHERE p.streak_days >= 30
    AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = p.id AND ua.achievement_type = 'streak_30')

  UNION ALL

  -- perfect_round
  SELECT DISTINCT p.id, 'perfect_round'
  FROM profiles p
  JOIN game_sessions gs ON gs.user_id = p.id
  WHERE gs.mode = 'desafio' 
    AND gs.correct_answers = gs.total_questions 
    AND gs.total_questions >= 10
    AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = p.id AND ua.achievement_type = 'perfect_round')
)
SELECT 
  p.name,
  cf.achievement_type,
  'Será adicionada' as acao
FROM conquistas_faltando cf
JOIN profiles p ON p.id = cf.user_id;

-- ============================================
-- DESCOMENTE ABAIXO PARA EXECUTAR A CORREÇÃO
-- ============================================

/*
WITH conquistas_faltando AS (
  -- first_quiz
  SELECT p.id as user_id, 'first_quiz' as achievement_type
  FROM profiles p
  WHERE EXISTS (SELECT 1 FROM game_sessions gs WHERE gs.user_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = p.id AND ua.achievement_type = 'first_quiz')

  UNION ALL

  -- level_10
  SELECT p.id, 'level_10'
  FROM profiles p
  WHERE p.level >= 10
    AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = p.id AND ua.achievement_type = 'level_10')

  UNION ALL

  -- level_50
  SELECT p.id, 'level_50'
  FROM profiles p
  WHERE p.level >= 50
    AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = p.id AND ua.achievement_type = 'level_50')

  UNION ALL

  -- level_100
  SELECT p.id, 'level_100'
  FROM profiles p
  WHERE p.level >= 100
    AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = p.id AND ua.achievement_type = 'level_100')

  UNION ALL

  -- streak_7
  SELECT p.id, 'streak_7'
  FROM profiles p
  WHERE p.streak_days >= 7
    AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = p.id AND ua.achievement_type = 'streak_7')

  UNION ALL

  -- streak_30
  SELECT p.id, 'streak_30'
  FROM profiles p
  WHERE p.streak_days >= 30
    AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = p.id AND ua.achievement_type = 'streak_30')

  UNION ALL

  -- perfect_round
  SELECT DISTINCT p.id, 'perfect_round'
  FROM profiles p
  JOIN game_sessions gs ON gs.user_id = p.id
  WHERE gs.mode = 'desafio' 
    AND gs.correct_answers = gs.total_questions 
    AND gs.total_questions >= 10
    AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = p.id AND ua.achievement_type = 'perfect_round')
)
INSERT INTO user_achievements (user_id, achievement_type, unlocked_at)
SELECT user_id, achievement_type, NOW()
FROM conquistas_faltando
ON CONFLICT (user_id, achievement_type) DO NOTHING;
*/
