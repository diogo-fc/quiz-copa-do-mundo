import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Activity types for type safety
type ActivityType = "quiz_completed" | "achievement_unlocked" | "level_up" | "duel_won" | "streak_milestone";

interface Activity {
    id: string;
    user_id: string;
    activity_type: ActivityType;
    data: Record<string, unknown>;
    created_at: string;
    user?: {
        id: string;
        name: string | null;
        avatar_url: string | null;
    };
}

// GET - Fetch activity feed (own + friends' activities)
export async function GET() {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
        }

        // Get friends IDs
        const { data: friendships } = await supabase
            .from("friendships")
            .select("user_id, friend_id")
            .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
            .eq("status", "accepted");

        const friendIds = friendships?.map((f) =>
            f.user_id === user.id ? f.friend_id : f.user_id
        ) || [];

        // Include current user in the feed
        const allUserIds = [user.id, ...friendIds];

        // Fetch activities for user and friends
        const { data: activities, error } = await supabase
            .from("activity_feed")
            .select(`
                id,
                user_id,
                activity_type,
                data,
                created_at,
                profiles:user_id (id, name, avatar_url)
            `)
            .in("user_id", allUserIds)
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) {
            console.error("Error fetching feed:", error);
            return NextResponse.json({ error: "Erro ao buscar feed" }, { status: 500 });
        }

        // Format activities with user info
        const formattedActivities: Activity[] = (activities || []).map((a) => ({
            id: a.id,
            user_id: a.user_id,
            activity_type: a.activity_type as ActivityType,
            data: a.data || {},
            created_at: a.created_at,
            user: Array.isArray(a.profiles) ? a.profiles[0] : a.profiles,
        }));

        return NextResponse.json({ activities: formattedActivities });
    } catch (error) {
        console.error("Error in feed API:", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}

// POST - Record a new activity
export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
        }

        const body = await request.json();
        const { activity_type, data } = body;

        if (!activity_type) {
            return NextResponse.json({ error: "activity_type obrigatório" }, { status: 400 });
        }

        const validTypes: ActivityType[] = [
            "quiz_completed",
            "achievement_unlocked",
            "level_up",
            "duel_won",
            "streak_milestone"
        ];

        if (!validTypes.includes(activity_type)) {
            return NextResponse.json({ error: "Tipo de atividade inválido" }, { status: 400 });
        }

        // Insert activity
        const { data: activity, error } = await supabase
            .from("activity_feed")
            .insert({
                user_id: user.id,
                activity_type,
                data: data || {},
            })
            .select()
            .single();

        if (error) {
            console.error("Error inserting activity:", error);
            return NextResponse.json({ error: "Erro ao registrar atividade" }, { status: 500 });
        }

        return NextResponse.json({ activity });
    } catch (error) {
        console.error("Error in feed API:", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
