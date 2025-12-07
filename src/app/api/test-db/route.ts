import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const results: Record<string, { status: string; count?: number; error?: string }> = {};

        // Test tables
        const tables = ["profiles", "questions", "game_sessions", "user_achievements", "daily_completions"];

        for (const table of tables) {
            try {
                const { count, error } = await supabase
                    .from(table)
                    .select("*", { count: "exact", head: true });

                if (error) {
                    results[table] = { status: "error", error: error.message };
                } else {
                    results[table] = { status: "ok", count: count || 0 };
                }
            } catch (err) {
                results[table] = { status: "error", error: String(err) };
            }
        }

        // Test RPC
        try {
            const { data, error } = await supabase.rpc("get_random_questions", {
                category_filter: null,
                difficulty_filter: null,
                limit_count: 5,
            });

            if (error) {
                results["rpc_get_random_questions"] = { status: "error", error: error.message };
            } else {
                results["rpc_get_random_questions"] = { status: "ok", count: data?.length || 0 };
            }
        } catch (err) {
            results["rpc_get_random_questions"] = { status: "error", error: String(err) };
        }

        return NextResponse.json({
            supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
            timestamp: new Date().toISOString(),
            results,
        });
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
