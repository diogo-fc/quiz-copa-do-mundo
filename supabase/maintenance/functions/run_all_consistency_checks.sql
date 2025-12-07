-- ============================================
-- Função RPC Unificada: Verificação Completa de Consistência
-- Retorna um relatório JSON com todas as verificações
-- Usada pela API /api/maintenance/check
-- ============================================

CREATE OR REPLACE FUNCTION run_all_consistency_checks()
RETURNS JSON AS $$
DECLARE
    result JSON;
    xp_issues INTEGER;
    level_issues INTEGER;
    streak_issues INTEGER;
    achievement_issues INTEGER;
    orphan_sessions INTEGER;
    total_users INTEGER;
    total_sessions INTEGER;
    total_achievements INTEGER;
BEGIN
    -- 1. Contar problemas de XP
    SELECT COUNT(*) INTO xp_issues
    FROM (
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
                )::BIGINT as xp_correto
            FROM game_sessions gs
            WHERE gs.user_id IS NOT NULL
            GROUP BY gs.user_id
        )
        SELECT p.id
        FROM profiles p
        LEFT JOIN xp_calculado xc ON p.id = xc.user_id
        WHERE p.xp != COALESCE(xc.xp_correto, 0)
          AND (p.xp > 0 OR xc.xp_correto > 0)
    ) AS xp_check;

    -- 2. Contar problemas de Nível
    SELECT COUNT(*) INTO level_issues
    FROM (
        SELECT p.id
        FROM profiles p
        WHERE p.xp > 0
          AND p.level != (
            SELECT COALESCE(MAX(n), 1)
            FROM generate_series(1, 200) AS n 
            WHERE FLOOR(100 * POWER(n, 1.5)) <= p.xp
          )
    ) AS level_check;

    -- 3. Contar problemas de Streak
    SELECT COUNT(*) INTO streak_issues
    FROM profiles
    WHERE streak_days > 0
      AND (
        last_played_at IS NULL 
        OR DATE(last_played_at AT TIME ZONE 'America/Sao_Paulo') < CURRENT_DATE - 1
      );

    -- 4. Contar conquistas faltando (first_quiz)
    SELECT COUNT(*) INTO achievement_issues
    FROM profiles p
    WHERE EXISTS (SELECT 1 FROM game_sessions gs WHERE gs.user_id = p.id)
      AND NOT EXISTS (
        SELECT 1 FROM user_achievements ua 
        WHERE ua.user_id = p.id AND ua.achievement_type = 'first_quiz'
      );

    -- 5. Contar sessões órfãs
    SELECT COUNT(*) INTO orphan_sessions
    FROM game_sessions gs
    WHERE gs.user_id IS NULL
       OR NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = gs.user_id);

    -- Estatísticas gerais
    SELECT COUNT(*) INTO total_users FROM profiles;
    SELECT COUNT(*) INTO total_sessions FROM game_sessions;
    SELECT COUNT(*) INTO total_achievements FROM user_achievements;

    -- Montar resultado JSON
    result := json_build_object(
        'timestamp', NOW(),
        'healthy', (xp_issues = 0 AND level_issues = 0 AND streak_issues = 0),
        'stats', json_build_object(
            'total_users', total_users,
            'total_sessions', total_sessions,
            'total_achievements', total_achievements
        ),
        'issues', json_build_array(
            CASE WHEN xp_issues > 0 THEN json_build_object(
                'type', 'XP_MISMATCH',
                'description', 'Usuários com XP inconsistente',
                'count', xp_issues
            ) ELSE NULL END,
            CASE WHEN level_issues > 0 THEN json_build_object(
                'type', 'LEVEL_MISMATCH',
                'description', 'Usuários com nível incorreto',
                'count', level_issues
            ) ELSE NULL END,
            CASE WHEN streak_issues > 0 THEN json_build_object(
                'type', 'BROKEN_STREAK',
                'description', 'Streaks que deveriam ter sido resetados',
                'count', streak_issues
            ) ELSE NULL END,
            CASE WHEN achievement_issues > 0 THEN json_build_object(
                'type', 'MISSING_ACHIEVEMENT',
                'description', 'Conquista first_quiz faltando',
                'count', achievement_issues
            ) ELSE NULL END,
            CASE WHEN orphan_sessions > 0 THEN json_build_object(
                'type', 'ORPHAN_SESSIONS',
                'description', 'Game sessions sem usuário válido',
                'count', orphan_sessions
            ) ELSE NULL END
        ),
        'issue_counts', json_build_object(
            'xp_issues', xp_issues,
            'level_issues', level_issues,
            'streak_issues', streak_issues,
            'achievement_issues', achievement_issues,
            'orphan_sessions', orphan_sessions,
            'total', xp_issues + level_issues + streak_issues + achievement_issues + orphan_sessions
        )
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Exemplo de uso:
-- SELECT run_all_consistency_checks();
-- ============================================
