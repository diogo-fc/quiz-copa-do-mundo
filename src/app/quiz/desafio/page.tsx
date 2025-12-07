"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useQuiz, QuizResult } from "@/hooks/useQuiz";
import { QuestionCard, ProgressBar, ScoreDisplay, Timer, ResultScreen } from "@/components/quiz";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { Question } from "@/types";

// Sample questions for development
const SAMPLE_QUESTIONS: Question[] = [
    {
        id: "d1",
        text: "Qual país venceu a Copa do Mundo de 2022 no Qatar?",
        options: ["Brasil", "Argentina", "França", "Croácia"],
        correct_answer: 1,
        category: "finais",
        difficulty: "facil",
        explanation: "A Argentina venceu a Copa de 2022, derrotando a França nos pênaltis após empate de 3 a 3.",
        created_at: new Date().toISOString(),
    },
    {
        id: "d2",
        text: "Quem marcou o gol do título do Brasil na Copa de 2002?",
        options: ["Ronaldo", "Rivaldo", "Ronaldinho", "Cafu"],
        correct_answer: 0,
        category: "artilheiros",
        difficulty: "medio",
        explanation: "Ronaldo marcou 2 gols na final contra a Alemanha (2x0), incluindo o gol do título.",
        created_at: new Date().toISOString(),
    },
    {
        id: "d3",
        text: "Em que ano foi realizada a primeira Copa do Mundo?",
        options: ["1928", "1930", "1932", "1934"],
        correct_answer: 1,
        category: "curiosidades",
        difficulty: "facil",
        explanation: "A primeira Copa do Mundo foi realizada em 1930, no Uruguai.",
        created_at: new Date().toISOString(),
    },
    {
        id: "d4",
        text: "Qual seleção tem mais títulos de Copa do Mundo?",
        options: ["Alemanha", "Itália", "Brasil", "Argentina"],
        correct_answer: 2,
        category: "selecoes",
        difficulty: "facil",
        explanation: "O Brasil é o maior campeão com 5 títulos mundiais.",
        created_at: new Date().toISOString(),
    },
    {
        id: "d5",
        text: "Quem é o único jogador a vencer 3 Copas do Mundo?",
        options: ["Maradona", "Pelé", "Zidane", "Beckenbauer"],
        correct_answer: 1,
        category: "artilheiros",
        difficulty: "medio",
        explanation: "Pelé é o único jogador a conquistar 3 Copas: 1958, 1962 e 1970.",
        created_at: new Date().toISOString(),
    },
    {
        id: "d6",
        text: "Qual país sediou a Copa de 1998?",
        options: ["Alemanha", "Espanha", "França", "Itália"],
        correct_answer: 2,
        category: "curiosidades",
        difficulty: "facil",
        explanation: "A Copa de 1998 foi sediada pela França, que também foi campeã.",
        created_at: new Date().toISOString(),
    },
    {
        id: "d7",
        text: "Quantos gols Ronaldo marcou na Copa de 2002?",
        options: ["6", "7", "8", "9"],
        correct_answer: 2,
        category: "artilheiros",
        difficulty: "dificil",
        explanation: "Ronaldo marcou 8 gols na Copa de 2002, sendo o artilheiro do torneio.",
        created_at: new Date().toISOString(),
    },
    {
        id: "d8",
        text: "Qual foi o placar da final da Copa de 1970?",
        options: ["Brasil 4x1 Itália", "Brasil 3x1 Itália", "Brasil 2x1 Itália", "Brasil 3x2 Itália"],
        correct_answer: 0,
        category: "finais",
        difficulty: "medio",
        explanation: "O Brasil venceu a Itália por 4 a 1 na final da Copa de 1970 no México.",
        created_at: new Date().toISOString(),
    },
    {
        id: "d9",
        text: "Qual cidade sediará a final da Copa de 2026?",
        options: ["Los Angeles", "Nova York", "Miami", "Cidade do México"],
        correct_answer: 1,
        category: "copa2026",
        difficulty: "dificil",
        explanation: "A final será no MetLife Stadium, em Nova Jersey (região de Nova York).",
        created_at: new Date().toISOString(),
    },
    {
        id: "d10",
        text: "Qual goleiro brasileiro é recordista de jogos em Copas?",
        options: ["Taffarel", "Dida", "Cláudio", "Marcos"],
        correct_answer: 0,
        category: "selecoes",
        difficulty: "dificil",
        explanation: "Taffarel disputou 18 jogos em Copas do Mundo (1990, 1994, 1998).",
        created_at: new Date().toISOString(),
    },
    {
        id: "d11",
        text: "Em qual Copa aconteceu a 'Mão de Deus' de Maradona?",
        options: ["1982", "1986", "1990", "1994"],
        correct_answer: 1,
        category: "curiosidades",
        difficulty: "medio",
        explanation: "O famoso gol de mão de Maradona foi contra a Inglaterra nas quartas de final da Copa de 1986.",
        created_at: new Date().toISOString(),
    },
    {
        id: "d12",
        text: "Quantas Copas a Itália já venceu?",
        options: ["2", "3", "4", "5"],
        correct_answer: 2,
        category: "selecoes",
        difficulty: "facil",
        explanation: "A Itália tem 4 títulos: 1934, 1938, 1982 e 2006.",
        created_at: new Date().toISOString(),
    },
    {
        id: "d13",
        text: "Qual país foi campeão da Copa de 2010?",
        options: ["Holanda", "Alemanha", "Espanha", "Brasil"],
        correct_answer: 2,
        category: "finais",
        difficulty: "facil",
        explanation: "A Espanha venceu sua primeira Copa em 2010, derrotando a Holanda por 1 a 0.",
        created_at: new Date().toISOString(),
    },
    {
        id: "d14",
        text: "Qual jogador francês marcou 4 gols em uma única partida de Copa?",
        options: ["Zidane", "Henry", "Fontaine", "Mbappé"],
        correct_answer: 2,
        category: "artilheiros",
        difficulty: "dificil",
        explanation: "Just Fontaine marcou 4 gols contra a Alemanha Ocidental na Copa de 1958.",
        created_at: new Date().toISOString(),
    },
    {
        id: "d15",
        text: "Em qual estádio foi realizada a final da Copa de 2014?",
        options: ["Maracanã", "Mané Garrincha", "Arena Corinthians", "Mineirão"],
        correct_answer: 0,
        category: "curiosidades",
        difficulty: "facil",
        explanation: "A final da Copa de 2014 foi no Maracanã, com vitória da Alemanha sobre a Argentina.",
        created_at: new Date().toISOString(),
    },
];

export default function DesafioPage() {
    const { profile, refreshProfile } = useAuth();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
    const [showResult, setShowResult] = useState(false);
    const [result, setResult] = useState<QuizResult | null>(null);
    const [hintsRemaining, setHintsRemaining] = useState(2);

    // Load questions
    useEffect(() => {
        const loadQuestions = async () => {
            setIsLoadingQuestions(true);
            try {
                const supabase = createClient();

                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Timeout")), 5000)
                );

                // Fetch all questions so we can shuffle properly
                const queryPromise = supabase.from("questions").select("*");

                const { data, error } = (await Promise.race([
                    queryPromise,
                    timeoutPromise.then(() => ({ data: null, error: new Error("Timeout") })),
                ])) as { data: Question[] | null; error: Error | null };

                if (error || !data || data.length < 15) {
                    console.log("Usando perguntas de exemplo");
                    setQuestions(SAMPLE_QUESTIONS);
                } else {
                    // Fisher-Yates shuffle for true randomization
                    const shuffled = [...data];
                    for (let i = shuffled.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                    }
                    // Take only 15 questions for desafio mode
                    setQuestions(shuffled.slice(0, 15));
                }
            } catch (err) {
                console.log("Erro:", err);
                setQuestions(SAMPLE_QUESTIONS);
            }
            setIsLoadingQuestions(false);
        };

        loadQuestions();
    }, []);

    const handleComplete = (quizResult: QuizResult) => {
        setResult(quizResult);
        setShowResult(true);
        refreshProfile();
    };

    const handlePlayAgain = () => {
        setShowResult(false);
        setResult(null);
        setHintsRemaining(2);
        quiz.resetQuiz();
    };

    const quiz = useQuiz({
        questions,
        mode: "desafio",
        onComplete: handleComplete,
    });

    const handleUseHint = () => {
        setHintsRemaining((prev) => prev - 1);
    };

    if (isLoadingQuestions) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-muted-foreground">Preparando desafio...</p>
                </div>
            </div>
        );
    }

    // Show result screen
    if (showResult && result) {
        return (
            <ResultScreen
                result={result}
                mode="desafio"
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
                        ← Sair
                    </Link>
                    <Badge variant="outline" className="bg-orange-500/20 border-orange-500/30">
                        ⏱️ Modo Desafio
                    </Badge>
                    <div className="w-16" />
                </div>
            </header>

            <main className="container mx-auto px-4 py-6 max-w-2xl">
                {/* Timer */}
                <div className="mb-6">
                    <Timer totalSeconds={5 * 60} onTimeUp={quiz.handleTimeUp} variant="prominent" />
                </div>

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
