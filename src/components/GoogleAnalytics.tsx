"use client";

import Script from "next/script";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function GoogleAnalytics() {
    if (!GA_MEASUREMENT_ID) {
        return null;
    }

    return (
        <>
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
                strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
                {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${GA_MEASUREMENT_ID}', {
                        page_title: document.title,
                        page_location: window.location.href,
                    });
                `}
            </Script>
        </>
    );
}

// Track page views (for client-side navigation)
export function trackPageView(url: string, title?: string) {
    if (typeof window !== "undefined" && window.gtag && GA_MEASUREMENT_ID) {
        window.gtag("config", GA_MEASUREMENT_ID, {
            page_path: url,
            page_title: title,
        });
    }
}

// Track custom events
export function trackEvent(
    action: string,
    category: string,
    label?: string,
    value?: number
) {
    if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", action, {
            event_category: category,
            event_label: label,
            value: value,
        });
    }
}

// Quiz-specific events
export const analytics = {
    // Quiz started
    quizStart: (mode: string, category?: string) => {
        trackEvent("quiz_start", "engagement", mode, undefined);
        if (category) {
            trackEvent("quiz_category", "engagement", category);
        }
    },

    // Quiz completed
    quizComplete: (mode: string, score: number, correctAnswers: number) => {
        trackEvent("quiz_complete", "engagement", mode, score);
        trackEvent("quiz_accuracy", "performance", mode, Math.round((correctAnswers / 10) * 100));
    },

    // Achievement unlocked
    achievementUnlocked: (achievementId: string) => {
        trackEvent("achievement_unlocked", "progression", achievementId);
    },

    // Level up
    levelUp: (newLevel: number) => {
        trackEvent("level_up", "progression", `level_${newLevel}`, newLevel);
    },

    // Share result
    shareResult: (platform: string) => {
        trackEvent("share", "social", platform);
    },

    // Duel created
    duelCreated: () => {
        trackEvent("duel_created", "social");
    },

    // Friend added
    friendAdded: () => {
        trackEvent("friend_added", "social");
    },

    // User signed up
    signUp: (method: string) => {
        trackEvent("sign_up", "auth", method);
    },

    // User logged in
    login: (method: string) => {
        trackEvent("login", "auth", method);
    },
};

// Type declaration for gtag
declare global {
    interface Window {
        gtag?: (
            command: string,
            targetId: string,
            config?: Record<string, unknown>
        ) => void;
        dataLayer?: unknown[];
    }
}
