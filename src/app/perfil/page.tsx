"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getLevelProgress, getXPForLevel, getLevelTitle } from "@/lib/scoring";
import { createClient } from "@/lib/supabase/client";
import { GameMode } from "@/types";
import { toast } from "sonner";
import { NotificationSettings } from "@/components/NotificationSettings";

// Lista de seleções da Copa do Mundo
const WORLD_CUP_TEAMS = [
    { code: "BRA", name: "Brasil", flag: "🇧🇷" },
    { code: "ARG", name: "Argentina", flag: "🇦🇷" },
    { code: "FRA", name: "França", flag: "🇫🇷" },
    { code: "GER", name: "Alemanha", flag: "🇩🇪" },
    { code: "ESP", name: "Espanha", flag: "🇪🇸" },
    { code: "ENG", name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    { code: "POR", name: "Portugal", flag: "🇵🇹" },
    { code: "ITA", name: "Itália", flag: "🇮🇹" },
    { code: "NED", name: "Holanda", flag: "🇳🇱" },
    { code: "BEL", name: "Bélgica", flag: "🇧🇪" },
    { code: "URU", name: "Uruguai", flag: "🇺🇾" },
    { code: "MEX", name: "México", flag: "🇲🇽" },
    { code: "USA", name: "Estados Unidos", flag: "🇺🇸" },
    { code: "CRO", name: "Croácia", flag: "🇭🇷" },
    { code: "MAR", name: "Marrocos", flag: "🇲🇦" },
    { code: "JPN", name: "Japão", flag: "🇯🇵" },
    { code: "KOR", name: "Coreia do Sul", flag: "🇰🇷" },
    { code: "SEN", name: "Senegal", flag: "🇸🇳" },
    { code: "COL", name: "Colômbia", flag: "🇨🇴" },
    { code: "CHI", name: "Chile", flag: "🇨🇱" },
];

interface GameSession {
    id: string;
    mode: GameMode;
    score: number;
    correct_answers: number;
    total_questions: number;
    time_spent: number | null;
    completed_at: string;
}

interface Stats {
    totalGames: number;
    totalCorrect: number;
    totalQuestions: number;
    accuracyRate: number;
    bestStreak: number;
    averageScore: number;
    totalXpGained: number;
}

export default function PerfilPage() {
    const { user, profile, isLoading, refreshProfile } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentGames, setRecentGames] = useState<GameSession[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSavingTeam, setIsSavingTeam] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

    // Load stats and recent games
    useEffect(() => {
        // Refresh profile data on page mount
        refreshProfile();

        const loadData = async () => {
            if (!profile?.id) return;

            setIsLoadingData(true);
            try {
                const supabase = createClient();

                // Fetch all game sessions for stats
                const { data: sessions } = await supabase
                    .from("game_sessions")
                    .select("*")
                    .eq("user_id", profile.id)
                    .order("completed_at", { ascending: false });

                if (sessions && sessions.length > 0) {
                    const totalGames = sessions.length;
                    const totalCorrect = sessions.reduce((sum, g) => sum + (g.correct_answers || 0), 0);
                    const totalQuestions = sessions.reduce((sum, g) => sum + (g.total_questions || 0), 0);
                    const accuracyRate = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
                    const averageScore = Math.round(
                        sessions.reduce((sum, g) => sum + (g.score || 0), 0) / totalGames
                    );

                    // Calculate best streak (simplified - would need answer records for real streak)
                    const bestStreak = Math.max(
                        ...sessions.map((g) => Math.min(g.correct_answers || 0, 10))
                    );

                    setStats({
                        totalGames,
                        totalCorrect,
                        totalQuestions,
                        accuracyRate,
                        bestStreak,
                        averageScore,
                        totalXpGained: profile.xp,
                    });

                    // Get last 10 games
                    setRecentGames(sessions.slice(0, 10) as GameSession[]);
                } else {
                    setStats({
                        totalGames: 0,
                        totalCorrect: 0,
                        totalQuestions: 0,
                        accuracyRate: 0,
                        bestStreak: 0,
                        averageScore: 0,
                        totalXpGained: profile.xp,
                    });
                    setRecentGames([]);
                }

                // Set initial selected team
                setSelectedTeam(profile.favorite_team);
            } catch (err) {
                console.error("Error loading profile data:", err);
            }
            setIsLoadingData(false);
        };

        loadData();
    }, [profile?.id, profile?.xp, profile?.favorite_team]);

    // Save favorite team
    const handleSaveTeam = async (teamCode: string) => {
        if (!profile?.id) return;

        setIsSavingTeam(true);
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from("profiles")
                .update({ favorite_team: teamCode })
                .eq("id", profile.id);

            if (error) {
                toast.error("Erro ao salvar seleção");
                console.error(error);
            } else {
                setSelectedTeam(teamCode);
                toast.success("Seleção favorita atualizada!");
                await refreshProfile();
            }
        } catch (err) {
            toast.error("Erro ao salvar");
            console.error(err);
        }
        setIsSavingTeam(false);
    };

    // Mode labels and colors
    const getModeInfo = (mode: GameMode) => {
        const modes: Record<GameMode, { label: string; color: string; icon: string }> = {
            treino: { label: "Treino", color: "bg-blue-500/20 text-blue-400", icon: "📚" },
            desafio: { label: "Desafio", color: "bg-orange-500/20 text-orange-400", icon: "⏱️" },
            diario: { label: "Diário", color: "bg-purple-500/20 text-purple-400", icon: "📅" },
            duelo: { label: "Duelo", color: "bg-red-500/20 text-red-400", icon: "⚔️" },
        };
        return modes[mode] || modes.treino;
    };

    // Format date
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-xl">Carregando...</div>
            </div>
        );
    }

    const levelProgress = profile ? getLevelProgress(profile.xp) : 0;
    const levelTitle = profile ? getLevelTitle(profile.level) : "Novato";
    const currentLevelXP = profile ? getXPForLevel(profile.level) : 0;
    const nextLevelXP = profile ? getXPForLevel(profile.level + 1) : 100;
    const xpInCurrentLevel = (profile?.xp || 0) - currentLevelXP;
    const xpNeededForLevel = nextLevelXP - currentLevelXP;

    const selectedTeamData = WORLD_CUP_TEAMS.find((t) => t.code === selectedTeam);

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
            {/* Header */}
            <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 h-14 flex items-center justify-between">
                    <Link href="/quiz" className="text-muted-foreground hover:text-foreground">
                        ← Voltar
                    </Link>
                    <h1 className="font-semibold">Meu Perfil</h1>
                    <div className="w-16" />
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-2xl">
                {/* Profile Card */}
                <Card className="bg-card/50 backdrop-blur-sm border-border/50 mb-6 overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-green-500" />
                    <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            {/* Avatar */}
                            <div className="relative">
                                <Avatar className="h-24 w-24 border-4 border-primary/20">
                                    <AvatarImage
                                        src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                                        alt={profile?.name || "User"}
                                    />
                                    <AvatarFallback className="text-2xl bg-primary/10">
                                        {profile?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                {selectedTeamData && (
                                    <span className="absolute -bottom-1 -right-1 text-2xl">
                                        {selectedTeamData.flag}
                                    </span>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-center sm:text-left">
                                <h2 className="text-2xl font-bold mb-1">
                                    {profile?.name || "Jogador"}
                                </h2>
                                <p className="text-sm text-muted-foreground mb-3">
                                    {user?.email}
                                </p>
                                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                                    <Badge className="bg-primary/20 text-primary border-primary/30">
                                        Nível {profile?.level || 1}
                                    </Badge>
                                    <Badge variant="outline">{levelTitle}</Badge>
                                    {(profile?.streak_days || 0) > 0 && (
                                        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                                            🔥 {profile?.streak_days} dia{(profile?.streak_days || 0) > 1 ? 's' : ''}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* XP Progress */}
                        <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">
                                    Nível {profile?.level || 1} → {(profile?.level || 1) + 1}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    {xpInCurrentLevel} / {xpNeededForLevel} XP
                                </span>
                            </div>
                            <Progress value={levelProgress} className="h-3" />
                            <p className="text-xs text-muted-foreground mt-2 text-center">
                                Total: {profile?.xp?.toLocaleString() || 0} XP
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Favorite Team Selection */}
                <Card className="bg-card/50 backdrop-blur-sm border-border/50 mb-6">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            ⚽ Seleção Favorita
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select
                            value={selectedTeam || ""}
                            onValueChange={handleSaveTeam}
                            disabled={isSavingTeam}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Escolha sua seleção favorita">
                                    {selectedTeamData ? (
                                        <span className="flex items-center gap-2">
                                            {selectedTeamData.flag} {selectedTeamData.name}
                                        </span>
                                    ) : (
                                        "Escolha sua seleção favorita"
                                    )}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {WORLD_CUP_TEAMS.map((team) => (
                                    <SelectItem key={team.code} value={team.code}>
                                        <span className="flex items-center gap-2">
                                            {team.flag} {team.name}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                {/* Notification Settings */}
                <Card className="bg-card/50 backdrop-blur-sm border-border/50 mb-6">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            🔔 Notificações
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <NotificationSettings />
                    </CardContent>
                </Card>

                {/* Stats Grid */}
                <Card className="bg-card/50 backdrop-blur-sm border-border/50 mb-6">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            📊 Estatísticas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoadingData ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="p-4 rounded-xl bg-muted/30 text-center">
                                        <Skeleton className="h-8 w-16 mx-auto mb-2" />
                                        <Skeleton className="h-4 w-20 mx-auto" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                                    <p className="text-2xl font-bold text-blue-400">
                                        {stats?.totalGames || 0}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Partidas</p>
                                </div>
                                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                                    <p className="text-2xl font-bold text-green-400">
                                        {stats?.accuracyRate || 0}%
                                    </p>
                                    <p className="text-xs text-muted-foreground">Taxa de Acerto</p>
                                </div>
                                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center">
                                    <p className="text-2xl font-bold text-orange-400">
                                        {stats?.bestStreak || 0}x
                                    </p>
                                    <p className="text-xs text-muted-foreground">Melhor Streak</p>
                                </div>
                                <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
                                    <p className="text-2xl font-bold text-yellow-400">
                                        {stats?.averageScore || 0}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Média</p>
                                </div>
                            </div>
                        )}

                        {/* Additional Stats */}
                        {!isLoadingData && stats && (
                            <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-lg font-semibold">
                                        {stats.totalCorrect} / {stats.totalQuestions}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Perguntas Respondidas Corretamente
                                    </p>
                                </div>
                                <div>
                                    <p className="text-lg font-semibold">
                                        {stats.totalXpGained.toLocaleString()} XP
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        XP Total Ganho
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Games */}
                <Card className="bg-card/50 backdrop-blur-sm border-border/50 mb-6">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            🕐 Últimas Partidas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoadingData ? (
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="p-3 rounded-lg bg-muted/30 flex items-center gap-3">
                                        <Skeleton className="h-10 w-10 rounded" />
                                        <div className="flex-1">
                                            <Skeleton className="h-4 w-24 mb-1" />
                                            <Skeleton className="h-3 w-32" />
                                        </div>
                                        <Skeleton className="h-6 w-16" />
                                    </div>
                                ))}
                            </div>
                        ) : recentGames.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <p className="text-4xl mb-2">🎮</p>
                                <p>Nenhuma partida ainda</p>
                                <Link href="/quiz">
                                    <Button className="mt-4">Jogar Agora</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentGames.map((game) => {
                                    const modeInfo = getModeInfo(game.mode);
                                    const accuracy = game.total_questions > 0
                                        ? Math.round((game.correct_answers / game.total_questions) * 100)
                                        : 0;

                                    return (
                                        <div
                                            key={game.id}
                                            className="p-3 rounded-lg bg-muted/20 border border-border/30 flex items-center gap-3"
                                        >
                                            {/* Mode Icon */}
                                            <div className={`w-10 h-10 rounded-lg ${modeInfo.color} flex items-center justify-center text-xl`}>
                                                {modeInfo.icon}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{modeInfo.label}</span>
                                                    <Badge variant="outline" className="text-xs">
                                                        {game.correct_answers}/{game.total_questions}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDate(game.completed_at)}
                                                    {game.time_spent && (
                                                        <span> • {Math.floor(game.time_spent / 60)}m {game.time_spent % 60}s</span>
                                                    )}
                                                </p>
                                            </div>

                                            {/* Score */}
                                            <div className="text-right">
                                                <p className="font-bold text-primary">{game.score}</p>
                                                <p className="text-xs text-muted-foreground">{accuracy}%</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <Link href="/perfil/conquistas">
                        <Card className="bg-card/50 border-border/50 hover:border-primary/50 transition-colors cursor-pointer h-full">
                            <CardContent className="p-6 text-center">
                                <span className="text-4xl mb-2 block">🏆</span>
                                <h3 className="font-semibold">Conquistas</h3>
                                <p className="text-xs text-muted-foreground">Ver todas</p>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/ranking">
                        <Card className="bg-card/50 border-border/50 hover:border-primary/50 transition-colors cursor-pointer h-full">
                            <CardContent className="p-6 text-center">
                                <span className="text-4xl mb-2 block">📊</span>
                                <h3 className="font-semibold">Rankings</h3>
                                <p className="text-xs text-muted-foreground">Ver posição</p>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </main>
        </div>
    );
}
