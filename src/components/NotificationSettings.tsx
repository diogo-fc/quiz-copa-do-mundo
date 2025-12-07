"use client";

import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function NotificationSettings() {
    const {
        isSupported,
        permission,
        isSubscribed,
        isLoading,
        error,
        requestPermission,
        subscribe,
        unsubscribe,
    } = usePushNotifications();

    const handleToggle = async (checked: boolean) => {
        if (checked) {
            // Request permission if not granted
            if (permission !== "granted") {
                const granted = await requestPermission();
                if (!granted) {
                    toast.error("Permissão negada para notificações");
                    return;
                }
            }

            // Subscribe
            const success = await subscribe();
            if (success) {
                toast.success("Notificações ativadas!");
            } else {
                toast.error("Erro ao ativar notificações");
            }
        } else {
            // Unsubscribe
            const success = await unsubscribe();
            if (success) {
                toast.success("Notificações desativadas");
            }
        }
    };

    if (!isSupported) {
        return (
            <Alert variant="destructive">
                <AlertDescription>
                    Notificações push não são suportadas neste navegador.
                </AlertDescription>
            </Alert>
        );
    }

    if (permission === "denied") {
        return (
            <Alert>
                <AlertDescription>
                    Você bloqueou as notificações. Para reativar, altere as configurações do
                    navegador.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <Label htmlFor="notifications" className="text-base font-medium">
                        🔔 Notificações Push
                    </Label>
                    <p className="text-sm text-muted-foreground">
                        Receba lembretes diários e alertas de streak
                    </p>
                </div>
                <Switch
                    id="notifications"
                    checked={isSubscribed}
                    onCheckedChange={handleToggle}
                    disabled={isLoading}
                />
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {!isSubscribed && permission === "default" && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggle(true)}
                    disabled={isLoading}
                    className="w-full"
                >
                    {isLoading ? "Ativando..." : "Ativar Notificações"}
                </Button>
            )}
        </div>
    );
}
