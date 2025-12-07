-- ============================================
-- Função RPC para verificação de consistência de XP
-- Usada pela API /api/maintenance/check
-- ============================================

CREATE OR REPLACE FUNCTION check_xp_consistency()
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    xp_atual INTEGER,
    xp_esperado BIGINT,
    diferenca BIGINT
) AS $$
BEGIN
    RETURN QUERY
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
    SELECT 
        p.id as user_id,
        p.name as user_name,
        p.xp as xp_atual,
        COALESCE(xc.xp_correto, 0) as xp_esperado,
        p.xp - COALESCE(xc.xp_correto, 0) as diferenca
    FROM profiles p
    LEFT JOIN xp_calculado xc ON p.id = xc.user_id
    WHERE p.xp != COALESCE(xc.xp_correto, 0)
      AND (p.xp > 0 OR xc.xp_correto > 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
