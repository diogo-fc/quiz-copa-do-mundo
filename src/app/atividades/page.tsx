"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Activity {
    id: string;
    user_id: string;
    activity_type: string;
    data: Record<string, unknown>;
    created_at: string;
    user?: {
        id: string;
        name: string | null;
        avatar_url: string | null;
    };
}

const modeLabels: Record<string, string> = {
    treino: "Treino",
    desafio: "Desafio",
    diario: "Quiz Diário",
    duelo: "Duelo",
    "tematico-selecoes": "Seleções",
    "tematico-finais": "Finais",
    "tematico-artilheiros": "Artilheiros",
    "tematico-curiosidades": "Curiosidades",
    "tematico-copa2026": "Copa 2026",
};

const modeEmojis: Record<string, string> = {
    treino: "📚",
    desafio: "🏆",
    diario: "📅",
    duelo: "⚔️",
};

function getActivityMessage(activity: Activity): { emoji: string; text: string } {
    const { activity_type, data, user } = activity;
    const userName = user?.name || "Alguém";

    switch (activity_type) {
        case "quiz_completed": {
            const mode = data.mode as string;
            const accuracy = data.accuracy as number;
            const emoji = modeEmojis[mode] || "🎮";
            const modeName = modeLabels[mode] || mode;
            return {
                emoji,
                text: `${userName} completou ${modeName} com ${accuracy}% de acertos!`
            };
        }
        case "achievement_unlocked": {
            return {
                emoji: "🏅",
                text: `${userName} desbloqueou "${data.achievement_name}"`
            };
        }
        case "level_up": {
            return {
                emoji: "⬆️",
                text: `${userName} subiu para nível ${data.new_level}!`
            };
        }
        case "duel_won": {
            return {
                emoji: "⚔️",
                text: `${userName} venceu um duelo!`
            };
        }
        case "streak_milestone": {
            return {
                emoji: "🔥",
                text: `${userName} alcançou ${data.streak_days} dias de streak!`
            };
        }
        default:
            return { emoji: "📌", text: `${userName} fez algo incrível!` };
    }
}

export default function AtividadesPage() {
    const { profile, isLoading: isLoadingAuth } = useAuth();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadFeed = async () => {
            try {
                const response = await fetch("/api/feed");
                if (!response.ok) throw new Error("Failed to load feed");

                const data = await response.json();
                setActivities(data.activities || []);
            } catch (err) {
                console.error("Error loading feed:", err);
            }
            setIsLoading(false);
        };

        if (!isLoadingAuth) {
            loadFeed();
        }
    }, [isLoadingAuth]);

    if (isLoadingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-xl">Carregando...</div>
            </div>
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
                    <h1 className="font-semibold">Atividades</h1>
                    <div className="w-16" />
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-2xl">
                {/* Title */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold mb-2">📰 Feed de Atividades</h1>
                    <p className="text-muted-foreground">
                        Veja o que você e seus amigos estão fazendo
                    </p>
                </div>

                {/* Activities List */}
                {isLoading ? (
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <Card key={i} className="bg-card/50 border-border/50">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="flex-1">
                                        <Skeleton className="h-4 w-3/4 mb-2" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : activities.length === 0 ? (
                    <Card className="bg-card/50 border-border/50">
                        <CardContent className="p-8 text-center">
                            <span className="text-5xl mb-4 block">📭</span>
                            <h3 className="text-xl font-semibold mb-2">Nenhuma atividade ainda</h3>
                            <p className="text-muted-foreground mb-4">
                                {profile
                                    ? "Jogue um quiz para aparecer aqui! Adicione amigos para ver a atividade deles."
                                    : "Faça login para ver suas atividades e de amigos."
                                }
                            </p>
                            <Link href="/quiz">
                                <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                                    🎮 Jogar agora
                                </Badge>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {activities.map((activity) => {
                            const { emoji, text } = getActivityMessage(activity);
                            const isOwnActivity = activity.user_id === profile?.id;
                            const timeAgo = formatDistanceToNow(new Date(activity.created_at), {
                                addSuffix: true,
                                locale: ptBR,
                            });

                            return (
                                <Card
                                    key={activity.id}
                                    className={`bg-card/50 border-border/50 transition-all ${isOwnActivity ? "border-primary/30 bg-primary/5" : ""
                                        }`}
                                >
                                    <CardContent className="p-4 flex items-center gap-4">
                                        {/* Avatar */}
                                        <Avatar className="h-12 w-12 flex-shrink-0">
                                            <AvatarImage src={activity.user?.avatar_url || undefined} />
                                            <AvatarFallback>
                                                {activity.user?.name?.charAt(0) || "U"}
                                            </AvatarFallback>
                                        </Avatar>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">{emoji}</span>
                                                <p className="text-sm font-medium truncate">
                                                    {text}
                                                </p>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {timeAgo}
                                                {isOwnActivity && (
                                                    <Badge
                                                        variant="outline"
                                                        className="ml-2 text-[10px] border-primary/50 text-primary"
                                                    >
                                                        você
                                                    </Badge>
                                                )}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Info Card */}
                <Card className="bg-card/50 border-border/50 mt-6">
                    <CardContent className="p-4 text-center text-sm text-muted-foreground">
                        <p>
                            💡 Adicione amigos na página de{" "}
                            <Link href="/ranking" className="text-primary hover:underline">
                                Ranking
                            </Link>{" "}
                            para ver suas atividades aqui!
                        </p>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
