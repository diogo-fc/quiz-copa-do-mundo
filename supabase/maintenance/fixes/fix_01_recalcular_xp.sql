-- ============================================
-- FIX 01: Recalcular XP de Todos os Usuários
-- ⚠️ CUIDADO: Este script altera dados!
-- ============================================

-- Primeiro, visualize o que será alterado (DRY RUN)
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
    ) as xp_correto
  FROM game_sessions gs
  WHERE gs.user_id IS NOT NULL
  GROUP BY gs.user_id
)
SELECT 
  p.name,
  p.xp as xp_atual,
  COALESCE(xc.xp_correto, 0) as xp_novo,
  p.xp - COALESCE(xc.xp_correto, 0) as diferenca
FROM profiles p
LEFT JOIN xp_calculado xc ON p.id = xc.user_id
WHERE p.xp != COALESCE(xc.xp_correto, 0);

-- ============================================
-- DESCOMENTE ABAIXO PARA EXECUTAR A CORREÇÃO
-- ============================================

/*
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
    ) as xp_correto
  FROM game_sessions gs
  WHERE gs.user_id IS NOT NULL
  GROUP BY gs.user_id
)
UPDATE profiles p
SET 
  xp = COALESCE(xc.xp_correto, 0),
  updated_at = NOW()
FROM xp_calculado xc
WHERE p.id = xc.user_id
  AND p.xp != xc.xp_correto;
*/
