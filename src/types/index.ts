// User Types
export interface User {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
    favorite_team: string | null;
    xp: number;
    level: number;
    streak_days: number;
    last_played_at: string | null;
    created_at: string;
}

// Question Types
export type QuestionCategory =
    | "selecoes"
    | "finais"
    | "artilheiros"
    | "curiosidades"
    | "copa2026";

export type QuestionDifficulty = "facil" | "medio" | "dificil";

export interface Question {
    id: string;
    text: string;
    options: string[];
    correct_answer: number; // índice 0-3
    category: QuestionCategory;
    difficulty: QuestionDifficulty;
    explanation: string | null;
    created_at: string;
}

// Game Types
export type GameMode = "treino" | "desafio" | "duelo" | "diario";

export interface GameSession {
    id: string;
    user_id: string;
    mode: GameMode;
    score: number;
    correct_answers: number;
    total_questions: number;
    time_spent: number | null;
    completed_at: string;
}

// Duel Types
export type DuelStatus = "pending" | "active" | "completed";

export interface Duel {
    id: string;
    challenger_id: string;
    opponent_id: string | null;
    question_ids: string[];
    challenger_score: number | null;
    opponent_score: number | null;
    status: DuelStatus;
    created_at: string;
    completed_at: string | null;
}

// Achievement Types
export type AchievementType =
    | "first_quiz"
    | "perfect_round"
    | "streak_7"
    | "streak_30"
    | "brasil_expert"
    | "finals_master"
    | "challenger"
    | "level_10"
    | "level_50"
    | "level_100"
    | "social_butterfly"
    | "early_bird";

export interface Achievement {
    id: AchievementType;
    name: string;
    description: string;
    icon: string;
}

export interface UserAchievement {
    id: string;
    user_id: string;
    achievement_type: AchievementType;
    unlocked_at: string;
}

// Ranking Types
export type RankingPeriod = "weekly" | "monthly" | "alltime";

export interface RankingEntry {
    user_id: string;
    period: RankingPeriod;
    score: number;
    position: number;
    updated_at: string;
    user?: Pick<User, "name" | "avatar_url" | "level">;
}

// Quiz State Types
export interface QuizState {
    questions: Question[];
    currentQuestionIndex: number;
    score: number;
    correctAnswers: number;
    streak: number;
    answers: (number | null)[];
    isFinished: boolean;
    startedAt: Date | null;
}

// Daily Quiz Types
export interface DailyQuiz {
    date: string; // YYYY-MM-DD
    questions: Question[];
    completed: boolean;
    score: number | null;
}
