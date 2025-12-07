"use client";

import { useState, useEffect, useCallback } from "react";

interface UsePushNotificationsReturn {
    isSupported: boolean;
    permission: NotificationPermission | "default";
    isSubscribed: boolean;
    isLoading: boolean;
    error: string | null;
    requestPermission: () => Promise<boolean>;
    subscribe: () => Promise<boolean>;
    unsubscribe: () => Promise<boolean>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission | "default">("default");
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Check if push notifications are supported and sync with database
    useEffect(() => {
        const checkSupport = async () => {
            const supported =
                "serviceWorker" in navigator &&
                "PushManager" in window &&
                "Notification" in window;

            setIsSupported(supported);

            if (supported) {
                setPermission(Notification.permission);

                // Check local subscription
                let hasLocalSubscription = false;
                try {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    if (registrations.length > 0) {
                        const subscription = await registrations[0].pushManager.getSubscription();
                        hasLocalSubscription = !!subscription;
                    }
                } catch (err) {
                    console.error("Error checking local subscription:", err);
                }

                // Check database subscription
                let hasDbSubscription = false;
                try {
                    const response = await fetch("/api/notifications/check");
                    if (response.ok) {
                        const data = await response.json();
                        hasDbSubscription = data.hasSubscription;
                    }
                } catch (err) {
                    console.error("Error checking DB subscription:", err);
                }

                // Sync state: if DB says subscribed but local is not, user might need to resubscribe
                // Show as subscribed only if BOTH local and DB agree
                // If DB has subscription but local doesn't, show as unsubscribed (local takes precedence)
                // This forces user to resubscribe to get a fresh local subscription
                setIsSubscribed(hasLocalSubscription);

                // Log for debugging
                if (hasDbSubscription && !hasLocalSubscription) {
                    console.log("Push: DB has subscription but local SW doesn't. User needs to resubscribe.");
                }
            }

            setIsLoading(false);
        };

        checkSupport();
    }, []);


    // Request notification permission
    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (!isSupported) {
            setError("Notificações não suportadas neste navegador");
            return false;
        }

        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            return result === "granted";
        } catch (err) {
            console.error("Error requesting permission:", err);
            setError("Erro ao solicitar permissão");
            return false;
        }
    }, [isSupported]);

    // Subscribe to push notifications
    const subscribe = useCallback(async (): Promise<boolean> => {
        if (!isSupported || permission !== "granted") {
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Register service worker if not already registered
            const registration = await navigator.serviceWorker.register("/sw.js");
            await navigator.serviceWorker.ready;

            // Get VAPID public key from server
            const vapidResponse = await fetch("/api/notifications/vapid-key");
            if (!vapidResponse.ok) {
                throw new Error("Erro ao obter chave VAPID");
            }
            const { publicKey } = await vapidResponse.json();

            // Subscribe to push
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey),
            });

            // Send subscription to server
            const response = await fetch("/api/notifications/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(subscription),
            });

            if (!response.ok) {
                throw new Error("Erro ao salvar inscrição");
            }

            setIsSubscribed(true);
            return true;
        } catch (err) {
            console.error("Error subscribing:", err);
            setError(err instanceof Error ? err.message : "Erro ao inscrever");
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [isSupported, permission]);

    // Unsubscribe from push notifications
    const unsubscribe = useCallback(async (): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();

                // Notify server
                await fetch("/api/notifications/unsubscribe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ endpoint: subscription.endpoint }),
                });
            }

            setIsSubscribed(false);
            return true;
        } catch (err) {
            console.error("Error unsubscribing:", err);
            setError("Erro ao cancelar inscrição");
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        isSupported,
        permission,
        isSubscribed,
        isLoading,
        error,
        requestPermission,
        subscribe,
        unsubscribe,
    };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): BufferSource {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray.buffer;
}
