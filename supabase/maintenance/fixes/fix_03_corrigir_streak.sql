-- ============================================
-- FIX 03: Corrigir Streaks Quebrados
-- ⚠️ CUIDADO: Este script altera dados!
-- Regra: Se não jogou hoje ou ontem, streak deve ser 0
-- ============================================

-- Primeiro, visualize o que será alterado (DRY RUN)
SELECT 
  name,
  email,
  streak_days as streak_atual,
  0 as streak_novo,
  last_played_at,
  DATE(last_played_at AT TIME ZONE 'America/Sao_Paulo') as ultimo_jogo,
  CURRENT_DATE - DATE(last_played_at AT TIME ZONE 'America/Sao_Paulo') as dias_sem_jogar
FROM profiles
WHERE streak_days > 0
  AND (
    last_played_at IS NULL 
    OR DATE(last_played_at AT TIME ZONE 'America/Sao_Paulo') < CURRENT_DATE - 1
  );

-- ============================================
-- DESCOMENTE ABAIXO PARA EXECUTAR A CORREÇÃO
-- ============================================

/*
UPDATE profiles
SET 
  streak_days = 0,
  updated_at = NOW()
WHERE streak_days > 0
  AND (
    last_played_at IS NULL 
    OR DATE(last_played_at AT TIME ZONE 'America/Sao_Paulo') < CURRENT_DATE - 1
  );
*/
