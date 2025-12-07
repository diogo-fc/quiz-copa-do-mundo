import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Não autenticado" },
                { status: 401 }
            );
        }

        // Get current profile
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("streak_days, last_played_at")
            .eq("id", user.id)
            .single();

        if (profileError) {
            return NextResponse.json(
                { error: "Erro ao buscar perfil" },
                { status: 500 }
            );
        }

        const now = new Date();
        const today = now.toISOString().split("T")[0]; // YYYY-MM-DD

        // Get last played date
        const lastPlayedAt = profile?.last_played_at
            ? new Date(profile.last_played_at)
            : null;
        const lastPlayedDate = lastPlayedAt
            ? lastPlayedAt.toISOString().split("T")[0]
            : null;

        let newStreakDays = profile?.streak_days || 0;
        let streakUpdated = false;

        if (lastPlayedDate === today) {
            // Already played today, no streak update needed
            streakUpdated = false;
        } else if (lastPlayedDate) {
            // Check if last played was yesterday
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split("T")[0];

            if (lastPlayedDate === yesterdayStr) {
                // Consecutive day - increment streak
                newStreakDays += 1;
                streakUpdated = true;
            } else {
                // Missed a day - reset streak to 1
                newStreakDays = 1;
                streakUpdated = true;
            }
        } else {
            // First time playing
            newStreakDays = 1;
            streakUpdated = true;
        }

        // Update profile with new streak and last_played_at
        if (streakUpdated || !lastPlayedDate) {
            const { error: updateError } = await supabase
                .from("profiles")
                .update({
                    streak_days: newStreakDays,
                    last_played_at: now.toISOString(),
                    updated_at: now.toISOString(),
                })
                .eq("id", user.id);

            if (updateError) {
                console.error("Error updating streak:", updateError);
                return NextResponse.json(
                    { error: "Erro ao atualizar streak" },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({
            streak_days: newStreakDays,
            streak_updated: streakUpdated,
            last_played_at: now.toISOString(),
        });
    } catch (error) {
        console.error("Error in streak API:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}

// GET current streak
export async function GET() {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Não autenticado" },
                { status: 401 }
            );
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("streak_days, last_played_at")
            .eq("id", user.id)
            .single();

        // Check if streak is still valid (played yesterday or today)
        let currentStreak = profile?.streak_days || 0;
        const lastPlayedAt = profile?.last_played_at
            ? new Date(profile.last_played_at)
            : null;

        if (lastPlayedAt) {
            const now = new Date();
            const today = now.toISOString().split("T")[0];
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split("T")[0];
            const lastPlayedDate = lastPlayedAt.toISOString().split("T")[0];

            // If last played was before yesterday, streak is broken
            if (lastPlayedDate !== today && lastPlayedDate !== yesterdayStr) {
                currentStreak = 0;
            }
        }

        return NextResponse.json({
            streak_days: currentStreak,
            last_played_at: profile?.last_played_at || null,
        });
    } catch (error) {
        console.error("Error in streak API:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
