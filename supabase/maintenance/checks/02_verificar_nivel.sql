-- ============================================
-- VERIFICAÇÃO 02: Nível vs XP
-- Verifica se o nível do usuário está correto para seu XP
-- Fórmula: XP necessário para nível N = FLOOR(100 * N^1.5)
-- ============================================

WITH nivel_calculado AS (
  SELECT 
    id,
    name,
    email,
    xp,
    level as nivel_atual,
    -- Calcula o nível correto baseado no XP
    (
      SELECT MAX(n) 
      FROM generate_series(1, 200) AS n 
      WHERE FLOOR(100 * POWER(n, 1.5)) <= p.xp
    ) as nivel_esperado
  FROM profiles p
  WHERE xp > 0
)
SELECT 
  name,
  email,
  xp,
  nivel_atual,
  COALESCE(nivel_esperado, 1) as nivel_esperado,
  nivel_atual - COALESCE(nivel_esperado, 1) as diferenca,
  CASE 
    WHEN nivel_atual = COALESCE(nivel_esperado, 1) THEN '✅ OK'
    WHEN nivel_atual > COALESCE(nivel_esperado, 1) THEN '⚠️ Nível alto demais'
    ELSE '❌ Nível baixo demais'
  END as status
FROM nivel_calculado
ORDER BY ABS(nivel_atual - COALESCE(nivel_esperado, 1)) DESC;
