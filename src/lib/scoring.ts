import { GameMode, QuestionDifficulty } from "@/types";

// Pontuação base por acerto
const BASE_POINTS = 100;

// Multiplicadores por dificuldade
const DIFFICULTY_MULTIPLIER: Record<QuestionDifficulty, number> = {
    facil: 1.0,
    medio: 1.5,
    dificil: 2.0,
};

// Multiplicadores por modo de jogo (para XP)
const MODE_MULTIPLIER: Record<GameMode, number> = {
    treino: 0.5,
    desafio: 1.0,
    duelo: 1.5,
    diario: 1.2,
};

// Bônus por streak (acertos consecutivos)
const STREAK_BONUS: Record<number, number> = {
    3: 25, // 3 acertos seguidos
    5: 50, // 5 acertos seguidos
    10: 100, // 10 acertos seguidos
    15: 200, // 15 acertos seguidos (rodada perfeita)
};

/**
 * Calcula a pontuação base de uma resposta correta
 */
export function calculateBaseScore(difficulty: QuestionDifficulty): number {
    return Math.floor(BASE_POINTS * DIFFICULTY_MULTIPLIER[difficulty]);
}

/**
 * Calcula bônus por velocidade (modo Desafio)
 * @param timeRemaining - Tempo restante em segundos
 * @param totalTime - Tempo total em segundos
 * @returns Bônus de 0 a 50 pontos
 */
export function calculateSpeedBonus(
    timeRemaining: number,
    totalTime: number
): number {
    if (timeRemaining <= 0) return 0;
    const percentRemaining = timeRemaining / totalTime;
    return Math.floor(percentRemaining * 50);
}

/**
 * Retorna o bônus de streak se aplicável
 */
export function getStreakBonus(currentStreak: number): number {
    // Encontra o maior threshold que o streak atual atinge
    const thresholds = Object.keys(STREAK_BONUS)
        .map(Number)
        .sort((a, b) => b - a);

    for (const threshold of thresholds) {
        if (currentStreak >= threshold) {
            return STREAK_BONUS[threshold];
        }
    }
    return 0;
}

/**
 * Calcula a pontuação total de uma resposta
 */
export function calculateAnswerScore(params: {
    difficulty: QuestionDifficulty;
    isCorrect: boolean;
    currentStreak: number;
    timeRemaining?: number;
    totalTime?: number;
}): number {
    if (!params.isCorrect) return 0;

    let score = calculateBaseScore(params.difficulty);

    // Adiciona bônus de velocidade se aplicável
    if (params.timeRemaining !== undefined && params.totalTime !== undefined) {
        score += calculateSpeedBonus(params.timeRemaining, params.totalTime);
    }

    // Adiciona bônus de streak
    score += getStreakBonus(params.currentStreak);

    return score;
}

/**
 * Calcula XP ganho em uma partida
 */
export function calculateXP(score: number, mode: GameMode): number {
    return Math.floor(score * MODE_MULTIPLIER[mode] * 0.1);
}

/**
 * Thresholds de XP para cada nível (progressão exponencial)
 */
export function getXPForLevel(level: number): number {
    if (level <= 1) return 0;
    // Fórmula: 100 * (level^1.5)
    return Math.floor(100 * Math.pow(level, 1.5));
}

/**
 * Calcula o nível baseado no XP total
 */
export function getLevelFromXP(totalXP: number): number {
    let level = 1;
    while (getXPForLevel(level + 1) <= totalXP) {
        level++;
    }
    return level;
}

/**
 * Calcula progresso percentual para o próximo nível
 */
export function getLevelProgress(totalXP: number): number {
    const currentLevel = getLevelFromXP(totalXP);
    const currentLevelXP = getXPForLevel(currentLevel);
    const nextLevelXP = getXPForLevel(currentLevel + 1);

    const xpInCurrentLevel = totalXP - currentLevelXP;
    const xpNeededForNextLevel = nextLevelXP - currentLevelXP;

    return Math.floor((xpInCurrentLevel / xpNeededForNextLevel) * 100);
}

/**
 * Retorna o título baseado no nível
 */
export function getLevelTitle(level: number): string {
    if (level >= 100) return "Lenda";
    if (level >= 50) return "Craque";
    if (level >= 25) return "Titular";
    if (level >= 10) return "Reserva";
    return "Novato";
}
