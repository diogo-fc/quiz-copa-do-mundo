"use client";

import { useEffect, useState, useCallback, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { QuestionCard } from "@/components/quiz/QuestionCard";
import { Timer } from "@/components/quiz/Timer";
import { ProgressBar } from "@/components/quiz/ProgressBar";
import { calculateAnswerScore } from "@/lib/scoring";
import { toast } from "sonner";
import { Question, Duel, User } from "@/types";

interface DuelData extends Duel {
    questions: Question[];
    challenger: User;
    opponent: User | null;
    isChallenger: boolean;
    isOpponent: boolean;
    canPlay: boolean;
}

interface PageProps {
    params: Promise<{ id: string }>;
}

const TIME_PER_QUESTION = 20;

export default function DuelPage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { user, profile } = useAuth();

    const [duel, setDuel] = useState<DuelData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Quiz state
    const [gameState, setGameState] = useState<"waiting" | "playing" | "finished">("waiting");
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(20);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [copied, setCopied] = useState(false);

    // Load duel data
    useEffect(() => {
        const loadDuel = async () => {
            try {
                const response = await fetch(`/api/duels/${id}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Duelo não encontrado");
                }

                setDuel(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Erro ao carregar duelo");
            } finally {
                setIsLoading(false);
            }
        };

        loadDuel();
    }, [id]);

    // Handle answer
    const handleAnswer = useCallback((answerIndex: number, timeLeft: number) => {
        if (!duel) return;

        const question = duel.questions[currentQuestionIndex];
        const isCorrect = answerIndex === question.correct_answer;

        if (isCorrect) {
            const points = calculateAnswerScore({
                difficulty: question.difficulty as "facil" | "medio" | "dificil",
                isCorrect: true,
                currentStreak: correctAnswers,
                timeRemaining: timeLeft,
                totalTime: TIME_PER_QUESTION,
            });
            setScore(prev => prev + points);
            setCorrectAnswers(prev => prev + 1);
        }

        // Next question or finish
        setTimeout(() => {
            if (currentQuestionIndex < duel.questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
                setTimeRemaining(20);
            } else {
                finishDuel();
            }
        }, 1500);
    }, [duel, currentQuestionIndex]);

    // Finish duel
    const finishDuel = async () => {
        if (isSubmitting || !duel) return;
        setIsSubmitting(true);
        setGameState("finished");

        try {
            const response = await fetch(`/api/duels/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "submit_score",
                    score: score,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error);
            }

            // Refresh duel data
            const refreshResponse = await fetch(`/api/duels/${id}`);
            const refreshData = await refreshResponse.json();
            setDuel(refreshData);

            toast.success("Pontuação enviada!");

        } catch (err) {
            console.error("Submit error:", err);
            toast.error("Erro ao enviar pontuação");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Join duel as opponent
    const handleJoinDuel = async () => {
        try {
            const response = await fetch(`/api/duels/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "join" }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error);
            }

            // Refresh duel data
            const refreshResponse = await fetch(`/api/duels/${id}`);
            const refreshData = await refreshResponse.json();
            setDuel(refreshData);

            toast.success("Você entrou no duelo!");

        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erro ao entrar no duelo");
        }
    };

    // Start playing
    const handleStartPlaying = () => {
        setGameState("playing");
        setTimeRemaining(20);
    };

    // Copy share link
    const handleCopyLink = async () => {
        const url = `${window.location.origin}/duelo/${id}`;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Link copiado!");
        setTimeout(() => setCopied(false), 2000);
    };

    // Share via WhatsApp
    const handleShareWhatsApp = () => {
        const url = `${window.location.origin}/duelo/${id}`;
        const text = `⚔️ Você foi desafiado para um duelo no Copa Quiz Battle!\n\nClique para jogar: ${url}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    };

    // Timer expired
    const handleTimeUp = useCallback(() => {
        handleAnswer(-1, 0);
    }, [handleAnswer]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-xl">Carregando duelo...</div>
            </div>
        );
    }

    if (error || !duel) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="max-w-md mx-4">
                    <CardContent className="p-6 text-center">
                        <div className="text-4xl mb-4">❌</div>
                        <h2 className="text-xl font-bold mb-2">Duelo não encontrado</h2>
                        <p className="text-muted-foreground mb-4">{error}</p>
                        <Link href="/quiz">
                            <Button>Voltar ao início</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Playing state
    if (gameState === "playing" && duel.questions[currentQuestionIndex]) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 p-4">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <Badge variant="secondary" className="text-lg px-4 py-2">
                            ⚔️ Duelo
                        </Badge>
                        <Timer
                            totalSeconds={TIME_PER_QUESTION}
                            onTimeUp={handleTimeUp}
                            variant="circle"
                        />
                    </div>

                    {/* Progress */}
                    <ProgressBar
                        current={currentQuestionIndex + 1}
                        total={duel.questions.length}
                    />

                    {/* Question */}
                    <div className="mt-6">
                        <QuestionCard
                            question={duel.questions[currentQuestionIndex]}
                            questionNumber={currentQuestionIndex + 1}
                            totalQuestions={duel.questions.length}
                            onAnswer={(idx) => handleAnswer(idx, timeRemaining)}
                        />
                    </div>

                    {/* Score */}
                    <div className="mt-4 text-center">
                        <p className="text-muted-foreground">
                            Pontuação: <span className="font-bold text-primary">{score}</span>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Finished state
    if (gameState === "finished" || (duel.isChallenger && duel.challenger_score !== null) || (duel.isOpponent && duel.opponent_score !== null)) {
        const myScore = duel.isChallenger ? duel.challenger_score : duel.opponent_score;
        const opponentScore = duel.isChallenger ? duel.opponent_score : duel.challenger_score;
        const opponentProfile = duel.isChallenger ? duel.opponent : duel.challenger;
        const isWinner = myScore !== null && opponentScore !== null && myScore > opponentScore;
        const isDraw = myScore !== null && opponentScore !== null && myScore === opponentScore;
        const isWaiting = opponentScore === null;

        return (
            <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 p-4">
                <div className="max-w-lg mx-auto">
                    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                        <CardContent className="p-6 text-center">
                            {isWaiting ? (
                                <>
                                    <div className="text-6xl mb-4">⏳</div>
                                    <h2 className="text-2xl font-bold mb-2">Aguardando oponente</h2>
                                    <p className="text-muted-foreground mb-4">
                                        Sua pontuação: <span className="font-bold text-primary">{myScore || score}</span>
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Compartilhe o link para seu amigo jogar!
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="text-6xl mb-4">
                                        {isWinner ? "🏆" : isDraw ? "🤝" : "😢"}
                                    </div>
                                    <h2 className="text-2xl font-bold mb-4">
                                        {isWinner ? "Você venceu!" : isDraw ? "Empate!" : "Você perdeu!"}
                                    </h2>

                                    {/* Score comparison */}
                                    <div className="flex items-center justify-center gap-8 my-6">
                                        <div className="text-center">
                                            <Avatar className="h-12 w-12 mx-auto mb-2">
                                                <AvatarImage src={profile?.avatar_url || undefined} />
                                                <AvatarFallback>{profile?.name?.[0] || "?"}</AvatarFallback>
                                            </Avatar>
                                            <p className="font-medium">{profile?.name?.split(" ")[0]}</p>
                                            <p className="text-2xl font-bold text-primary">{myScore}</p>
                                        </div>

                                        <div className="text-2xl font-bold text-muted-foreground">VS</div>

                                        <div className="text-center">
                                            <Avatar className="h-12 w-12 mx-auto mb-2">
                                                <AvatarImage src={opponentProfile?.avatar_url || undefined} />
                                                <AvatarFallback>{opponentProfile?.name?.[0] || "?"}</AvatarFallback>
                                            </Avatar>
                                            <p className="font-medium">{opponentProfile?.name?.split(" ")[0]}</p>
                                            <p className="text-2xl font-bold text-primary">{opponentScore}</p>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="space-y-3 mt-6">
                                <Button onClick={handleShareWhatsApp} className="w-full" variant="outline">
                                    📱 Compartilhar no WhatsApp
                                </Button>
                                <Link href="/duelo/criar" className="block">
                                    <Button className="w-full">⚔️ Novo Duelo</Button>
                                </Link>
                                <Link href="/quiz" className="block">
                                    <Button variant="ghost" className="w-full">Voltar ao menu</Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Waiting state (before game starts)
    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
            {/* Header */}
            <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <span className="text-xl font-bold">⚔️ Duelo</span>
                    <Link href="/quiz">
                        <Button variant="ghost" size="sm">Voltar</Button>
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-lg">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardContent className="p-6">
                        {/* Challenger info */}
                        <div className="text-center mb-6">
                            <Avatar className="h-20 w-20 mx-auto mb-4 ring-4 ring-primary/20">
                                <AvatarImage src={duel.challenger?.avatar_url || undefined} />
                                <AvatarFallback className="text-2xl">
                                    {duel.challenger?.name?.[0] || "?"}
                                </AvatarFallback>
                            </Avatar>
                            <h2 className="text-xl font-bold">
                                {duel.isChallenger ? "Seu duelo" : `${duel.challenger?.name} te desafiou!`}
                            </h2>
                            <p className="text-muted-foreground mt-2">
                                {duel.questions?.length || 10} perguntas
                            </p>
                        </div>

                        {/* Status badges */}
                        <div className="flex justify-center gap-2 mb-6">
                            <Badge variant={duel.challenger_score !== null ? "default" : "secondary"}>
                                {duel.challenger?.name?.split(" ")[0]}: {duel.challenger_score ?? "⏳"}
                            </Badge>
                            <span className="text-muted-foreground">vs</span>
                            <Badge variant={duel.opponent_score !== null ? "default" : "secondary"}>
                                {duel.opponent?.name?.split(" ")[0] || "???"}: {duel.opponent_score ?? "⏳"}
                            </Badge>
                        </div>

                        {/* Actions based on user state */}
                        <div className="space-y-3">
                            {/* User is challenger and hasn't played yet */}
                            {duel.isChallenger && duel.challenger_score === null && (
                                <Button onClick={handleStartPlaying} className="w-full h-12 text-lg">
                                    ▶️ Começar a jogar
                                </Button>
                            )}

                            {/* User is not in the duel yet */}
                            {user && !duel.isChallenger && !duel.isOpponent && !duel.opponent_id && (
                                <Button onClick={handleJoinDuel} className="w-full h-12 text-lg">
                                    ⚔️ Aceitar desafio
                                </Button>
                            )}

                            {/* User is opponent and hasn't played yet */}
                            {duel.isOpponent && duel.opponent_score === null && (
                                <Button onClick={handleStartPlaying} className="w-full h-12 text-lg">
                                    ▶️ Começar a jogar
                                </Button>
                            )}

                            {/* User needs to login */}
                            {!user && (
                                <Link href="/login" className="block">
                                    <Button className="w-full h-12 text-lg">
                                        🔑 Entrar para jogar
                                    </Button>
                                </Link>
                            )}

                            {/* Share buttons for challenger */}
                            {duel.isChallenger && (
                                <>
                                    <Button onClick={handleShareWhatsApp} variant="outline" className="w-full">
                                        📱 Compartilhar no WhatsApp
                                    </Button>
                                    <Button onClick={handleCopyLink} variant="outline" className="w-full">
                                        {copied ? "✅ Copiado!" : "📋 Copiar link"}
                                    </Button>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
