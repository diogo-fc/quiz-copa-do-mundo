"use server";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Check if user has a push subscription in the database
export async function GET() {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
        }

        // Check if user has any subscriptions
        const { data: subscriptions, error } = await supabase
            .from("push_subscriptions")
            .select("id, endpoint")
            .eq("user_id", user.id)
            .limit(1);

        if (error) {
            console.error("Error checking subscription:", error);
            return NextResponse.json({ error: "Erro ao verificar" }, { status: 500 });
        }

        return NextResponse.json({
            hasSubscription: subscriptions && subscriptions.length > 0,
            endpoint: subscriptions?.[0]?.endpoint || null,
        });
    } catch (error) {
        console.error("Error in check subscription API:", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
