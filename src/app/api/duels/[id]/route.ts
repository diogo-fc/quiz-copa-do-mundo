import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/duels/[id] - Get duel details with questions
export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        // Get duel with challenger and opponent info
        const { data: duel, error } = await supabase
            .from("duels")
            .select(`
                *,
                challenger:profiles!challenger_id(id, name, avatar_url),
                opponent:profiles!opponent_id(id, name, avatar_url)
            `)
            .eq("id", id)
            .single();

        if (error || !duel) {
            return NextResponse.json({ error: "Duelo não encontrado" }, { status: 404 });
        }

        // Get questions for the duel
        const { data: questions, error: questionsError } = await supabase
            .from("questions")
            .select("*")
            .in("id", duel.question_ids);

        if (questionsError) {
            return NextResponse.json({ error: "Erro ao carregar perguntas" }, { status: 500 });
        }

        // Sort questions by the order in question_ids
        const orderedQuestions = duel.question_ids.map((qid: string) =>
            questions?.find(q => q.id === qid)
        ).filter(Boolean);

        console.log("[Duels API GET] Returning duel:", {
            duelId: id,
            userId: user?.id,
            challenger_id: duel.challenger_id,
            opponent_id: duel.opponent_id,
            isChallenger: user?.id === duel.challenger_id,
            isOpponent: user?.id === duel.opponent_id,
            challenger_score: duel.challenger_score,
            opponent_score: duel.opponent_score,
        });

        return NextResponse.json({
            ...duel,
            questions: orderedQuestions,
            isChallenger: user?.id === duel.challenger_id,
            isOpponent: user?.id === duel.opponent_id,
            canPlay: user && (
                user.id === duel.challenger_id && duel.challenger_score === null ||
                user.id !== duel.challenger_id && duel.opponent_id === null ||
                user.id === duel.opponent_id && duel.opponent_score === null
            ),
        });

    } catch (error) {
        console.error("Get duel error:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}

// PATCH /api/duels/[id] - Update duel (submit score, join as opponent)
export async function PATCH(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
        }

        const body = await request.json();
        const { action, score } = body;

        // Get current duel state
        const { data: duel, error: duelError } = await supabase
            .from("duels")
            .select("*")
            .eq("id", id)
            .single();

        if (duelError || !duel) {
            return NextResponse.json({ error: "Duelo não encontrado" }, { status: 404 });
        }

        // Handle different actions
        if (action === "join") {
            console.log("[Duels API] Join request:", { duelId: id, userId: user.id });
            console.log("[Duels API] Current duel state:", {
                challenger_id: duel.challenger_id,
                opponent_id: duel.opponent_id,
                status: duel.status
            });

            // User is joining as opponent
            if (duel.opponent_id) {
                console.log("[Duels API] Duel already has opponent:", duel.opponent_id);
                return NextResponse.json({ error: "Duelo já tem um oponente" }, { status: 400 });
            }
            if (user.id === duel.challenger_id) {
                console.log("[Duels API] User is challenger, cannot join as opponent");
                return NextResponse.json({ error: "Você não pode duelar contra si mesmo" }, { status: 400 });
            }

            const { data: updateData, error: updateError } = await supabase
                .from("duels")
                .update({
                    opponent_id: user.id,
                    status: "active",
                })
                .eq("id", id)
                .select()
                .single();

            console.log("[Duels API] Update result:", { updateData, updateError });

            if (updateError) {
                console.error("[Duels API] Update error:", updateError);
                return NextResponse.json({ error: "Erro ao entrar no duelo" }, { status: 500 });
            }

            console.log("[Duels API] Successfully joined duel, new opponent_id:", updateData?.opponent_id);
            return NextResponse.json({ success: true, message: "Você entrou no duelo!" });
        }

        if (action === "submit_score") {
            // Determine if user is challenger or opponent
            const isChallenger = user.id === duel.challenger_id;
            const isOpponent = user.id === duel.opponent_id;

            if (!isChallenger && !isOpponent) {
                return NextResponse.json({ error: "Você não faz parte deste duelo" }, { status: 403 });
            }

            // Check if user already submitted
            if (isChallenger && duel.challenger_score !== null) {
                return NextResponse.json({ error: "Você já enviou sua pontuação" }, { status: 400 });
            }
            if (isOpponent && duel.opponent_score !== null) {
                return NextResponse.json({ error: "Você já enviou sua pontuação" }, { status: 400 });
            }

            // Update score
            const updateData: Record<string, unknown> = {};
            if (isChallenger) {
                updateData.challenger_score = score;
            } else {
                updateData.opponent_score = score;
            }

            // Check if duel is complete after this update
            const challengerScore = isChallenger ? score : duel.challenger_score;
            const opponentScore = isOpponent ? score : duel.opponent_score;

            if (challengerScore !== null && opponentScore !== null) {
                updateData.status = "completed";
                updateData.completed_at = new Date().toISOString();
            }

            const { error: updateError } = await supabase
                .from("duels")
                .update(updateData)
                .eq("id", id);

            if (updateError) {
                return NextResponse.json({ error: "Erro ao salvar pontuação" }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                isComplete: challengerScore !== null && opponentScore !== null,
                challengerScore,
                opponentScore,
            });
        }

        return NextResponse.json({ error: "Ação inválida" }, { status: 400 });

    } catch (error) {
        console.error("Update duel error:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
