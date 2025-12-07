-- ============================================
-- VERIFICAÇÃO 06: Duelos Órfãos
-- Verifica duelos com status inconsistente ou problemas
-- ============================================

SELECT 
  d.id as duel_id,
  d.status,
  p1.name as challenger,
  p2.name as opponent,
  d.challenger_score,
  d.opponent_score,
  d.created_at,
  d.completed_at,
  CASE 
    -- Duelo completado sem scores
    WHEN d.status = 'completed' AND (d.challenger_score IS NULL OR d.opponent_score IS NULL)
      THEN '❌ Completado sem ambos os scores'
    -- Duelo ativo há mais de 24h
    WHEN d.status = 'active' AND d.created_at < NOW() - INTERVAL '24 hours'
      THEN '⚠️ Ativo há mais de 24h'
    -- Duelo pending há mais de 7 dias
    WHEN d.status = 'pending' AND d.created_at < NOW() - INTERVAL '7 days'
      THEN '⚠️ Pendente há mais de 7 dias'
    -- Challenger inexistente
    WHEN p1.id IS NULL
      THEN '❌ Challenger inexistente'
    -- Completado mas completed_at é NULL
    WHEN d.status = 'completed' AND d.completed_at IS NULL
      THEN '⚠️ Completado sem data de conclusão'
    ELSE '✅ OK'
  END as status_check
FROM duels d
LEFT JOIN profiles p1 ON d.challenger_id = p1.id
LEFT JOIN profiles p2 ON d.opponent_id = p2.id
WHERE 
  -- Filtrar apenas problemas
  (d.status = 'completed' AND (d.challenger_score IS NULL OR d.opponent_score IS NULL))
  OR (d.status = 'active' AND d.created_at < NOW() - INTERVAL '24 hours')
  OR (d.status = 'pending' AND d.created_at < NOW() - INTERVAL '7 days')
  OR p1.id IS NULL
  OR (d.status = 'completed' AND d.completed_at IS NULL)
ORDER BY d.created_at DESC;

-- Se não retornar nenhum resultado, significa que está tudo OK!
