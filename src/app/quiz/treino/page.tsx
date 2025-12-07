"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useQuiz, QuizResult } from "@/hooks/useQuiz";
import { QuestionCard, ProgressBar, ScoreDisplay, ResultScreen } from "@/components/quiz";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { Question } from "@/types";
import { analytics } from "@/components/GoogleAnalytics";

// Sample questions for development (will be replaced with DB fetch)
const SAMPLE_QUESTIONS: Question[] = [
    {
        id: "1",
        text: "Qual país venceu a primeira Copa do Mundo em 1930?",
        options: ["Brasil", "Argentina", "Uruguai", "Itália"],
        correct_answer: 2,
        category: "finais",
        difficulty: "facil",
        explanation: "O Uruguai venceu a primeira Copa do Mundo, realizada em seu próprio país, derrotando a Argentina na final por 4 a 2.",
        created_at: new Date().toISOString(),
    },
    {
        id: "2",
        text: "Quantas Copas do Mundo o Brasil já venceu?",
        options: ["3", "4", "5", "6"],
        correct_answer: 2,
        category: "selecoes",
        difficulty: "facil",
        explanation: "O Brasil é o maior vencedor com 5 títulos: 1958, 1962, 1970, 1994 e 2002.",
        created_at: new Date().toISOString(),
    },
    {
        id: "3",
        text: "Quem é o maior artilheiro da história das Copas?",
        options: ["Pelé", "Ronaldo", "Miroslav Klose", "Gerd Müller"],
        correct_answer: 2,
        category: "artilheiros",
        difficulty: "medio",
        explanation: "Miroslav Klose é o maior artilheiro com 16 gols marcados em 4 Copas do Mundo pela Alemanha.",
        created_at: new Date().toISOString(),
    },
    {
        id: "4",
        text: "Em qual país foi realizada a Copa do Mundo de 2014?",
        options: ["Alemanha", "África do Sul", "Brasil", "Rússia"],
        correct_answer: 2,
        category: "curiosidades",
        difficulty: "facil",
        explanation: "A Copa de 2014 foi sediada pelo Brasil, com a final no Maracanã.",
        created_at: new Date().toISOString(),
    },
    {
        id: "5",
        text: "Qual seleção foi campeã da Copa do Mundo de 2018?",
        options: ["Alemanha", "França", "Croácia", "Bélgica"],
        correct_answer: 1,
        category: "finais",
        difficulty: "facil",
        explanation: "A França venceu a Copa de 2018 na Rússia, derrotando a Croácia por 4 a 2 na final.",
        created_at: new Date().toISOString(),
    },
    {
        id: "6",
        text: "Quantos países sediarão a Copa do Mundo de 2026?",
        options: ["1", "2", "3", "4"],
        correct_answer: 2,
        category: "copa2026",
        difficulty: "medio",
        explanation: "A Copa de 2026 será sediada por 3 países: Estados Unidos, México e Canadá.",
        created_at: new Date().toISOString(),
    },
    {
        id: "7",
        text: "Qual jogador é conhecido como 'O Fenômeno'?",
        options: ["Romário", "Ronaldo", "Ronaldinho", "Neymar"],
        correct_answer: 1,
        category: "artilheiros",
        difficulty: "facil",
        explanation: "Ronaldo Nazário, duas vezes campeão mundial (1994 e 2002), é conhecido como 'O Fenômeno'.",
        created_at: new Date().toISOString(),
    },
    {
        id: "8",
        text: "Em qual final de Copa o Brasil perdeu de 7 a 1?",
        options: ["Copa 2014", "Copa 2010", "Copa 2006", "Copa 1998"],
        correct_answer: 0,
        category: "selecoes",
        difficulty: "medio",
        explanation: "Na semifinal da Copa de 2014, a Alemanha goleou o Brasil por 7 a 1 no Mineirão.",
        created_at: new Date().toISOString(),
    },
    {
        id: "9",
        text: "Qual foi o mascote da Copa do Mundo de 1994 nos EUA?",
        options: ["Fuleco", "Striker", "Zakumi", "Footix"],
        correct_answer: 1,
        category: "curiosidades",
        difficulty: "dificil",
        explanation: "Striker era um cachorro que foi o mascote da Copa de 1994 nos Estados Unidos.",
        created_at: new Date().toISOString(),
    },
    {
        id: "10",
        text: "Quantas seleções participarão da Copa de 2026?",
        options: ["32", "40", "48", "64"],
        correct_answer: 2,
        category: "copa2026",
        difficulty: "medio",
        explanation: "A Copa de 2026 terá 48 seleções, um aumento em relação às 32 das edições anteriores.",
        created_at: new Date().toISOString(),
    },
];

export default function TreinoPage() {
    const { profile, refreshProfile } = useAuth();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
    const [showResult, setShowResult] = useState(false);
    const [result, setResult] = useState<QuizResult | null>(null);

    // Load questions
    useEffect(() => {
        const loadQuestions = async () => {
            setIsLoadingQuestions(true);

            try {
                const supabase = createClient();

                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Timeout")), 5000)
                );

                // Fetch all questions (no limit) so we can shuffle properly
                const queryPromise = supabase
                    .from("questions")
                    .select("*");

                const { data, error } = (await Promise.race([
                    queryPromise,
                    timeoutPromise.then(() => ({ data: null, error: new Error("Timeout") })),
                ])) as { data: Question[] | null; error: Error | null };

                if (error) {
                    console.log("Usando perguntas de exemplo:", error.message);
                    setQuestions(SAMPLE_QUESTIONS);
                } else if (!data || data.length === 0) {
                    console.log("Banco vazio, usando perguntas de exemplo");
                    setQuestions(SAMPLE_QUESTIONS);
                } else {
                    // Fisher-Yates shuffle for true randomization
                    const shuffled = [...data];
                    for (let i = shuffled.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                    }
                    // Take only 10 questions
                    setQuestions(shuffled.slice(0, 10));
                }
            } catch (err) {
                console.log("Erro ao carregar perguntas, usando exemplos:", err);
                setQuestions(SAMPLE_QUESTIONS);
            }

            setIsLoadingQuestions(false);
        };

        loadQuestions();

        // Track quiz start
        analytics.quizStart("treino");
    }, []);

    const handleComplete = (quizResult: QuizResult) => {
        setResult(quizResult);
        setShowResult(true);
        // ResultScreen handles saving to database
        refreshProfile();
    };

    const [hintsRemaining, setHintsRemaining] = useState(3);

    const handlePlayAgain = () => {
        setShowResult(false);
        setResult(null);
        setHintsRemaining(3);
        quiz.resetQuiz();
    };

    const handleUseHint = () => {
        setHintsRemaining((prev) => prev - 1);
    };

    const quiz = useQuiz({
        questions,
        mode: "treino",
        onComplete: handleComplete,
    });

    if (isLoadingQuestions) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-muted-foreground">Carregando perguntas...</p>
                </div>
            </div>
        );
    }

    // Show result screen
    if (showResult && result) {
        return (
            <ResultScreen
                result={result}
                mode="treino"
                profile={profile}
                onPlayAgain={handlePlayAgain}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
            {/* Header */}
            <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 h-14 flex items-center justify-between">
                    <Link href="/quiz" className="text-muted-foreground hover:text-foreground">
                        ← Voltar
                    </Link>
                    <Badge variant="outline" className="bg-blue-500/20 border-blue-500/30">
                        📚 Modo Treino
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => quiz.skipQuestion()}>
                        Pular
                    </Button>
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
                        showHint={true}
                        hintsRemaining={hintsRemaining}
                        onUseHint={handleUseHint}
                    />
                )}
            </main>
        </div>
    );
}
