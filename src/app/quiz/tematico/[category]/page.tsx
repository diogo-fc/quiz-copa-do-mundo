"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useQuiz, QuizResult } from "@/hooks/useQuiz";
import {
    QuestionCard,
    ProgressBar,
    ScoreDisplay,
    ResultScreen,
} from "@/components/quiz";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Question, QuestionCategory } from "@/types";

// Category metadata for display
const CATEGORY_INFO: Record<
    QuestionCategory,
    { label: string; icon: string; color: string }
> = {
    selecoes: { label: "Seleções", icon: "🏆", color: "bg-yellow-500/20 border-yellow-500/30" },
    artilheiros: { label: "Artilheiros", icon: "⚽", color: "bg-green-500/20 border-green-500/30" },
    finais: { label: "Finais", icon: "🥇", color: "bg-blue-500/20 border-blue-500/30" },
    curiosidades: { label: "Curiosidades", icon: "🎯", color: "bg-purple-500/20 border-purple-500/30" },
    copa2026: { label: "Copa 2026", icon: "🇺🇸", color: "bg-red-500/20 border-red-500/30" },
};

// Fallback questions for when API fails
const FALLBACK_QUESTIONS: Record<QuestionCategory, Question[]> = {
    selecoes: [
        {
            id: "s1",
            text: "Quantas Copas do Mundo o Brasil já venceu?",
            options: ["3", "4", "5", "6"],
            correct_answer: 2,
            category: "selecoes",
            difficulty: "facil",
            explanation: "O Brasil é o maior vencedor com 5 títulos: 1958, 1962, 1970, 1994 e 2002.",
            created_at: new Date().toISOString(),
        },
        {
            id: "s2",
            text: "Qual seleção é conhecida como 'La Roja'?",
            options: ["Portugal", "Argentina", "Espanha", "Chile"],
            correct_answer: 2,
            category: "selecoes",
            difficulty: "facil",
            explanation: "A Espanha é conhecida como 'La Roja' por jogar de vermelho.",
            created_at: new Date().toISOString(),
        },
    ],
    artilheiros: [
        {
            id: "a1",
            text: "Quem é o maior artilheiro da história das Copas?",
            options: ["Pelé", "Ronaldo", "Miroslav Klose", "Gerd Müller"],
            correct_answer: 2,
            category: "artilheiros",
            difficulty: "medio",
            explanation: "Miroslav Klose é o maior artilheiro com 16 gols.",
            created_at: new Date().toISOString(),
        },
        {
            id: "a2",
            text: "Qual jogador é conhecido como 'O Fenômeno'?",
            options: ["Romário", "Ronaldo", "Ronaldinho", "Neymar"],
            correct_answer: 1,
            category: "artilheiros",
            difficulty: "facil",
            explanation: "Ronaldo Nazário é conhecido como 'O Fenômeno'.",
            created_at: new Date().toISOString(),
        },
    ],
    finais: [
        {
            id: "f1",
            text: "Qual país venceu a primeira Copa do Mundo em 1930?",
            options: ["Brasil", "Argentina", "Uruguai", "Itália"],
            correct_answer: 2,
            category: "finais",
            difficulty: "facil",
            explanation: "O Uruguai venceu a primeira Copa do Mundo em casa.",
            created_at: new Date().toISOString(),
        },
        {
            id: "f2",
            text: "Qual seleção foi campeã da Copa do Mundo de 2018?",
            options: ["Alemanha", "França", "Croácia", "Bélgica"],
            correct_answer: 1,
            category: "finais",
            difficulty: "facil",
            explanation: "A França venceu a Copa de 2018 na Rússia.",
            created_at: new Date().toISOString(),
        },
    ],
    curiosidades: [
        {
            id: "c1",
            text: "Em qual país foi realizada a Copa do Mundo de 2014?",
            options: ["Alemanha", "África do Sul", "Brasil", "Rússia"],
            correct_answer: 2,
            category: "curiosidades",
            difficulty: "facil",
            explanation: "A Copa de 2014 foi sediada pelo Brasil.",
            created_at: new Date().toISOString(),
        },
        {
            id: "c2",
            text: "Qual foi o mascote da Copa do Mundo de 1994 nos EUA?",
            options: ["Fuleco", "Striker", "Zakumi", "Footix"],
            correct_answer: 1,
            category: "curiosidades",
            difficulty: "dificil",
            explanation: "Striker era um cachorro, mascote da Copa de 1994.",
            created_at: new Date().toISOString(),
        },
    ],
    copa2026: [
        {
            id: "2026-1",
            text: "Quantos países sediarão a Copa do Mundo de 2026?",
            options: ["1", "2", "3", "4"],
            correct_answer: 2,
            category: "copa2026",
            difficulty: "medio",
            explanation: "A Copa de 2026 será sediada por 3 países: EUA, México e Canadá.",
            created_at: new Date().toISOString(),
        },
        {
            id: "2026-2",
            text: "Quantas seleções participarão da Copa de 2026?",
            options: ["32", "40", "48", "64"],
            correct_answer: 2,
            category: "copa2026",
            difficulty: "medio",
            explanation: "A Copa de 2026 terá 48 seleções.",
            created_at: new Date().toISOString(),
        },
    ],
};

const VALID_CATEGORIES = Object.keys(CATEGORY_INFO) as QuestionCategory[];

export default function TematicoQuizPage() {
    const params = useParams();
    const router = useRouter();
    const { profile, refreshProfile } = useAuth();

    const categoryParam = params.category as string;
    const category = VALID_CATEGORIES.includes(categoryParam as QuestionCategory)
        ? (categoryParam as QuestionCategory)
        : null;

    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
    const [showResult, setShowResult] = useState(false);
    const [result, setResult] = useState<QuizResult | null>(null);

    // Redirect if invalid category
    useEffect(() => {
        if (!category) {
            router.replace("/quiz/tematico");
        }
    }, [category, router]);

    // Load questions from API
    useEffect(() => {
        if (!category) return;

        const loadQuestions = async () => {
            setIsLoadingQuestions(true);

            try {
                const response = await fetch(
                    `/api/questions?category=${category}&limit=10`
                );
                const data = await response.json();

                if (response.ok && data.questions?.length > 0) {
                    setQuestions(data.questions);
                } else {
                    console.log("Using fallback questions for:", category);
                    setQuestions(FALLBACK_QUESTIONS[category] || []);
                }
            } catch (err) {
                console.error("Error loading questions:", err);
                setQuestions(FALLBACK_QUESTIONS[category] || []);
            }

            setIsLoadingQuestions(false);
        };

        loadQuestions();
    }, [category]);

    const handleComplete = (quizResult: QuizResult) => {
        setResult(quizResult);
        setShowResult(true);
        refreshProfile();
    };

    const handlePlayAgain = () => {
        setShowResult(false);
        setResult(null);
        quiz.resetQuiz();
    };

    const quiz = useQuiz({
        questions,
        mode: "treino", // Temático uses treino mode (no time limit, 0.5x XP)
        onComplete: handleComplete,
    });

    if (!category) {
        return null; // Will redirect
    }

    const categoryInfo = CATEGORY_INFO[category];

    if (isLoadingQuestions) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-muted-foreground">
                        Carregando perguntas de {categoryInfo.label}...
                    </p>
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
                    <Link
                        href="/quiz/tematico"
                        className="text-muted-foreground hover:text-foreground"
                    >
                        ← Voltar
                    </Link>
                    <Badge
                        variant="outline"
                        className={categoryInfo.color}
                    >
                        {categoryInfo.icon} {categoryInfo.label}
                    </Badge>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => quiz.skipQuestion()}
                    >
                        Pular
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6 max-w-2xl">
                {/* Progress */}
                <div className="mb-6">
                    <ProgressBar
                        current={quiz.questionIndex + 1}
                        total={quiz.totalQuestions}
                    />
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
