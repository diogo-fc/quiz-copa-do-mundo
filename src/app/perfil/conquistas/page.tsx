"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllAchievements } from "@/lib/achievements";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AchievementType } from "@/types";

export default function ConquistasPage() {
    const { profile, isLoading } = useAuth();
    const [unlockedAchievements, setUnlockedAchievements] = useState<AchievementType[]>([]);
    const [isLoadingAchievements, setIsLoadingAchievements] = useState(true);

    const allAchievements = getAllAchievements();

    useEffect(() => {
        const loadAchievements = async () => {
            if (!profile?.id) return;

            setIsLoadingAchievements(true);
            try {
                const supabase = createClient();

                const timeoutPromise = new Promise((resolve) =>
                    setTimeout(() => resolve({ data: [] }), 3000)
                );

                const queryPromise = supabase
                    .from("user_achievements")
                    .select("achievement_type")
                    .eq("user_id", profile.id);

                const result = await Promise.race([queryPromise, timeoutPromise]) as { data: { achievement_type: AchievementType }[] | null };

                if (result?.data) {
                    setUnlockedAchievements(result.data.map((a) => a.achievement_type));
                }
            } catch (err) {
                console.log("Erro ao carregar conquistas:", err);
            }
            setIsLoadingAchievements(false);
        };

        loadAchievements();
    }, [profile?.id]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-xl">Carregando...</div>
            </div>
        );
    }

    const unlockedCount = unlockedAchievements.length;
    const totalCount = allAchievements.length;
    const progressPercent = Math.round((unlockedCount / totalCount) * 100);

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
            {/* Header */}
            <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 h-14 flex items-center justify-between">
                    <Link href="/quiz" className="text-muted-foreground hover:text-foreground">
                        ← Voltar
                    </Link>
                    <h1 className="font-semibold">Conquistas</h1>
                    <Badge variant="outline">
                        {unlockedCount}/{totalCount}
                    </Badge>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-2xl">
                {/* Progress Card */}
                <Card className="bg-card/50 backdrop-blur-sm border-border/50 mb-6">
                    <CardContent className="p-6 text-center">
                        <div className="text-5xl mb-3">🏆</div>
                        <h2 className="text-xl font-bold mb-2">
                            {unlockedCount} de {totalCount} Conquistas
                        </h2>
                        <p className="text-muted-foreground text-sm mb-4">
                            {progressPercent}% completado
                        </p>
                        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Achievements Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {isLoadingAchievements ? (
                        [...Array(6)].map((_, i) => (
                            <Card key={i} className="bg-card/50 border-border/50">
                                <CardContent className="p-4 text-center">
                                    <Skeleton className="h-12 w-12 rounded-full mx-auto mb-2" />
                                    <Skeleton className="h-4 w-20 mx-auto mb-1" />
                                    <Skeleton className="h-3 w-24 mx-auto" />
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        allAchievements.map((achievement) => {
                            const isUnlocked = unlockedAchievements.includes(achievement.id);

                            return (
                                <Card
                                    key={achievement.id}
                                    className={`bg-card/50 border-border/50 transition-all ${isUnlocked
                                        ? "border-primary/50"
                                        : "opacity-50 grayscale"
                                        }`}
                                >
                                    <CardContent className="p-4 text-center">
                                        <div
                                            className={`text-4xl mb-2 ${isUnlocked ? "" : "filter grayscale"
                                                }`}
                                        >
                                            {achievement.icon}
                                        </div>
                                        <h3 className="font-semibold text-sm mb-1">
                                            {achievement.name}
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            {achievement.description}
                                        </p>
                                        {isUnlocked && (
                                            <Badge className="mt-2 bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                                                ✓ Desbloqueada
                                            </Badge>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            </main>
        </div>
    );
}
