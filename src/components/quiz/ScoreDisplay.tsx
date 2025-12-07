"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLevelTitle } from "@/lib/scoring";

interface ScoreDisplayProps {
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    streak: number;
    xpGained?: number;
    className?: string;
}

export function ScoreDisplay({
    score,
    correctAnswers,
    totalQuestions,
    streak,
    xpGained,
    className,
}: ScoreDisplayProps) {
    const accuracy = Math.round((correctAnswers / totalQuestions) * 100);

    return (
        <Card className={cn("bg-card/50 backdrop-blur-sm border-border/50", className)}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                    {/* Score */}
                    <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{score}</p>
                        <p className="text-xs text-muted-foreground">Pontos</p>
                    </div>

                    {/* Divider */}
                    <div className="h-10 w-px bg-border/50" />

                    {/* Accuracy */}
                    <div className="text-center">
                        <p className="text-lg font-semibold">
                            {correctAnswers}/{totalQuestions}
                        </p>
                        <p className="text-xs text-muted-foreground">{accuracy}% acertos</p>
                    </div>

                    {/* Divider */}
                    <div className="h-10 w-px bg-border/50" />

                    {/* Streak */}
                    <div className="text-center">
                        {streak >= 3 ? (
                            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                                🔥 {streak}x
                            </Badge>
                        ) : (
                            <p className="text-lg font-semibold">{streak}x</p>
                        )}
                        <p className="text-xs text-muted-foreground">Streak</p>
                    </div>

                    {/* XP Gained */}
                    {xpGained !== undefined && (
                        <>
                            <div className="h-10 w-px bg-border/50" />
                            <div className="text-center">
                                <p className="text-lg font-semibold text-green-400">+{xpGained}</p>
                                <p className="text-xs text-muted-foreground">XP</p>
                            </div>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

interface LevelBadgeProps {
    level: number;
    xp: number;
    className?: string;
}

export function LevelBadge({ level, xp, className }: LevelBadgeProps) {
    const title = getLevelTitle(level);

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Badge className="bg-primary/20 text-primary border-primary/30">
                Nível {level}
            </Badge>
            <span className="text-sm text-muted-foreground">{title}</span>
        </div>
    );
}
