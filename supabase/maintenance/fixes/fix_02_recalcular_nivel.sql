-- ============================================
-- FIX 02: Recalcular Níveis de Todos os Usuários
-- ⚠️ CUIDADO: Este script altera dados!
-- Fórmula: XP necessário para nível N = FLOOR(100 * N^1.5)
-- ============================================

-- Primeiro, visualize o que será alterado (DRY RUN)
WITH nivel_calculado AS (
  SELECT 
    id,
    name,
    xp,
    level as nivel_atual,
    (
      SELECT COALESCE(MAX(n), 1)
      FROM generate_series(1, 200) AS n 
      WHERE FLOOR(100 * POWER(n, 1.5)) <= p.xp
    ) as nivel_correto
  FROM profiles p
)
SELECT 
  name,
  xp,
  nivel_atual,
  nivel_correto,
  nivel_atual - nivel_correto as diferenca
FROM nivel_calculado
WHERE nivel_atual != nivel_correto;

-- ============================================
-- DESCOMENTE ABAIXO PARA EXECUTAR A CORREÇÃO
-- ============================================

/*
WITH nivel_calculado AS (
  SELECT 
    id,
    (
      SELECT COALESCE(MAX(n), 1)
      FROM generate_series(1, 200) AS n 
      WHERE FLOOR(100 * POWER(n, 1.5)) <= p.xp
    ) as nivel_correto
  FROM profiles p
)
UPDATE profiles p
SET 
  level = nc.nivel_correto,
  updated_at = NOW()
FROM nivel_calculado nc
WHERE p.id = nc.id
  AND p.level != nc.nivel_correto;
*/
