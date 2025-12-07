import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl" />

        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            {/* Badge */}
            <Badge
              variant="outline"
              className="mb-6 px-4 py-1 text-sm bg-primary/10 border-primary/30"
            >
              🏆 Copa do Mundo FIFA 2026
            </Badge>

            {/* Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Copa{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-yellow-400 to-green-400">
                Quiz Battle
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl">
              Teste seus conhecimentos sobre a história das Copas do Mundo!
              Compita com amigos e suba no ranking global.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/login">
                <Button
                  size="lg"
                  className="px-8 text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                >
                  🎮 Jogar Agora
                </Button>
              </Link>
              <Link href="#como-funciona">
                <Button size="lg" variant="outline" className="px-8 text-lg">
                  Como Funciona
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-8 mt-12 text-center">
              <div>
                <p className="text-3xl font-bold text-primary">200+</p>
                <p className="text-sm text-muted-foreground">Perguntas</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">5</p>
                <p className="text-sm text-muted-foreground">Categorias</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">∞</p>
                <p className="text-sm text-muted-foreground">Diversão</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Game Modes Section */}
      <section id="como-funciona" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Modos de Jogo
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Escolha como você quer jogar e prove que você é o maior conhecedor
            de Copas do Mundo!
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Training Mode */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Treino</h3>
              <p className="text-sm text-muted-foreground">
                Pratique sem pressão, sem limite de tempo. Perfeito para
                aprender.
              </p>
            </CardContent>
          </Card>

          {/* Challenge Mode */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center mb-4">
                <span className="text-2xl">⏱️</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Desafio</h3>
              <p className="text-sm text-muted-foreground">
                15 perguntas em 5 minutos. Velocidade conta para sua pontuação!
              </p>
            </CardContent>
          </Card>

          {/* Daily Quiz */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                <span className="text-2xl">📅</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Quiz Diário</h3>
              <p className="text-sm text-muted-foreground">
                5 perguntas novas todo dia. Mantenha seu streak e ganhe bônus!
              </p>
            </CardContent>
          </Card>

          {/* PvP Duel */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center mb-4">
                <span className="text-2xl">⚔️</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Duelo PvP</h3>
              <p className="text-sm text-muted-foreground">
                Desafie amigos via link. Mesmas perguntas, quem acerta mais
                vence!
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Categories Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Categorias</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Perguntas sobre todos os aspectos da história das Copas
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <Badge
            variant="outline"
            className="px-4 py-2 text-base bg-green-500/10 border-green-500/30"
          >
            🌍 Seleções
          </Badge>
          <Badge
            variant="outline"
            className="px-4 py-2 text-base bg-yellow-500/10 border-yellow-500/30"
          >
            🏆 Finais
          </Badge>
          <Badge
            variant="outline"
            className="px-4 py-2 text-base bg-red-500/10 border-red-500/30"
          >
            ⚽ Artilheiros
          </Badge>
          <Badge
            variant="outline"
            className="px-4 py-2 text-base bg-purple-500/10 border-purple-500/30"
          >
            🎭 Curiosidades
          </Badge>
          <Badge
            variant="outline"
            className="px-4 py-2 text-base bg-blue-500/10 border-blue-500/30"
          >
            🇺🇸 Copa 2026
          </Badge>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-green-500/10 to-yellow-500/10 border-primary/30">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para testar seus conhecimentos?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Crie sua conta grátis e comece a competir agora mesmo!
            </p>
            <Link href="/login">
              <Button
                size="lg"
                className="px-8 text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                Criar Conta Grátis
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            © 2025 Copa Quiz Battle. Feito com ⚽ para fãs de futebol.
          </p>
        </div>
      </footer>
    </div>
  );
}
