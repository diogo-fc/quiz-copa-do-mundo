"use client";

import { useState, useCallback, useEffect } from "react";
import { Question, GameMode } from "@/types";
import { calculateAnswerScore, calculateXP } from "@/lib/scoring";

interface UseQuizProps {
    questions: Question[];
    mode: GameMode;
    timePerQuestion?: number;
    onComplete?: (result: QuizResult) => void;
}

export interface QuizResult {
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    maxStreak: number;
    xpGained: number;
    timeSpent: number;
    answers: AnswerRecord[];
}

interface AnswerRecord {
    questionId: string;
    selectedAnswer: number;
    isCorrect: boolean;
}

interface QuizState {
    questions: Question[];
    currentQuestionIndex: number;
    score: number;
    correctAnswers: number;
    streak: number;
    answers: AnswerRecord[];
    isFinished: boolean;
    startedAt: Date | null;
}

export function useQuiz({
    questions,
    mode,
    timePerQuestion = 20,
    onComplete,
}: UseQuizProps) {
    const [state, setState] = useState<QuizState>({
        questions,
        currentQuestionIndex: 0,
        score: 0,
        correctAnswers: 0,
        streak: 0,
        answers: [],
        isFinished: false,
        startedAt: null,
    });

    const [maxStreak, setMaxStreak] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

    // Initialize quiz
    useEffect(() => {
        setState({
            questions,
            currentQuestionIndex: 0,
            score: 0,
            correctAnswers: 0,
            streak: 0,
            answers: [],
            isFinished: false,
            startedAt: new Date(),
        });
        setMaxStreak(0);

        if (mode === "desafio") {
            setTimeRemaining(5 * 60);
        } else if (mode !== "treino") {
            setTimeRemaining(timePerQuestion);
        }
    }, [questions, mode, timePerQuestion]);

    const currentQuestion = state.questions[state.currentQuestionIndex] || null;
    const isLastQuestion =
        state.currentQuestionIndex >= state.questions.length - 1;

    const handleAnswer = useCallback(
        (selectedIndex: number) => {
            if (state.isFinished || !currentQuestion) return;

            const isCorrect = selectedIndex === currentQuestion.correct_answer;
            const newStreak = isCorrect ? state.streak + 1 : 0;

            if (newStreak > maxStreak) {
                setMaxStreak(newStreak);
            }

            const answerScore = calculateAnswerScore({
                difficulty: currentQuestion.difficulty,
                isCorrect,
                currentStreak: newStreak,
                timeRemaining: timeRemaining ?? undefined,
                totalTime: mode === "desafio" ? 5 * 60 : timePerQuestion,
            });

            const newAnswer: AnswerRecord = {
                questionId: currentQuestion.id,
                selectedAnswer: selectedIndex,
                isCorrect,
            };

            const newAnswers = [...state.answers, newAnswer];
            const isFinishing = isLastQuestion;

            setState((prev) => ({
                ...prev,
                score: prev.score + answerScore,
                correctAnswers: isCorrect
                    ? prev.correctAnswers + 1
                    : prev.correctAnswers,
                streak: newStreak,
                answers: newAnswers,
                currentQuestionIndex: isFinishing
                    ? prev.currentQuestionIndex
                    : prev.currentQuestionIndex + 1,
                isFinished: isFinishing,
            }));

            if (isFinishing) {
                const finalScore = state.score + answerScore;
                const result: QuizResult = {
                    score: finalScore,
                    correctAnswers: isCorrect
                        ? state.correctAnswers + 1
                        : state.correctAnswers,
                    totalQuestions: state.questions.length,
                    maxStreak: Math.max(maxStreak, newStreak),
                    xpGained: calculateXP(finalScore, mode),
                    timeSpent: state.startedAt
                        ? Math.floor((Date.now() - state.startedAt.getTime()) / 1000)
                        : 0,
                    answers: newAnswers,
                };
                onComplete?.(result);
            }

            if (!isFinishing && mode !== "desafio" && mode !== "treino") {
                setTimeRemaining(timePerQuestion);
            }
        },
        [
            state,
            currentQuestion,
            isLastQuestion,
            maxStreak,
            timeRemaining,
            mode,
            timePerQuestion,
            onComplete,
        ]
    );

    const handleTimeUp = useCallback(() => {
        if (mode === "desafio") {
            setState((prev) => ({ ...prev, isFinished: true }));
            const result: QuizResult = {
                score: state.score,
                correctAnswers: state.correctAnswers,
                totalQuestions: state.questions.length,
                maxStreak,
                xpGained: calculateXP(state.score, mode),
                timeSpent: 5 * 60,
                answers: state.answers,
            };
            onComplete?.(result);
        } else {
            handleAnswer(-1);
        }
    }, [mode, state, maxStreak, handleAnswer, onComplete]);

    const resetQuiz = useCallback(() => {
        setState({
            questions: state.questions,
            currentQuestionIndex: 0,
            score: 0,
            correctAnswers: 0,
            streak: 0,
            answers: [],
            isFinished: false,
            startedAt: new Date(),
        });
        setMaxStreak(0);

        if (mode === "desafio") {
            setTimeRemaining(5 * 60);
        } else if (mode !== "treino") {
            setTimeRemaining(timePerQuestion);
        }
    }, [mode, timePerQuestion, state.questions]);

    const skipQuestion = useCallback(() => {
        if (state.isFinished || mode !== "treino") return;

        if (isLastQuestion) {
            setState((prev) => ({ ...prev, isFinished: true }));
        } else {
            setState((prev) => ({
                ...prev,
                currentQuestionIndex: prev.currentQuestionIndex + 1,
                streak: 0,
            }));
        }
    }, [state.isFinished, mode, isLastQuestion]);

    return {
        currentQuestion,
        questionIndex: state.currentQuestionIndex,
        totalQuestions: state.questions.length,
        score: state.score,
        correctAnswers: state.correctAnswers,
        streak: state.streak,
        maxStreak,
        isFinished: state.isFinished,
        timeRemaining,
        progress:
            ((state.currentQuestionIndex + 1) / state.questions.length) * 100,
        handleAnswer,
        handleTimeUp,
        resetQuiz,
        skipQuestion,
        setTimeRemaining,
    };
}
