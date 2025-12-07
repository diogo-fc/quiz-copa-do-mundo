-- ============================================
-- VERIFICAÇÃO 05: Quiz Diário Duplicado
-- Verifica se há mais de uma conclusão do quiz diário no mesmo dia
-- ============================================

SELECT 
  p.name,
  p.email,
  dc.quiz_date,
  COUNT(*) as vezes_completado,
  SUM(dc.score) as score_total,
  CASE 
    WHEN COUNT(*) > 1 THEN '❌ Duplicado'
    ELSE '✅ OK'
  END as status
FROM daily_completions dc
JOIN profiles p ON p.id = dc.user_id
GROUP BY p.name, p.email, dc.quiz_date
HAVING COUNT(*) > 1
ORDER BY dc.quiz_date DESC, p.name;

-- Se não retornar nenhum resultado, significa que está tudo OK!
