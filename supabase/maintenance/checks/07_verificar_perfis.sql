-- ============================================
-- VERIFICAÇÃO 07: Perfis Órfãos
-- Verifica perfis que existem sem user correspondente em auth.users
-- ============================================

-- Perfis sem auth.user correspondente
SELECT 
  p.id,
  p.email,
  p.name,
  p.created_at,
  '❌ Perfil sem auth.user' as status
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;

-- Estatísticas gerais de perfis
SELECT 
  COUNT(*) FILTER (WHERE xp = 0) as perfis_sem_xp,
  COUNT(*) FILTER (WHERE level = 1) as perfis_nivel_1,
  COUNT(*) FILTER (WHERE streak_days = 0) as perfis_sem_streak,
  COUNT(*) FILTER (WHERE last_played_at IS NULL) as perfis_nunca_jogaram,
  COUNT(*) as total_perfis
FROM profiles;
