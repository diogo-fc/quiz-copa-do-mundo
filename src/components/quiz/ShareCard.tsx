"use client";

import { forwardRef } from "react";
import { QuizResult } from "@/hooks/useQuiz";
import { GameMode, User } from "@/types";
import { getLevelTitle } from "@/lib/scoring";

interface ShareCardProps {
    result: QuizResult;
    mode: GameMode;
    profile: User | null;
}

// Mode labels
const modeLabels: Record<GameMode, string> = {
    treino: "Modo Treino",
    desafio: "Modo Desafio",
    diario: "Quiz Diário",
    duelo: "Duelo PvP",
};

const modeEmojis: Record<GameMode, string> = {
    treino: "📚",
    desafio: "⏱️",
    diario: "📅",
    duelo: "⚔️",
};

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
    ({ result, mode, profile }, ref) => {
        const accuracy = Math.round(
            (result.correctAnswers / result.totalQuestions) * 100
        );
        const isPerfect = result.correctAnswers === result.totalQuestions;
        const levelTitle = profile ? getLevelTitle(profile.level) : "Novato";

        // Get result emoji based on accuracy
        const getResultEmoji = () => {
            if (isPerfect) return "⭐";
            if (accuracy >= 80) return "🏆";
            if (accuracy >= 60) return "🎉";
            if (accuracy >= 40) return "👏";
            return "💪";
        };

        return (
            <div
                ref={ref}
                className="w-[360px] h-[640px] bg-gradient-to-br from-[#0a1628] via-[#0f2847] to-[#0a1628] p-6 flex flex-col relative overflow-hidden"
                style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                }}
            >
                {/* Background decorations */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl" />

                {/* Header */}
                <div className="text-center mb-6 relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-4">
                        <span className="text-lg">{modeEmojis[mode]}</span>
                        <span className="text-white/80 text-sm font-medium">{modeLabels[mode]}</span>
                    </div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 via-yellow-400 to-green-400 bg-clip-text text-transparent">
                        Copa Quiz Battle
                    </h1>
                </div>

                {/* Main Score */}
                <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                    <div className="text-6xl mb-4">{getResultEmoji()}</div>
                    <div className="text-5xl font-black text-white mb-2">
                        {result.score.toLocaleString()}
                    </div>
                    <div className="text-white/60 text-sm mb-6">pontos</div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 w-full max-w-[280px] mb-6">
                        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                            <p className="text-xl font-bold text-green-400">
                                {result.correctAnswers}/{result.totalQuestions}
                            </p>
                            <p className="text-xs text-white/50">Acertos</p>
                        </div>
                        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                            <p className="text-xl font-bold text-blue-400">{accuracy}%</p>
                            <p className="text-xs text-white/50">Precisão</p>
                        </div>
                        <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center">
                            <p className="text-xl font-bold text-orange-400">
                                {result.maxStreak}x
                            </p>
                            <p className="text-xs text-white/50">Streak</p>
                        </div>
                        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                            <p className="text-xl font-bold text-purple-400">
                                +{result.xpGained}
                            </p>
                            <p className="text-xs text-white/50">XP</p>
                        </div>
                    </div>

                    {/* Perfect Badge */}
                    {isPerfect && (
                        <div className="px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                            <span className="text-yellow-400 font-semibold">
                                ⭐ RODADA PERFEITA! ⭐
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer with user info */}
                <div className="relative z-10">
                    {profile && (
                        <div className="flex items-center justify-center gap-3 mb-4">
                            {profile.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt={profile.name || "User"}
                                    className="w-10 h-10 rounded-full border-2 border-white/20"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold">
                                    {profile.name?.charAt(0) || "?"}
                                </div>
                            )}
                            <div className="text-left">
                                <p className="text-white font-medium text-sm">
                                    {profile.name || "Jogador"}
                                </p>
                                <p className="text-white/50 text-xs">
                                    Nível {profile.level} • {levelTitle}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* CTA */}
                    <div className="text-center">
                        <p className="text-white/40 text-xs mb-1">Jogue você também!</p>
                        <p className="text-white/60 text-sm font-medium">copaquizbattle.com</p>
                    </div>
                </div>

                {/* Brazil flag bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 flex">
                    <div className="flex-1 bg-green-500" />
                    <div className="flex-1 bg-yellow-500" />
                    <div className="flex-1 bg-green-500" />
                </div>
            </div>
        );
    }
);

ShareCard.displayName = "ShareCard";
