"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useQuiz, QuizResult } from "@/hooks/useQuiz";
import { QuestionCard, ProgressBar, ScoreDisplay, ResultScreen } from "@/components/quiz";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Question } from "@/types";
import { analytics } from "@/components/GoogleAnalytics";

// Sample daily questions
const DAILY_QUESTIONS: Question[] = [
    {
        id: "daily1",
        text: "Qual país sediou a Copa do Mundo mais vezes?",
        options: ["Brasil", "Alemanha", "México", "Itália"],
        correct_answer: 2,
        category: "curiosidades",
        difficulty: "medio",
        explanation: "México sediou 3 Copas (1970, 1986 e 2026), mais que qualquer outro país.",
        created_at: new Date().toISOString(),
    },
    {
        id: "daily2",
        text: "Quem foi o artilheiro da Copa de 2022?",
        options: ["Messi", "Mbappé", "Álvarez", "Giroud"],
        correct_answer: 1,
        category: "artilheiros",
        difficulty: "facil",
        explanation: "Kylian Mbappé foi artilheiro com 8 gols, incluindo hat-trick na final.",
        created_at: new Date().toISOString(),
    },
    {
        id: "daily3",
        text: "Qual foi a menor seleção a disputar uma Copa?",
        options: ["Islândia", "Trinidad e Tobago", "Curaçao", "Andorra"],
        correct_answer: 0,
        category: "selecoes",
        difficulty: "dificil",
        explanation: "Islândia, com ~350 mil habitantes, foi à Copa de 2018 na Rússia.",
        created_at: new Date().toISOString(),
    },
    {
        id: "daily4",
        text: "Em qual Copa foi usada a primeira bola oficial colorida?",
        options: ["1970", "1978", "1982", "1998"],
        correct_answer: 2,
        category: "curiosidades",
        difficulty: "dificil",
        explanation: "A Tango Espanha de 1982 foi a primeira com painéis coloridos.",
        created_at: new Date().toISOString(),
    },
    {
        id: "daily5",
        text: "Quantas vezes Argentina e Alemanha se enfrentaram em finais?",
        options: ["2", "3", "4", "5"],
        correct_answer: 1,
        category: "finais",
        difficulty: "medio",
        explanation: "Argentina e Alemanha se enfrentaram em 3 finais: 1986, 1990 e 2014.",
        created_at: new Date().toISOString(),
    },
];

export default function DiarioPage() {
    const { profile, refreshProfile } = useAuth();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
    const [showResult, setShowResult] = useState(false);
    const [result, setResult] = useState<QuizResult | null>(null);
    const [alreadyCompleted, setAlreadyCompleted] = useState(false);

    // Check if already completed today and load questions
    useEffect(() => {
        const loadDailyQuiz = async () => {
            setIsLoadingQuestions(true);

            const today = new Date().toISOString().split("T")[0];

            try {
                const supabase = createClient();

                // Check if already completed today (with timeout)
                if (profile?.id) {
                    const timeoutPromise = new Promise((resolve) =>
                        setTimeout(() => resolve({ data: null }), 2000)
                    );

                    const queryPromise = supabase
                        .from("daily_completions")
                        .select("*")
                        .eq("user_id", profile.id)
                        .eq("quiz_date", today)
                        .single();

                    const result = (await Promise.race([queryPromise, timeoutPromise])) as { data: unknown };

                    if (result?.data) {
                        setAlreadyCompleted(true);
                    }
                }

                // Use sample questions directly
                setQuestions(DAILY_QUESTIONS);
            } catch (err) {
                console.log("Erro ao verificar quiz diário:", err);
                setQuestions(DAILY_QUESTIONS);
            }

            setIsLoadingQuestions(false);
        };

        loadDailyQuiz();

        // Track quiz start
        analytics.quizStart("diario");
    }, [profile?.id]);

    const handleComplete = async (quizResult: QuizResult) => {
        setResult(quizResult);
        setShowResult(true);

        const today = new Date().toISOString().split("T")[0];

        try {
            const supabase = createClient();

            // Save daily completion
            await supabase.from("daily_completions").insert({
                user_id: profile?.id,
                quiz_date: today,
                score: quizResult.score,
            });

            refreshProfile();
        } catch (error) {
            console.error("Error saving daily:", error);
        }
    };

    const handlePlayAgain = () => {
        // For daily quiz, redirect to menu instead of replaying
        window.location.href = "/quiz";
    };

    const quiz = useQuiz({
        questions,
        mode: "diario",
        onComplete: handleComplete,
    });

    if (isLoadingQuestions) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-muted-foreground">Carregando quiz diário...</p>
                </div>
            </div>
        );
    }

    // Already completed today
    if (alreadyCompleted) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 p-4">
                <div className="max-w-lg mx-auto pt-20">
                    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                        <CardContent className="p-8 text-center">
                            <div className="text-6xl mb-4">✅</div>
                            <h1 className="text-2xl font-bold mb-2">Quiz Diário Completo!</h1>
                            <p className="text-muted-foreground mb-6">
                                Você já completou o quiz de hoje. Volte amanhã para novas perguntas!
                            </p>

                            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30 mb-6">
                                <p className="text-sm text-muted-foreground">Próximo quiz em</p>
                                <p className="text-2xl font-bold text-purple-400">~{24 - new Date().getHours()}h</p>
                            </div>

                            <Link href="/quiz" className="w-full">
                                <Button variant="outline" className="w-full">
                                    ← Voltar aos Modos
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Show result screen
    if (showResult && result) {
        return (
            <ResultScreen
                result={result}
                mode="diario"
                profile={profile}
                onPlayAgain={handlePlayAgain}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
            <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 h-14 flex items-center justify-between">
                    <Link href="/quiz" className="text-muted-foreground hover:text-foreground">
                        ← Voltar
                    </Link>
                    <Badge variant="outline" className="bg-purple-500/20 border-purple-500/30">
                        📅 Quiz Diário
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                        {new Date().toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                        })}
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6 max-w-2xl">
                {/* Progress */}
                <div className="mb-6">
                    <ProgressBar current={quiz.questionIndex + 1} total={quiz.totalQuestions} />
                </div>

                {/* Score Display */}
                <div className="mb-6">
                    <ScoreDisplay
                        score={quiz.score}
                        correctAnswers={quiz.correctAnswers}
                        totalQuestions={quiz.totalQuestions}
                        streak={quiz.streak}
                    />
                </div>

                {/* Question Card */}
                {quiz.currentQuestion && (
                    <QuestionCard
                        question={quiz.currentQuestion}
                        questionNumber={quiz.questionIndex + 1}
                        totalQuestions={quiz.totalQuestions}
                        onAnswer={quiz.handleAnswer}
                    />
                )}
            </main>
        </div>
    );
}
