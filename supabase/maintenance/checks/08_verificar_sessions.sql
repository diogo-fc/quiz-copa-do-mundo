-- ============================================
-- VERIFICAÇÃO 08: Game Sessions Problemáticas
-- Verifica game_sessions com dados inconsistentes
-- ============================================

SELECT 
  gs.id as session_id,
  p.name,
  gs.mode,
  gs.score,
  gs.correct_answers,
  gs.total_questions,
  gs.completed_at,
  CASE 
    WHEN gs.score = 0 AND gs.correct_answers > 0 
      THEN '❌ Score 0 com acertos'
    WHEN gs.correct_answers > gs.total_questions 
      THEN '❌ Acertos > Total de questões'
    WHEN gs.total_questions = 0 
      THEN '⚠️ Sem questões'
    WHEN gs.user_id IS NULL 
      THEN '⚠️ Sessão sem usuário'
    WHEN gs.mode NOT IN ('treino', 'desafio', 'diario', 'duelo') 
      THEN '❌ Modo inválido'
    ELSE '✅ OK'
  END as status
FROM game_sessions gs
LEFT JOIN profiles p ON gs.user_id = p.id
WHERE 
  (gs.score = 0 AND gs.correct_answers > 0)
  OR gs.correct_answers > gs.total_questions
  OR gs.total_questions = 0
  OR gs.user_id IS NULL
  OR gs.mode NOT IN ('treino', 'desafio', 'diario', 'duelo')
ORDER BY gs.completed_at DESC;

-- Estatísticas de game sessions
SELECT 
  mode,
  COUNT(*) as total_sessions,
  AVG(score) as score_medio,
  AVG(correct_answers::float / NULLIF(total_questions, 0) * 100) as accuracy_media
FROM game_sessions
GROUP BY mode
ORDER BY total_sessions DESC;
