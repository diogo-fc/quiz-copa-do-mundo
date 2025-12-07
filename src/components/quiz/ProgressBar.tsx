"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
    current: number;
    total: number;
    showLabel?: boolean;
    className?: string;
}

export function ProgressBar({
    current,
    total,
    showLabel = true,
    className,
}: ProgressBarProps) {
    const percentage = Math.round((current / total) * 100);

    return (
        <div className={cn("w-full", className)}>
            {showLabel && (
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Progresso</span>
                    <span className="text-sm font-medium">
                        {current} / {total}
                    </span>
                </div>
            )}
            <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                <div
                    className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
