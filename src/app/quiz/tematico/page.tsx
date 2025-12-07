"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const CATEGORIES = [
    {
        value: "selecoes",
        label: "Seleções",
        icon: "🏆",
        description: "Tudo sobre as seleções campeãs e suas histórias",
        color: "hover:border-yellow-500/50",
        bgColor: "bg-yellow-500/20",
    },
    {
        value: "artilheiros",
        label: "Artilheiros",
        icon: "⚽",
        description: "Os maiores goleadores da história das Copas",
        color: "hover:border-green-500/50",
        bgColor: "bg-green-500/20",
    },
    {
        value: "finais",
        label: "Finais",
        icon: "🥇",
        description: "Os jogos decisivos e momentos épicos",
        color: "hover:border-blue-500/50",
        bgColor: "bg-blue-500/20",
    },
    {
        value: "curiosidades",
        label: "Curiosidades",
        icon: "🎯",
        description: "Fatos surpreendentes e pouco conhecidos",
        color: "hover:border-purple-500/50",
        bgColor: "bg-purple-500/20",
    },
    {
        value: "copa2026",
        label: "Copa 2026",
        icon: "🇺🇸",
        description: "A próxima Copa nos EUA, México e Canadá",
        color: "hover:border-red-500/50",
        bgColor: "bg-red-500/20",
    },
];

export default function TematicoPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
            {/* Header */}
            <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/quiz" className="text-xl font-bold">
                        🎯 Quiz Temático
                    </Link>
                    <Link href="/quiz">
                        <Button variant="ghost" size="sm">
                            ← Voltar
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Title Section */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">
                        Escolha uma Categoria
                    </h1>
                    <p className="text-muted-foreground">
                        Teste seus conhecimentos em um tema específico
                    </p>
                </div>

                {/* Categories Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {CATEGORIES.map((category) => (
                        <Link
                            key={category.value}
                            href={`/quiz/tematico/${category.value}`}
                        >
                            <Card
                                className={`h-full bg-card/50 backdrop-blur-sm border-border/50 ${category.color} transition-all hover:scale-[1.02] cursor-pointer`}
                            >
                                <CardContent className="p-6">
                                    <div className="text-center">
                                        <div
                                            className={`w-16 h-16 mx-auto rounded-xl ${category.bgColor} flex items-center justify-center mb-4`}
                                        >
                                            <span className="text-4xl">
                                                {category.icon}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-semibold mb-2">
                                            {category.label}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            {category.description}
                                        </p>
                                        <Badge
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            10 perguntas
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                {/* Info Section */}
                <div className="mt-8 text-center">
                    <div className="inline-flex items-center gap-4 bg-muted/50 rounded-lg px-6 py-3">
                        <Badge variant="outline">📚 Sem limite de tempo</Badge>
                        <Badge variant="outline">⭐ 0.5x XP</Badge>
                    </div>
                </div>
            </main>
        </div>
    );
}
