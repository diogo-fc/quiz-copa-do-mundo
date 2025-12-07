"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface TimerProps {
    totalSeconds: number;
    onTimeUp?: () => void;
    isPaused?: boolean;
    variant?: "bar" | "circle" | "prominent";
    showSeconds?: boolean;
    className?: string;
}

export function Timer({
    totalSeconds,
    onTimeUp,
    isPaused = false,
    variant = "bar",
    showSeconds = true,
    className,
}: TimerProps) {
    const [timeRemaining, setTimeRemaining] = useState(totalSeconds);

    useEffect(() => {
        setTimeRemaining(totalSeconds);
    }, [totalSeconds]);

    useEffect(() => {
        if (isPaused || timeRemaining <= 0) return;

        const interval = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    onTimeUp?.();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isPaused, timeRemaining, onTimeUp]);

    const percentage = (timeRemaining / totalSeconds) * 100;
    const isLowTime = percentage <= 25;
    const isCriticalTime = percentage <= 10;

    const getTimeColor = useCallback(() => {
        if (percentage > 50) return "text-green-400";
        if (percentage > 25) return "text-yellow-400";
        return "text-red-400";
    }, [percentage]);

    const getBarColor = useCallback(() => {
        if (percentage > 50) return "bg-green-500";
        if (percentage > 25) return "bg-yellow-500";
        return "bg-red-500";
    }, [percentage]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    // Prominent variant - Large centered timer for challenge mode
    if (variant === "prominent") {
        const radius = 50;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (percentage / 100) * circumference;

        return (
            <div
                className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-2xl bg-card/50 border border-border/50",
                    isCriticalTime && "animate-pulse border-red-500/50 bg-red-500/10",
                    className
                )}
            >
                <div className="relative inline-flex items-center justify-center">
                    <svg
                        className={cn(
                            "w-32 h-32 -rotate-90 transition-transform",
                            isLowTime && !isCriticalTime && "scale-105",
                            isCriticalTime && "scale-110"
                        )}
                    >
                        {/* Background circle */}
                        <circle
                            cx="64"
                            cy="64"
                            r={radius}
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="10"
                            className="text-muted/30"
                        />
                        {/* Progress circle */}
                        <circle
                            cx="64"
                            cy="64"
                            r={radius}
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className={cn(
                                "transition-all duration-1000 ease-linear",
                                getBarColor().replace("bg-", "text-"),
                                isCriticalTime && "drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                            )}
                        />
                    </svg>
                    {showSeconds && (
                        <div className="absolute flex flex-col items-center">
                            <span
                                className={cn(
                                    "text-3xl font-bold tabular-nums transition-all",
                                    getTimeColor(),
                                    isCriticalTime && "animate-bounce"
                                )}
                            >
                                {formatTime(timeRemaining)}
                            </span>
                            <span className="text-xs text-muted-foreground">restante</span>
                        </div>
                    )}
                </div>
                {isLowTime && (
                    <p className={cn(
                        "mt-2 text-sm font-medium",
                        isCriticalTime ? "text-red-400" : "text-yellow-400"
                    )}>
                        {isCriticalTime ? "⚡ Tempo acabando!" : "⏰ Acelere!"}
                    </p>
                )}
            </div>
        );
    }

    if (variant === "circle") {
        const radius = 45;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (percentage / 100) * circumference;

        return (
            <div className={cn("relative inline-flex items-center justify-center", className)}>
                <svg className="w-28 h-28 -rotate-90">
                    {/* Background circle */}
                    <circle
                        cx="56"
                        cy="56"
                        r={radius}
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-muted/30"
                    />
                    {/* Progress circle */}
                    <circle
                        cx="56"
                        cy="56"
                        r={radius}
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className={cn("transition-all duration-1000 ease-linear", getBarColor().replace("bg-", "text-"))}
                    />
                </svg>
                {showSeconds && (
                    <span className={cn("absolute text-2xl font-bold", getTimeColor())}>
                        {formatTime(timeRemaining)}
                    </span>
                )}
            </div>
        );
    }

    // Bar variant (default)
    return (
        <div className={cn("w-full", className)}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                    ⏱️ Tempo
                </span>
                {showSeconds && (
                    <span
                        className={cn(
                            "text-sm font-bold tabular-nums",
                            getTimeColor(),
                            isCriticalTime && "animate-pulse"
                        )}
                    >
                        {formatTime(timeRemaining)}
                    </span>
                )}
            </div>
            <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
                <div
                    className={cn(
                        "h-full rounded-full transition-all duration-1000 ease-linear",
                        getBarColor(),
                        isCriticalTime && "animate-pulse"
                    )}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {isLowTime && (
                <p className={cn(
                    "mt-1 text-xs text-center font-medium",
                    isCriticalTime ? "text-red-400" : "text-yellow-400"
                )}>
                    {isCriticalTime ? "⚡ Tempo acabando!" : "⏰ Acelere!"}
                </p>
            )}
        </div>
    );
}

// Hook for timer logic
export function useTimer(totalSeconds: number, onTimeUp?: () => void) {
    const [timeRemaining, setTimeRemaining] = useState(totalSeconds);
    const [isPaused, setIsPaused] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    const reset = useCallback(() => {
        setTimeRemaining(totalSeconds);
        setIsFinished(false);
        setIsPaused(false);
    }, [totalSeconds]);

    const pause = useCallback(() => setIsPaused(true), []);
    const resume = useCallback(() => setIsPaused(false), []);

    useEffect(() => {
        if (isPaused || isFinished || timeRemaining <= 0) return;

        const interval = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    setIsFinished(true);
                    onTimeUp?.();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isPaused, isFinished, timeRemaining, onTimeUp]);

    return {
        timeRemaining,
        isPaused,
        isFinished,
        percentage: (timeRemaining / totalSeconds) * 100,
        pause,
        resume,
        reset,
    };
}
