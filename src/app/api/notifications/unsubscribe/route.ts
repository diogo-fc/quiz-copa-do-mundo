import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST - Remove push subscription
export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
        }

        const { endpoint } = await request.json();

        if (!endpoint) {
            return NextResponse.json(
                { error: "Endpoint obrigatório" },
                { status: 400 }
            );
        }

        // Delete subscription
        const { error } = await supabase
            .from("push_subscriptions")
            .delete()
            .eq("user_id", user.id)
            .eq("endpoint", endpoint);

        if (error) {
            console.error("Error deleting subscription:", error);
            return NextResponse.json(
                { error: "Erro ao remover inscrição" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error in unsubscribe API:", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
