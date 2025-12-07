"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type RankingPeriod = "weekly" | "monthly" | "alltime";
type RankingType = "global" | "friends";

interface RankingUser {
    user_id: string;
    score: number;
    position: number;
    name: string | null;
    avatar_url: string | null;
    level: number;
}

export default function RankingPage() {
    const { profile, isLoading } = useAuth();
    const [rankings, setRankings] = useState<RankingUser[]>([]);
    const [friendsRankings, setFriendsRankings] = useState<RankingUser[]>([]);
    const [isLoadingRankings, setIsLoadingRankings] = useState(true);
    const [currentPeriod, setCurrentPeriod] = useState<RankingPeriod>("weekly");
    const [currentType, setCurrentType] = useState<RankingType>("global");
    const [userPosition, setUserPosition] = useState<number | null>(null);

    // Load global rankings
    useEffect(() => {
        const loadRankings = async () => {
            setIsLoadingRankings(true);
            try {
                // Call the ranking API with period
                const response = await fetch(`/api/ranking?period=${currentPeriod}&limit=50`);

                if (response.ok) {
                    const data = await response.json();
                    setRankings(data.rankings || []);

                    // Find user position
                    if (profile?.id) {
                        const userRank = data.rankings?.find((r: RankingUser) => r.user_id === profile.id);
                        setUserPosition(userRank?.position || null);
                    }
                } else {
                    // Fallback to demo data
                    setRankings([
                        { user_id: "1", name: "João Silva", avatar_url: null, score: 5420, level: 15, position: 1 },
                        { user_id: "2", name: "Maria Santos", avatar_url: null, score: 4890, level: 14, position: 2 },
                        { user_id: "3", name: "Pedro Oliveira", avatar_url: null, score: 4200, level: 12, position: 3 },
                        { user_id: "4", name: "Ana Costa", avatar_url: null, score: 3850, level: 11, position: 4 },
                        { user_id: "5", name: "Lucas Ferreira", avatar_url: null, score: 3200, level: 10, position: 5 },
                    ]);
                }
            } catch (err) {
                console.error("Error loading rankings:", err);
                // Demo data on error
                setRankings([
                    { user_id: "1", name: "João Silva", avatar_url: null, score: 5420, level: 15, position: 1 },
                    { user_id: "2", name: "Maria Santos", avatar_url: null, score: 4890, level: 14, position: 2 },
                ]);
            }
            setIsLoadingRankings(false);
        };

        loadRankings();
    }, [currentPeriod, profile?.id]);

    // Load friends rankings
    useEffect(() => {
        const loadFriendsRankings = async () => {
            if (!profile?.id) return;

            try {
                const response = await fetch("/api/friends");
                if (!response.ok) return;

                const { friends } = await response.json();

                if (friends && friends.length > 0) {
                    // Include current user in friends ranking
                    const allUsers = [
                        {
                            user_id: profile.id,
                            name: profile.name,
                            avatar_url: profile.avatar_url,
                            score: profile.xp,
                            level: profile.level,
                            position: 0
                        },
                        ...friends.map((f: { id: string; name: string; avatar_url: string; xp: number; level: number }) => ({
                            user_id: f.id,
                            name: f.name,
                            avatar_url: f.avatar_url,
                            score: f.xp,
                            level: f.level,
                            position: 0
                        }))
                    ];

                    // Sort by XP and assign positions
                    allUsers.sort((a, b) => b.score - a.score);
                    allUsers.forEach((u, i) => u.position = i + 1);

                    setFriendsRankings(allUsers);
                }
            } catch (err) {
                console.error("Error loading friends:", err);
            }
        };

        loadFriendsRankings();
    }, [profile]);

    const getMedalEmoji = (position: number) => {
        switch (position) {
            case 1: return "🥇";
            case 2: return "🥈";
            case 3: return "🥉";
            default: return null;
        }
    };

    const getPeriodLabel = (period: RankingPeriod) => {
        switch (period) {
            case "weekly": return "Esta Semana";
            case "monthly": return "Este Mês";
            case "alltime": return "Todos os Tempos";
        }
    };

    if (isLoading) {
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
                    <h1 className="font-semibold">Rankings</h1>
                    <div className="w-16" />
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-2xl">
                {/* Title */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold mb-2">🏆 Rankings</h1>
                    <p className="text-muted-foreground">Os melhores jogadores do Copa Quiz Battle</p>
                </div>

                {/* User Position Card */}
                {profile && (
                    <Card className="bg-primary/10 border-primary/30 mb-6">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12 border-2 border-primary/30">
                                        <AvatarImage src={profile.avatar_url || undefined} />
                                        <AvatarFallback>{profile.name?.charAt(0) || "U"}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{profile.name || "Você"}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {profile.xp.toLocaleString()} XP • Nível {profile.level}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold text-primary">
                                        #{userPosition || "—"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{getPeriodLabel(currentPeriod)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Type Toggle */}
                <div className="flex justify-center gap-2 mb-4">
                    <Button
                        variant={currentType === "global" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentType("global")}
                    >
                        🌍 Global
                    </Button>
                    <Button
                        variant={currentType === "friends" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentType("friends")}
                    >
                        👥 Amigos
                        {friendsRankings.length > 1 && (
                            <Badge variant="secondary" className="ml-2 text-[10px]">
                                {friendsRankings.length - 1}
                            </Badge>
                        )}
                    </Button>
                </div>

                {/* Period Tabs */}
                <Tabs value={currentPeriod} onValueChange={(v) => setCurrentPeriod(v as RankingPeriod)}>
                    <TabsList className="w-full mb-6">
                        <TabsTrigger value="weekly" className="flex-1">
                            📅 Semanal
                        </TabsTrigger>
                        <TabsTrigger value="monthly" className="flex-1">
                            📆 Mensal
                        </TabsTrigger>
                        <TabsTrigger value="alltime" className="flex-1">
                            🏆 Geral
                        </TabsTrigger>
                    </TabsList>

                    {/* All tabs share same content - just different data */}
                    {["weekly", "monthly", "alltime"].map((period) => (
                        <TabsContent key={period} value={period}>
                            {currentType === "friends" ? (
                                friendsRankings.length > 1 ? (
                                    <RankingList
                                        rankings={friendsRankings}
                                        isLoading={false}
                                        currentUserId={profile?.id}
                                        getMedalEmoji={getMedalEmoji}
                                    />
                                ) : (
                                    <Card className="bg-card/50 border-border/50">
                                        <CardContent className="p-6">
                                            <div className="text-center mb-6">
                                                <span className="text-5xl mb-4 block">👥</span>
                                                <h3 className="text-xl font-semibold mb-2">Adicione Amigos</h3>
                                                <p className="text-muted-foreground text-sm">
                                                    Digite o email do seu amigo para adicioná-lo
                                                </p>
                                            </div>
                                            <AddFriendForm onSuccess={() => window.location.reload()} />
                                        </CardContent>
                                    </Card>
                                )
                            ) : (
                                <RankingList
                                    rankings={rankings}
                                    isLoading={isLoadingRankings}
                                    currentUserId={profile?.id}
                                    getMedalEmoji={getMedalEmoji}
                                />
                            )}
                        </TabsContent>
                    ))}
                </Tabs>

                {/* Info Card */}
                <Card className="bg-card/50 border-border/50 mt-6">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            ℹ️ Como funciona o ranking
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        <ul className="space-y-1">
                            <li>• <strong>Semanal:</strong> Redefine toda segunda-feira</li>
                            <li>• <strong>Mensal:</strong> Redefine no primeiro dia do mês</li>
                            <li>• <strong>Geral:</strong> Acumulado desde o início</li>
                            <li>• Rankings são atualizados a cada hora</li>
                        </ul>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

function RankingList({
    rankings,
    isLoading,
    currentUserId,
    getMedalEmoji,
}: {
    rankings: RankingUser[];
    isLoading: boolean;
    currentUserId?: string;
    getMedalEmoji: (position: number) => string | null;
}) {
    if (isLoading) {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <Card key={i} className="bg-card/50 border-border/50">
                        <CardContent className="p-4 flex items-center gap-4">
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="flex-1">
                                <Skeleton className="h-4 w-32 mb-2" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                            <Skeleton className="h-6 w-20" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (rankings.length === 0) {
        return (
            <Card className="bg-card/50 border-border/50">
                <CardContent className="p-8 text-center">
                    <span className="text-5xl mb-4 block">🏆</span>
                    <h3 className="text-xl font-semibold mb-2">Ranking Vazio</h3>
                    <p className="text-muted-foreground">
                        Seja o primeiro a entrar no ranking jogando!
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-2">
            {rankings.map((user) => {
                const isCurrentUser = user.user_id === currentUserId;
                const medal = getMedalEmoji(user.position);
                const isTopThree = user.position <= 3;

                return (
                    <Card
                        key={user.user_id}
                        className={`bg-card/50 border-border/50 transition-all ${isCurrentUser ? "border-primary/50 bg-primary/5 ring-1 ring-primary/30" : ""
                            } ${isTopThree ? "border-yellow-500/30" : ""}`}
                    >
                        <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                            {/* Position */}
                            <div className="w-10 text-center flex-shrink-0">
                                {medal ? (
                                    <span className="text-2xl">{medal}</span>
                                ) : (
                                    <span className="text-lg font-bold text-muted-foreground">
                                        {user.position}
                                    </span>
                                )}
                            </div>

                            {/* Avatar */}
                            <Avatar className={`h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 ${isTopThree ? "ring-2 ring-yellow-500/50" : ""}`}>
                                <AvatarImage src={user.avatar_url || undefined} />
                                <AvatarFallback className="text-sm">
                                    {user.name?.charAt(0) || "U"}
                                </AvatarFallback>
                            </Avatar>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">
                                    {user.name || "Jogador"}
                                    {isCurrentUser && (
                                        <Badge variant="outline" className="ml-2 text-[10px] border-primary/50 text-primary">
                                            você
                                        </Badge>
                                    )}
                                </p>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                    Nível {user.level}
                                </p>
                            </div>

                            {/* Score */}
                            <div className="text-right flex-shrink-0">
                                <p className={`text-lg sm:text-xl font-bold ${isTopThree ? "text-yellow-400" : "text-primary"}`}>
                                    {user.score.toLocaleString()}
                                </p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground">pontos</p>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

function AddFriendForm({ onSuccess }: { onSuccess: () => void }) {
    const [email, setEmail] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    const handleAddFriend = async () => {
        if (!email.trim()) {
            toast.error("Digite um email válido");
            return;
        }

        setIsAdding(true);
        try {
            const response = await fetch("/api/friends", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim() }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.error || "Erro ao adicionar amigo");
                return;
            }

            toast.success(data.message || "Amigo adicionado!");
            setEmail("");
            onSuccess();
        } catch (err) {
            console.error("Error adding friend:", err);
            toast.error("Erro ao adicionar amigo");
        }
        setIsAdding(false);
    };

    return (
        <div className="flex gap-2">
            <Input
                type="email"
                placeholder="email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddFriend()}
                className="flex-1"
            />
            <Button onClick={handleAddFriend} disabled={isAdding}>
                {isAdding ? "..." : "Adicionar"}
            </Button>
        </div>
    );
}
