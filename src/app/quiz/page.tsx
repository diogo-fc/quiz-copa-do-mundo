"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { getLevelProgress, getLevelTitle } from "@/lib/scoring";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function QuizPage() {
    const { user, profile, isLoading, signOut } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-xl">Carregando...</div>
            </div>
        );
    }

    const levelProgress = profile ? getLevelProgress(profile.xp) : 0;
    const levelTitle = profile ? getLevelTitle(profile.level) : "Novato";

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
            {/* Header */}
            <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/quiz" className="font-bold text-xl">
                        ⚽ Copa Quiz
                    </Link>

                    <div className="flex items-center gap-4">
                        {/* XP Display */}
                        {profile && (
                            <div className="hidden sm:flex items-center gap-2">
                                <Badge variant="outline" className="bg-primary/10 border-primary/30">
                                    Nível {profile.level}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                    {profile.xp} XP
                                </span>
                            </div>
                        )}

                        {/* User Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage
                                            src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                                            alt={profile?.name || "User"}
                                        />
                                        <AvatarFallback>
                                            {profile?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <div className="flex items-center justify-start gap-2 p-2">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium">{profile?.name || "Usuário"}</p>
                                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                                    </div>
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/perfil">👤 Meu Perfil</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/perfil/conquistas">🏆 Conquistas</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/ranking">📊 Rankings</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/atividades">📰 Atividades</Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={signOut} className="text-destructive">
                                    🚪 Sair
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">
                        Olá, {profile?.name?.split(" ")[0] || "Jogador"}! 👋
                    </h1>
                    <p className="text-muted-foreground">
                        Escolha um modo de jogo para começar
                    </p>
                </div>

                {/* Progress Card */}
                {profile && (
                    <Card className="mb-8 bg-card/50 backdrop-blur-sm border-border/50">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Seu progresso</p>
                                    <p className="text-xl font-semibold">
                                        Nível {profile.level} - {levelTitle}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {(profile.streak_days || 0) > 0 && (
                                        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30">
                                            <span className="text-lg">🔥</span>
                                            <span className="font-bold text-orange-400">{profile.streak_days}</span>
                                        </div>
                                    )}
                                    <Badge className="bg-primary/20 text-primary border-primary/30">
                                        {profile.xp} XP
                                    </Badge>
                                </div>
                            </div>
                            <Progress value={levelProgress} className="h-2" />
                            <div className="flex justify-between mt-2">
                                <p className="text-xs text-muted-foreground">
                                    {levelProgress}% para o próximo nível
                                </p>
                                {(profile.streak_days || 0) > 0 && (
                                    <p className="text-xs text-orange-400">
                                        🔥 {profile.streak_days} dia{profile.streak_days > 1 ? 's' : ''} seguido{profile.streak_days > 1 ? 's' : ''}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Game Modes Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Training Mode */}
                    <Link href="/quiz/treino">
                        <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50 hover:border-blue-500/50 transition-all hover:scale-[1.02]">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                        <span className="text-3xl">📚</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold mb-1">Modo Treino</h3>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            Pratique sem limite de tempo. Ideal para aprender e se preparar.
                                        </p>
                                        <div className="flex gap-2">
                                            <Badge variant="outline" className="text-xs">
                                                Sem limite
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                0.5x XP
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Challenge Mode */}
                    <Link href="/quiz/desafio">
                        <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50 hover:border-orange-500/50 transition-all hover:scale-[1.02]">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                                        <span className="text-3xl">⏱️</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold mb-1">Modo Desafio</h3>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            15 perguntas em 5 minutos. Pontos extras por velocidade!
                                        </p>
                                        <div className="flex gap-2">
                                            <Badge variant="outline" className="text-xs">
                                                5 minutos
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                1x XP
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Daily Quiz */}
                    <Link href="/quiz/diario">
                        <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50 hover:border-purple-500/50 transition-all hover:scale-[1.02]">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                        <span className="text-3xl">📅</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold mb-1">Quiz Diário</h3>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            5 perguntas novas todo dia. Mantenha seu streak!
                                        </p>
                                        <div className="flex gap-2">
                                            <Badge variant="outline" className="text-xs">
                                                Diário
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                1.2x XP
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Thematic Mode */}
                    <Link href="/quiz/tematico">
                        <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50 hover:border-emerald-500/50 transition-all hover:scale-[1.02]">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                        <span className="text-3xl">🎯</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-xl font-semibold">Modo Temático</h3>
                                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Novo</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            Escolha sua categoria favorita: Seleções, Finais, Artilheiros...
                                        </p>
                                        <div className="flex gap-2">
                                            <Badge variant="outline" className="text-xs">
                                                Por categoria
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                0.5x XP
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* PvP Duel */}
                    <Link href="/duelo/criar">
                        <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50 hover:border-red-500/50 transition-all hover:scale-[1.02]">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                                        <span className="text-3xl">⚔️</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-xl font-semibold">Duelo PvP</h3>
                                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Novo</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            Desafie amigos via link. Quem acerta mais, vence!
                                        </p>
                                        <div className="flex gap-2">
                                            <Badge variant="outline" className="text-xs">
                                                Multiplayer
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                1.5x XP
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* Quick Links */}
                <div className="mt-8 flex flex-wrap gap-4 justify-center">
                    <Link href="/ranking">
                        <Button variant="outline" className="gap-2">
                            📊 Ver Rankings
                        </Button>
                    </Link>
                    <Link href="/perfil/conquistas">
                        <Button variant="outline" className="gap-2">
                            🏆 Conquistas
                        </Button>
                    </Link>
                </div>
            </main>
        </div>
    );
}
