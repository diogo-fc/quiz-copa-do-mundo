import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/duels - Create a new duel
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
        }

        // Get request body
        const body = await request.json();
        const { category, questionCount = 10 } = body;

        // Fetch random questions for the duel
        let query = supabase
            .from("questions")
            .select("id")
            .limit(questionCount);

        if (category && category !== "all") {
            query = query.eq("category", category);
        }

        const { data: questions, error: questionsError } = await query;

        if (questionsError || !questions || questions.length < questionCount) {
            return NextResponse.json(
                { error: "Não foi possível carregar perguntas suficientes" },
                { status: 400 }
            );
        }

        // Shuffle and get random questions
        const shuffled = questions.sort(() => Math.random() - 0.5);
        const questionIds = shuffled.slice(0, questionCount).map(q => q.id);

        // Create duel
        const { data: duel, error: duelError } = await supabase
            .from("duels")
            .insert({
                challenger_id: user.id,
                question_ids: questionIds,
                status: "pending",
            })
            .select()
            .single();

        if (duelError) {
            console.error("Error creating duel:", duelError);
            return NextResponse.json(
                { error: "Erro ao criar duelo" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            id: duel.id,
            shareUrl: `/duelo/${duel.id}`,
        });

    } catch (error) {
        console.error("Duel creation error:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}

// GET /api/duels/[id] - Get duel details
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const duelId = searchParams.get("id");

        if (!duelId) {
            return NextResponse.json({ error: "ID do duelo não fornecido" }, { status: 400 });
        }

        const { data: duel, error } = await supabase
            .from("duels")
            .select(`
                *,
                challenger:profiles!challenger_id(id, name, avatar_url),
                opponent:profiles!opponent_id(id, name, avatar_url)
            `)
            .eq("id", duelId)
            .single();

        if (error || !duel) {
            return NextResponse.json({ error: "Duelo não encontrado" }, { status: 404 });
        }

        return NextResponse.json(duel);

    } catch (error) {
        console.error("Get duel error:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
