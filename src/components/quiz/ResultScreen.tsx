"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { QuizResult } from "@/hooks/useQuiz";
import { GameMode, Achievement, User } from "@/types";
import { getLevelProgress, getXPForLevel, getLevelTitle } from "@/lib/scoring";
import { getAllAchievements } from "@/lib/achievements";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { ShareCard } from "./ShareCard";
import { useAuth } from "@/hooks/useAuth";
import { analytics } from "@/components/GoogleAnalytics";

interface ResultScreenProps {
    result: QuizResult;
    mode: GameMode;
    profile: User | null;
    onPlayAgain: () => void;
    onClose?: () => void;
}

export function ResultScreen({
    result,
    mode,
    profile,
    onPlayAgain,
    onClose,
}: ResultScreenProps) {
    const { refreshProfile } = useAuth();
    const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
    const [isSharing, setIsSharing] = useState(false);
    const savedToDbRef = useRef(false); // Use ref to prevent React Strict Mode double execution
    const [showShareModal, setShowShareModal] = useState(false);
    const shareCardRef = useRef<HTMLDivElement>(null);

    // Calculate stats
    const accuracy = Math.round(
        (result.correctAnswers / result.totalQuestions) * 100
    );
    const errors = result.totalQuestions - result.correctAnswers;
    const isPerfect = result.correctAnswers === result.totalQuestions;

    // Level progress
    const oldXP = (profile?.xp || 0) - result.xpGained;
    const newXP = profile?.xp || result.xpGained;
    const oldLevel = profile?.level || 1;
    const newLevelProgress = getLevelProgress(newXP);
    const nextLevelXP = getXPForLevel(oldLevel + 1);
    const levelTitle = getLevelTitle(oldLevel);
    const leveledUp = newXP >= nextLevelXP && oldXP < nextLevelXP;

    // Mode labels
    const modeLabels: Record<GameMode, string> = {
        treino: "Modo Treino",
        desafio: "Modo Desafio",
        diario: "Quiz Diário",
        duelo: "Duelo PvP",
    };

    // Save game session to database
    useEffect(() => {
        const saveGameSession = async () => {
            // Use ref to prevent double execution in React Strict Mode
            if (savedToDbRef.current || !profile?.id) return;
            savedToDbRef.current = true; // Mark immediately before async operations

            try {
                const supabase = createClient();

                // Save game session
                const { error } = await supabase.from("game_sessions").insert({
                    user_id: profile.id,
                    mode: mode,
                    score: result.score,
                    correct_answers: result.correctAnswers,
                    total_questions: result.totalQuestions,
                    time_spent: result.timeSpent,
                });

                if (error) {
                    console.error("Error saving game session:", error);
                    savedToDbRef.current = false; // Allow retry on error
                    return;
                }

                // Add XP to user
                if (result.xpGained > 0) {
                    await supabase.rpc("add_user_xp", {
                        user_uuid: profile.id,
                        xp_amount: result.xpGained,
                    });
                    // Refresh profile to update XP in header
                    refreshProfile();
                }

                // Track quiz completion
                analytics.quizComplete(mode, result.score, result.correctAnswers);

                // Update daily streak
                try {
                    await fetch("/api/streak", { method: "POST" });
                } catch (e) {
                    console.log("Erro ao atualizar streak:", e);
                }

                // Check for new achievements
                const allAchievements = getAllAchievements();
                const unlockedIds = await checkNewAchievements(profile.id, result);

                if (unlockedIds.length > 0) {
                    const unlocked = allAchievements.filter((a) =>
                        unlockedIds.includes(a.id)
                    );
                    setNewAchievements(unlocked);

                    // Save achievements to database
                    for (const achievement of unlocked) {
                        await supabase.from("user_achievements").upsert(
                            {
                                user_id: profile.id,
                                achievement_type: achievement.id,
                            },
                            { onConflict: "user_id,achievement_type", ignoreDuplicates: true }
                        );

                        // Log achievement to feed
                        await fetch("/api/feed", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                activity_type: "achievement_unlocked",
                                data: { achievement_id: achievement.id, achievement_name: achievement.name }
                            })
                        }).catch(() => { });
                    }
                }

                // Log quiz completion to feed (only once, inside saved check)
                await fetch("/api/feed", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        activity_type: "quiz_completed",
                        data: {
                            mode,
                            score: result.score,
                            correct_answers: result.correctAnswers,
                            total_questions: result.totalQuestions,
                            accuracy: Math.round((result.correctAnswers / result.totalQuestions) * 100)
                        }
                    })
                }).catch(() => { });
            } catch (err) {
                console.error("Error saving game:", err);
                savedToDbRef.current = false; // Allow retry on error
            }
        };

        saveGameSession();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile?.id]);

    // Check which achievements were unlocked
    async function checkNewAchievements(
        userId: string,
        quizResult: QuizResult
    ): Promise<string[]> {
        const newUnlocked: string[] = [];

        try {
            const supabase = createClient();

            // Get already unlocked achievements to avoid duplicates
            const { data: existingAchievements } = await supabase
                .from("user_achievements")
                .select("achievement_type")
                .eq("user_id", userId);

            const alreadyUnlocked = new Set(
                existingAchievements?.map((a) => a.achievement_type) || []
            );

            // Helper to add achievement if not already unlocked
            const addIfNew = (type: string) => {
                if (!alreadyUnlocked.has(type)) {
                    newUnlocked.push(type);
                }
            };

            // First quiz (user has completed at least one game)
            const { count: sessionCount } = await supabase
                .from("game_sessions")
                .select("*", { count: "exact", head: true })
                .eq("user_id", userId);

            if (sessionCount && sessionCount >= 1) {
                addIfNew("first_quiz");
            }

            // Perfect round (all correct answers)
            if (quizResult.correctAnswers === quizResult.totalQuestions && quizResult.totalQuestions >= 10) {
                addIfNew("perfect_round");
            }

            // Level achievements (check current profile level)
            const { data: profileData } = await supabase
                .from("profiles")
                .select("level, xp")
                .eq("id", userId)
                .single();

            if (profileData) {
                if (profileData.level >= 10) addIfNew("level_10");
                if (profileData.level >= 50) addIfNew("level_50");
                if (profileData.level >= 100) addIfNew("level_100");
            }

            // Streak achievements would require daily tracking (not yet implemented)
            // streak_7, streak_30 - TODO: implement with streak_days field

            // Category-specific achievements would require category tracking
            // brasil_expert, finals_master - TODO: implement with category answer tracking

            // Duel achievements
            if (mode === "duelo") {
                const { count: duelWins } = await supabase
                    .from("duels")
                    .select("*", { count: "exact", head: true })
                    .eq("status", "completed")
                    .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`);

                // Check if user won at least 10 duels
                if (duelWins && duelWins >= 10) {
                    addIfNew("challenger");
                }
            }

        } catch (err) {
            console.error("Error checking achievements:", err);
        }

        return newUnlocked;
    }

    // Share result as image
    const handleShare = async () => {
        setShowShareModal(true);
        setIsSharing(true);

        // Wait for modal to render
        await new Promise((resolve) => setTimeout(resolve, 100));

        try {
            if (!shareCardRef.current) {
                throw new Error("Share card not found");
            }

            // Generate image from card
            const dataUrl = await toPng(shareCardRef.current, {
                quality: 0.95,
                pixelRatio: 2,
            });

            // Convert to blob
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const file = new File([blob], "copa-quiz-result.png", { type: "image/png" });

            // Try native share (mobile)
            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    title: "Copa Quiz Battle",
                    text: `🏆 Fiz ${result.score} pontos no Copa Quiz Battle! Jogue você também!`,
                    files: [file],
                });
                toast.success("Resultado compartilhado!");
            } else {
                // Desktop fallback: download image
                const link = document.createElement("a");
                link.href = dataUrl;
                link.download = "copa-quiz-result.png";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success("Imagem salva! Compartilhe nas suas redes sociais.");
            }
        } catch (err) {
            console.log("Share error:", err);
            // Fallback to text share
            const shareText = `🏆 Copa Quiz Battle
📊 ${result.score} pontos no ${modeLabels[mode]}!
✅ ${result.correctAnswers}/${result.totalQuestions} (${accuracy}%)
🔥 Streak: ${result.maxStreak}x
⭐ +${result.xpGained} XP

Jogue você também!`;
            try {
                await navigator.clipboard.writeText(shareText);
                toast.success("Resultado copiado para a área de transferência!");
            } catch {
                toast.error("Não foi possível compartilhar");
            }
        }

        setIsSharing(false);
        setShowShareModal(false);
    };

    // Get result emoji
    const getResultEmoji = () => {
        if (isPerfect) return "⭐";
        if (accuracy >= 80) return "🏆";
        if (accuracy >= 60) return "🎉";
        if (accuracy >= 40) return "👏";
        return "💪";
    };

    // Get result message
    const getResultMessage = () => {
        if (isPerfect) return "Rodada Perfeita!";
        if (accuracy >= 80) return "Excelente!";
        if (accuracy >= 60) return "Muito bem!";
        if (accuracy >= 40) return "Bom trabalho!";
        return "Continue praticando!";
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 p-4">
            <div className="max-w-lg mx-auto pt-8 pb-12">
                {/* Main Result Card */}
                <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
                    {/* Header gradient */}
                    <div className="h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-green-500" />

                    <CardContent className="p-6 sm:p-8">
                        {/* Result Icon & Message */}
                        <div className="text-center mb-6">
                            <div className="text-6xl mb-3 animate-bounce">
                                {getResultEmoji()}
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold mb-1">
                                {getResultMessage()}
                            </h1>
                            <p className="text-muted-foreground">{modeLabels[mode]}</p>
                        </div>

                        {/* Score Highlight */}
                        <div className="text-center mb-6">
                            <div className="inline-block px-8 py-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
                                <p className="text-4xl sm:text-5xl font-bold text-primary">
                                    {result.score.toLocaleString()}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">pontos</p>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                            {/* Correct */}
                            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                                <p className="text-2xl font-bold text-green-400">
                                    {result.correctAnswers}
                                </p>
                                <p className="text-xs text-muted-foreground">Acertos</p>
                            </div>

                            {/* Errors */}
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                                <p className="text-2xl font-bold text-red-400">{errors}</p>
                                <p className="text-xs text-muted-foreground">Erros</p>
                            </div>

                            {/* Accuracy */}
                            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                                <p className="text-2xl font-bold text-blue-400">{accuracy}%</p>
                                <p className="text-xs text-muted-foreground">Precisão</p>
                            </div>

                            {/* Streak */}
                            <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center">
                                <p className="text-2xl font-bold text-orange-400">
                                    {result.maxStreak}x
                                </p>
                                <p className="text-xs text-muted-foreground">Streak</p>
                            </div>
                        </div>

                        {/* XP & Level Progress */}
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-sm text-muted-foreground">XP Ganho</p>
                                    <p className="text-2xl font-bold text-primary">
                                        +{result.xpGained} XP
                                    </p>
                                </div>
                                <div className="text-right">
                                    <Badge className="bg-primary/20 text-primary border-primary/30">
                                        Nível {oldLevel}
                                    </Badge>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {levelTitle}
                                    </p>
                                </div>
                            </div>

                            {/* Level Progress Bar */}
                            <div>
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                    <span>Progresso</span>
                                    <span>
                                        {newXP} / {nextLevelXP} XP
                                    </span>
                                </div>
                                <Progress value={newLevelProgress} className="h-2" />
                            </div>

                            {/* Level Up Message */}
                            {leveledUp && (
                                <div className="mt-3 p-2 rounded-lg bg-yellow-500/20 border border-yellow-500/30 text-center">
                                    <span className="text-yellow-400 font-semibold">
                                        🎉 Você subiu para o Nível {oldLevel + 1}!
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* New Achievements */}
                        {newAchievements.length > 0 && (
                            <div className="mb-6">
                                <p className="text-sm text-muted-foreground mb-3 text-center">
                                    🏆 Conquistas Desbloqueadas
                                </p>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {newAchievements.map((achievement) => (
                                        <Badge
                                            key={achievement.id}
                                            className="px-4 py-2 bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                        >
                                            {achievement.icon} {achievement.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Perfect Badge */}
                        {isPerfect && (
                            <div className="text-center mb-6">
                                <Badge className="px-4 py-2 bg-gradient-to-r from-yellow-500/30 to-orange-500/30 text-yellow-400 border-yellow-500/40 text-base">
                                    ⭐ RODADA PERFEITA! ⭐
                                </Badge>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={onPlayAgain}
                                size="lg"
                                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                            >
                                🔄 Jogar Novamente
                            </Button>

                            <Button
                                onClick={handleShare}
                                variant="outline"
                                size="lg"
                                className="w-full"
                                disabled={isSharing}
                            >
                                {isSharing ? "Compartilhando..." : "📤 Compartilhar Resultado"}
                            </Button>

                            <Link href="/quiz" className="w-full">
                                <Button variant="ghost" size="lg" className="w-full">
                                    ← Voltar ao Menu
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Time Spent */}
                <p className="text-center text-sm text-muted-foreground mt-4">
                    Tempo: {Math.floor(result.timeSpent / 60)}m {result.timeSpent % 60}s
                </p>
            </div>

            {/* Hidden ShareCard for image generation */}
            {showShareModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="relative">
                        <ShareCard
                            ref={shareCardRef}
                            result={result}
                            mode={mode}
                            profile={profile}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
