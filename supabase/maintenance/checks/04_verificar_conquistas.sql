-- ============================================
-- VERIFICAÇÃO 04: Conquistas vs Condições
-- Verifica se usuários têm conquistas que deveriam ter
-- e se não têm conquistas que não deveriam ter
-- ============================================

-- Conquistas que usuários DEVERIAM ter mas NÃO têm
WITH conquistas_faltando AS (
  -- first_quiz: Tem ≥1 game_session
  SELECT p.id, p.name, 'first_quiz' as achievement_type, 'Tem partidas mas não tem conquista first_quiz' as motivo
  FROM profiles p
  WHERE EXISTS (SELECT 1 FROM game_sessions gs WHERE gs.user_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = p.id AND ua.achievement_type = 'first_quiz')

  UNION ALL

  -- level_10: level >= 10
  SELECT p.id, p.name, 'level_10', 'Nível 10+ mas não tem conquista level_10'
  FROM profiles p
  WHERE p.level >= 10
    AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = p.id AND ua.achievement_type = 'level_10')

  UNION ALL

  -- level_50: level >= 50
  SELECT p.id, p.name, 'level_50', 'Nível 50+ mas não tem conquista level_50'
  FROM profiles p
  WHERE p.level >= 50
    AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = p.id AND ua.achievement_type = 'level_50')

  UNION ALL

  -- level_100: level >= 100
  SELECT p.id, p.name, 'level_100', 'Nível 100+ mas não tem conquista level_100'
  FROM profiles p
  WHERE p.level >= 100
    AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = p.id AND ua.achievement_type = 'level_100')

  UNION ALL

  -- streak_7: streak_days >= 7
  SELECT p.id, p.name, 'streak_7', 'Streak 7+ mas não tem conquista streak_7'
  FROM profiles p
  WHERE p.streak_days >= 7
    AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = p.id AND ua.achievement_type = 'streak_7')

  UNION ALL

  -- streak_30: streak_days >= 30
  SELECT p.id, p.name, 'streak_30', 'Streak 30+ mas não tem conquista streak_30'
  FROM profiles p
  WHERE p.streak_days >= 30
    AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = p.id AND ua.achievement_type = 'streak_30')

  UNION ALL

  -- perfect_round: 15/15 no desafio
  SELECT DISTINCT p.id, p.name, 'perfect_round', 'Fez rodada perfeita mas não tem conquista'
  FROM profiles p
  JOIN game_sessions gs ON gs.user_id = p.id
  WHERE gs.mode = 'desafio' 
    AND gs.correct_answers = gs.total_questions 
    AND gs.total_questions >= 10
    AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = p.id AND ua.achievement_type = 'perfect_round')
)
SELECT '❌ FALTANDO' as tipo, name, achievement_type, motivo
FROM conquistas_faltando

UNION ALL

-- Conquistas duplicadas
SELECT '⚠️ DUPLICADA' as tipo, p.name, ua.achievement_type, 'Conquista duplicada' as motivo
FROM user_achievements ua
JOIN profiles p ON p.id = ua.user_id
GROUP BY p.name, ua.achievement_type, p.id
HAVING COUNT(*) > 1

ORDER BY tipo, name, achievement_type;
