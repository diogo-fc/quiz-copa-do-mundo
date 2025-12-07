-- ============================================
-- VERIFICAÇÃO 01: XP vs Game Sessions
-- Verifica se o XP do perfil corresponde à soma calculada das game_sessions
-- ============================================

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
    ) as xp_esperado,
    SUM(gs.score) as total_score,
    COUNT(*) as total_partidas
  FROM game_sessions gs
  WHERE gs.user_id IS NOT NULL
  GROUP BY gs.user_id
)
SELECT 
  p.name,
  p.email,
  p.xp as xp_atual,
  COALESCE(xc.xp_esperado, 0) as xp_esperado,
  p.xp - COALESCE(xc.xp_esperado, 0) as diferenca,
  COALESCE(xc.total_score, 0) as total_score,
  COALESCE(xc.total_partidas, 0) as total_partidas,
  CASE 
    WHEN p.xp = COALESCE(xc.xp_esperado, 0) THEN '✅ OK'
    WHEN p.xp > COALESCE(xc.xp_esperado, 0) THEN '⚠️ XP a mais'
    ELSE '❌ XP faltando'
  END as status
FROM profiles p
LEFT JOIN xp_calculado xc ON p.id = xc.user_id
WHERE p.xp > 0 OR xc.xp_esperado > 0
ORDER BY ABS(p.xp - COALESCE(xc.xp_esperado, 0)) DESC;
