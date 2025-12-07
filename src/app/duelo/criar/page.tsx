"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const CATEGORIES = [
    { value: "all", label: "Todas as categorias", icon: "🌍" },
    { value: "selecoes", label: "Seleções", icon: "🏆" },
    { value: "artilheiros", label: "Artilheiros", icon: "⚽" },
    { value: "finais", label: "Finais", icon: "🥇" },
    { value: "curiosidades", label: "Curiosidades", icon: "🎯" },
    { value: "copa2026", label: "Copa 2026", icon: "🇺🇸" },
];

export default function CreateDuelPage() {
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const [category, setCategory] = useState("all");
    const [questionCount, setQuestionCount] = useState("10");

    const handleCreateDuel = async () => {
        setIsCreating(true);

        try {
            const response = await fetch("/api/duels", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category: category === "all" ? null : category,
                    questionCount: parseInt(questionCount),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Erro ao criar duelo");
            }

            toast.success("Duelo criado! Compartilhe o link com seu amigo.");
            router.push(`/duelo/${data.id}`);

        } catch (error) {
            console.error("Error creating duel:", error);
            toast.error(error instanceof Error ? error.message : "Erro ao criar duelo");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
            {/* Header */}
            <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/quiz" className="text-xl font-bold">
                        ⚔️ Criar Duelo
                    </Link>
                    <Link href="/quiz">
                        <Button variant="ghost" size="sm">
                            Voltar
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-lg">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardHeader className="text-center">
                        <div className="text-6xl mb-4">⚔️</div>
                        <CardTitle className="text-2xl">Desafie um Amigo</CardTitle>
                        <p className="text-muted-foreground mt-2">
                            Crie um duelo e compartilhe o link para competir!
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Category Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Categoria</label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map((cat) => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                            <span className="flex items-center gap-2">
                                                <span>{cat.icon}</span>
                                                <span>{cat.label}</span>
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Question Count */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Número de Perguntas</label>
                            <Select value={questionCount} onValueChange={setQuestionCount}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Número de perguntas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">5 perguntas (rápido)</SelectItem>
                                    <SelectItem value="10">10 perguntas (padrão)</SelectItem>
                                    <SelectItem value="15">15 perguntas (longo)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Rules */}
                        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                            <h3 className="font-semibold text-sm">⚡ Como funciona:</h3>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Vocês respondem as mesmas perguntas</li>
                                <li>• Quem pontuar mais vence o duelo</li>
                                <li>• Velocidade conta para a pontuação</li>
                                <li>• O link expira em 24 horas</li>
                            </ul>
                        </div>

                        {/* Create Button */}
                        <Button
                            className="w-full h-12 text-lg"
                            onClick={handleCreateDuel}
                            disabled={isCreating}
                        >
                            {isCreating ? (
                                <>
                                    <span className="animate-spin mr-2">⏳</span>
                                    Criando...
                                </>
                            ) : (
                                <>
                                    ⚔️ Criar Duelo
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
