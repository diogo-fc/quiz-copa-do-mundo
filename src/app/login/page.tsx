"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
    const { user, isLoading, signInWithGoogle } = useAuth();

    useEffect(() => {
        if (user) {
            redirect("/quiz");
        }
    }, [user]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-xl">Carregando...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-primary/5">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-green-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl" />
            </div>

            <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm border-border/50 relative">
                <CardHeader className="text-center pb-0">
                    <div className="text-5xl mb-4">⚽</div>
                    <CardTitle className="text-2xl md:text-3xl">
                        Copa{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-yellow-400">
                            Quiz Battle
                        </span>
                    </CardTitle>
                    <p className="text-muted-foreground mt-2">
                        Entre para competir e subir no ranking!
                    </p>
                </CardHeader>

                <CardContent className="pt-8 pb-8">
                    <div className="space-y-4">
                        <Button
                            onClick={signInWithGoogle}
                            className="w-full h-12 text-base gap-3"
                            variant="outline"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            Entrar com Google
                        </Button>
                    </div>

                    <p className="text-xs text-center text-muted-foreground mt-6">
                        Ao continuar, você concorda com nossos termos de uso e política de
                        privacidade.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
