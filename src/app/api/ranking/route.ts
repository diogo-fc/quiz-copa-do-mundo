import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);

        const period = searchParams.get("period") || "alltime";
        const limit = parseInt(searchParams.get("limit") || "50");

        // Calculate date range based on period
        let startDate: string | null = null;
        const now = new Date();

        if (period === "weekly") {
            // Start of current week (Monday)
            const dayOfWeek = now.getDay();
            const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const monday = new Date(now);
            monday.setDate(now.getDate() - daysToMonday);
            monday.setHours(0, 0, 0, 0);
            startDate = monday.toISOString();
        } else if (period === "monthly") {
            // Start of current month
            const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            startDate = firstOfMonth.toISOString();
        }

        let rankings;

        if (startDate) {
            // Fetch scores from game_sessions for the period
            const { data: sessions, error: sessionsError } = await supabase
                .from("game_sessions")
                .select("user_id, score")
                .gte("completed_at", startDate);

            if (sessionsError) {
                console.error("Error fetching sessions:", sessionsError);
                return NextResponse.json({ error: "Failed to fetch rankings" }, { status: 500 });
            }

            // Aggregate scores by user
            const scoresByUser: Record<string, number> = {};
            sessions?.forEach((session) => {
                if (session.user_id && session.score) {
                    scoresByUser[session.user_id] = (scoresByUser[session.user_id] || 0) + session.score;
                }
            });

            // Get user profiles for those users
            const userIds = Object.keys(scoresByUser);
            if (userIds.length === 0) {
                return NextResponse.json({ rankings: [], period });
            }

            const { data: profiles, error: profilesError } = await supabase
                .from("profiles")
                .select("id, name, avatar_url, level")
                .in("id", userIds);

            if (profilesError) {
                console.error("Error fetching profiles:", profilesError);
                return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 });
            }

            // Combine and sort
            rankings = profiles?.map((profile) => ({
                user_id: profile.id,
                name: profile.name,
                avatar_url: profile.avatar_url,
                level: profile.level,
                score: scoresByUser[profile.id] || 0,
                position: 0,
            })) || [];

            rankings.sort((a, b) => b.score - a.score);
            rankings.forEach((r, i) => (r.position = i + 1));
            rankings = rankings.slice(0, limit);
        } else {
            // All-time: use XP from profiles
            const { data: profiles, error } = await supabase
                .from("profiles")
                .select("id, name, avatar_url, xp, level")
                .order("xp", { ascending: false })
                .limit(limit);

            if (error) {
                console.error("Error fetching profiles:", error);
                return NextResponse.json({ error: "Failed to fetch rankings" }, { status: 500 });
            }

            rankings = profiles?.map((p, index) => ({
                user_id: p.id,
                name: p.name,
                avatar_url: p.avatar_url,
                level: p.level,
                score: p.xp,
                position: index + 1,
            })) || [];
        }

        return NextResponse.json({ rankings, period });
    } catch (error) {
        console.error("Error in ranking API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
