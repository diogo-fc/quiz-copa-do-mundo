import { Achievement, AchievementType } from "@/types";

export const ACHIEVEMENTS: Record<AchievementType, Achievement> = {
    first_quiz: {
        id: "first_quiz",
        name: "Estreante",
        description: "Complete seu primeiro quiz",
        icon: "🎯",
    },
    perfect_round: {
        id: "perfect_round",
        name: "Rodada Perfeita",
        description: "Acerte todas no modo Desafio (15/15)",
        icon: "⭐",
    },
    streak_7: {
        id: "streak_7",
        name: "Dedicado",
        description: "Jogue 7 dias seguidos",
        icon: "🔥",
    },
    streak_30: {
        id: "streak_30",
        name: "Fanático",
        description: "Jogue 30 dias seguidos",
        icon: "🏆",
    },
    brasil_expert: {
        id: "brasil_expert",
        name: "Especialista Brasil",
        description: "Acerte 50 perguntas sobre Brasil",
        icon: "🇧🇷",
    },
    finals_master: {
        id: "finals_master",
        name: "Mestre das Finais",
        description: "Acerte 30 perguntas sobre finais",
        icon: "🥇",
    },
    challenger: {
        id: "challenger",
        name: "Desafiante",
        description: "Vença 10 duelos",
        icon: "⚔️",
    },
    level_10: {
        id: "level_10",
        name: "Titular",
        description: "Alcance nível 10",
        icon: "🎽",
    },
    level_50: {
        id: "level_50",
        name: "Craque",
        description: "Alcance nível 50",
        icon: "⚽",
    },
    level_100: {
        id: "level_100",
        name: "Lenda",
        description: "Alcance nível 100",
        icon: "👑",
    },
    social_butterfly: {
        id: "social_butterfly",
        name: "Influenciador",
        description: "Compartilhe 10 resultados",
        icon: "📱",
    },
    early_bird: {
        id: "early_bird",
        name: "Madrugador",
        description: "Jogue o quiz diário antes das 8h",
        icon: "🌅",
    },
};

/**
 * Retorna informações de uma conquista
 */
export function getAchievementInfo(type: AchievementType): Achievement {
    return ACHIEVEMENTS[type];
}

/**
 * Retorna lista de todas as conquistas
 */
export function getAllAchievements(): Achievement[] {
    return Object.values(ACHIEVEMENTS);
}
