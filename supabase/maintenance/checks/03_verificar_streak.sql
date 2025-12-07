-- ============================================
-- VERIFICAÇÃO 03: Streak vs Last Played
-- Verifica se o streak_days está consistente com last_played_at
-- Regra: Streak só é válido se jogou hoje ou ontem
-- ============================================

SELECT 
  name,
  email,
  streak_days,
  last_played_at,
  DATE(last_played_at AT TIME ZONE 'America/Sao_Paulo') as ultimo_jogo,
  CURRENT_DATE as hoje,
  CURRENT_DATE - DATE(last_played_at AT TIME ZONE 'America/Sao_Paulo') as dias_desde_ultimo_jogo,
  CASE 
    WHEN last_played_at IS NULL AND streak_days = 0 THEN '✅ OK (nunca jogou)'
    WHEN last_played_at IS NULL AND streak_days > 0 THEN '❌ Streak sem last_played_at'
    WHEN DATE(last_played_at AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE THEN '✅ OK (jogou hoje)'
    WHEN DATE(last_played_at AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE - 1 THEN '✅ OK (jogou ontem)'
    WHEN streak_days > 0 AND DATE(last_played_at AT TIME ZONE 'America/Sao_Paulo') < CURRENT_DATE - 1 
      THEN '❌ Streak deveria ser 0 (quebrado)'
    ELSE '✅ OK'
  END as status
FROM profiles
WHERE streak_days > 0 OR last_played_at IS NOT NULL
ORDER BY 
  CASE 
    WHEN streak_days > 0 AND last_played_at IS NULL THEN 0
    WHEN streak_days > 0 AND DATE(last_played_at AT TIME ZONE 'America/Sao_Paulo') < CURRENT_DATE - 1 THEN 1
    ELSE 2
  END,
  streak_days DESC;
