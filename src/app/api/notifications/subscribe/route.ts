import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST - Save push subscription
export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
        }

        const subscription = await request.json();

        if (!subscription.endpoint || !subscription.keys) {
            return NextResponse.json(
                { error: "Dados de inscrição inválidos" },
                { status: 400 }
            );
        }

        // Upsert subscription (update if endpoint exists)
        const { error } = await supabase
            .from("push_subscriptions")
            .upsert(
                {
                    user_id: user.id,
                    endpoint: subscription.endpoint,
                    keys: subscription.keys,
                },
                { onConflict: "endpoint" }
            );

        if (error) {
            console.error("Error saving subscription:", error);
            return NextResponse.json(
                { error: "Erro ao salvar inscrição" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error in subscribe API:", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
