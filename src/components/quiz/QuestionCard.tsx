"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Question } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface QuestionCardProps {
    question: Question;
    questionNumber: number;
    totalQuestions: number;
    onAnswer: (index: number) => void;
    disabled?: boolean;
    showHint?: boolean;
    onUseHint?: () => void;
    hintsRemaining?: number;
}

const difficultyColors = {
    facil: "bg-green-500/20 text-green-400 border-green-500/30",
    medio: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    dificil: "bg-red-500/20 text-red-400 border-red-500/30",
};

const difficultyLabels = {
    facil: "Fácil",
    medio: "Médio",
    dificil: "Difícil",
};

const categoryLabels: Record<string, string> = {
    selecoes: "Seleções",
    finais: "Finais",
    artilheiros: "Artilheiros",
    curiosidades: "Curiosidades",
    copa2026: "Copa 2026",
};

export function QuestionCard({
    question,
    questionNumber,
    totalQuestions,
    onAnswer,
    disabled = false,
    showHint = false,
    onUseHint,
    hintsRemaining = 0,
}: QuestionCardProps) {
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]);

    // Reset state when question changes, preserving scroll position for mobile
    useEffect(() => {
        // Save current scroll position before state changes
        const scrollY = window.scrollY;

        setSelectedAnswer(null);
        setShowResult(false);
        setEliminatedOptions([]);

        // Restore scroll position after a microtask to prevent iOS auto-scroll to top
        queueMicrotask(() => {
            window.scrollTo(0, scrollY);
        });
    }, [question.id]);

    const handleAnswer = useCallback(
        (index: number) => {
            if (disabled || showResult || eliminatedOptions.includes(index)) return;

            setSelectedAnswer(index);
            setShowResult(true);

            // Delay before moving to next question (3 seconds to read explanation)
            setTimeout(() => {
                onAnswer(index);
            }, 3000);
        },
        [disabled, showResult, eliminatedOptions, onAnswer]
    );

    const handleUseHint = useCallback(() => {
        if (!onUseHint || hintsRemaining <= 0) return;

        // Eliminate 2 wrong options randomly
        const wrongOptions = question.options
            .map((_, idx) => idx)
            .filter((idx) => idx !== question.correct_answer);

        const shuffled = wrongOptions.sort(() => Math.random() - 0.5);
        const toEliminate = shuffled.slice(0, 2);

        setEliminatedOptions(toEliminate);
        onUseHint();
    }, [onUseHint, hintsRemaining, question]);

    const getOptionStyle = (index: number) => {
        if (eliminatedOptions.includes(index)) {
            return "opacity-30 cursor-not-allowed line-through";
        }

        if (!showResult) {
            return "hover:bg-primary/10 hover:border-primary/50 cursor-pointer";
        }

        if (index === question.correct_answer) {
            return "bg-green-500/20 border-green-500 text-green-400";
        }

        if (index === selectedAnswer && index !== question.correct_answer) {
            return "bg-red-500/20 border-red-500 text-red-400";
        }

        return "opacity-50";
    };

    return (
        <Card className="w-full max-w-2xl mx-auto bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            Pergunta {questionNumber} de {totalQuestions}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className={difficultyColors[question.difficulty]}>
                            {difficultyLabels[question.difficulty]}
                        </Badge>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                            {categoryLabels[question.category]}
                        </Badge>
                    </div>
                </div>

                {/* Question */}
                <h2 className="text-xl md:text-2xl font-semibold text-center mb-8 leading-relaxed">
                    {question.text}
                </h2>

                {/* Options */}
                <div className="grid gap-3">
                    {question.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => handleAnswer(index)}
                            disabled={disabled || showResult || eliminatedOptions.includes(index)}
                            className={cn(
                                "w-full p-4 text-left rounded-lg border-2 border-border/50 transition-all duration-200",
                                "focus:outline-none focus:ring-2 focus:ring-primary/50",
                                getOptionStyle(index)
                            )}
                        >
                            <span className="flex items-center gap-3">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                                    {String.fromCharCode(65 + index)}
                                </span>
                                <span className="flex-1">{option}</span>
                            </span>
                        </button>
                    ))}
                </div>

                {/* Hint Button */}
                {showHint && !showResult && eliminatedOptions.length === 0 && (
                    <div className="mt-6 flex justify-center">
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={handleUseHint}
                            disabled={hintsRemaining <= 0}
                            className={cn(
                                "gap-2 transition-all",
                                hintsRemaining > 0
                                    ? "text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/10 hover:scale-105"
                                    : "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <span className="text-lg">💡</span>
                            <span className="font-semibold">50/50</span>
                            {hintsRemaining > 0 ? (
                                <Badge
                                    variant="outline"
                                    className="ml-1 bg-yellow-400/20 text-yellow-400 border-yellow-400/30"
                                >
                                    {hintsRemaining}
                                </Badge>
                            ) : (
                                <span className="text-xs text-muted-foreground ml-1">(sem dicas)</span>
                            )}
                        </Button>
                    </div>
                )}

                {/* Explanation */}
                {showResult && question.explanation && (
                    <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border/50">
                        <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">💡 Curiosidade:</span>{" "}
                            {question.explanation}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
