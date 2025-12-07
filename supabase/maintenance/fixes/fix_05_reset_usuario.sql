-- ============================================
-- FIX 05: Reset Completo de Usuário
-- ⚠️ CUIDADO: Este script apaga dados permanentemente!
-- Altera o email na linha abaixo antes de executar
-- ============================================

DO $$
DECLARE
  target_email TEXT := 'COLOQUE_O_EMAIL_AQUI@exemplo.com';  -- 👈 ALTERE AQUI
  user_uuid UUID;
BEGIN
  -- Buscar o ID do usuário
  SELECT id INTO user_uuid FROM profiles WHERE email = target_email;
  
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'Usuário com email % não encontrado', target_email;
  END IF;

  RAISE NOTICE 'Resetando usuário: % (ID: %)', target_email, user_uuid;

  -- 1. Deletar Game Sessions
  DELETE FROM game_sessions WHERE user_id = user_uuid;
  RAISE NOTICE '✓ Game sessions deletadas';

  -- 2. Deletar Conquistas
  DELETE FROM user_achievements WHERE user_id = user_uuid;
  RAISE NOTICE '✓ Conquistas deletadas';

  -- 3. Deletar Duelos (como challenger ou opponent)
  DELETE FROM duels WHERE challenger_id = user_uuid OR opponent_id = user_uuid;
  RAISE NOTICE '✓ Duelos deletados';

  -- 4. Deletar Quiz Diários
  DELETE FROM daily_completions WHERE user_id = user_uuid;
  RAISE NOTICE '✓ Quiz diários deletados';

  -- 5. Deletar Rankings
  DELETE FROM rankings WHERE user_id = user_uuid;
  RAISE NOTICE '✓ Rankings deletados';

  -- 6. Deletar Amizades
  DELETE FROM friendships WHERE user_id = user_uuid OR friend_id = user_uuid;
  RAISE NOTICE '✓ Amizades deletadas';

  -- 7. Deletar Feed de Atividades
  DELETE FROM activity_feed WHERE user_id = user_uuid;
  RAISE NOTICE '✓ Activity feed deletado';

  -- 8. Deletar Push Subscriptions
  DELETE FROM push_subscriptions WHERE user_id = user_uuid;
  RAISE NOTICE '✓ Push subscriptions deletadas';

  -- 9. Resetar Perfil
  UPDATE profiles
  SET 
    xp = 0,
    level = 1,
    streak_days = 0,
    last_played_at = NULL,
    favorite_team = NULL,
    updated_at = NOW()
  WHERE id = user_uuid;
  RAISE NOTICE '✓ Perfil resetado';

  RAISE NOTICE '============================';
  RAISE NOTICE 'Reset completo concluído para: %', target_email;
  RAISE NOTICE '============================';
END $$;

-- Verificar resultado
SELECT 
  name, 
  email, 
  xp, 
  level, 
  streak_days, 
  favorite_team,
  last_played_at
FROM profiles 
WHERE email = 'COLOQUE_O_EMAIL_AQUI@exemplo.com';  -- 👈 ALTERE AQUI TAMBÉM
