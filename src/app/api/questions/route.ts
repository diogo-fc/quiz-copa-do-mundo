import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { QuestionCategory, QuestionDifficulty } from "@/types";

export const dynamic = 'force-dynamic'; // Disable Next.js caching

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);

        // Parse query parameters
        const category = searchParams.get("category") as QuestionCategory | null;
        const difficulty = searchParams.get("difficulty") as QuestionDifficulty | null;
        const limit = parseInt(searchParams.get("limit") || "10", 10);

        // Build query with proper randomization using PostgreSQL's random()
        let query = supabase
            .from("questions")
            .select("*");

        // Apply filters
        if (category) {
            query = query.eq("category", category);
        }

        if (difficulty) {
            query = query.eq("difficulty", difficulty);
        }

        // Fetch all matching questions first
        const { data, error } = await query;

        if (error) {
            console.error("Error fetching questions:", error);
            return NextResponse.json(
                { error: "Erro ao buscar perguntas" },
                { status: 500 }
            );
        }

        if (!data || data.length === 0) {
            return NextResponse.json(
                { error: "Nenhuma pergunta encontrada" },
                { status: 404 }
            );
        }

        // Fisher-Yates shuffle for true randomization
        const shuffled = [...data];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        // Take only the requested limit
        const questions = shuffled.slice(0, Math.min(limit, shuffled.length));

        return NextResponse.json({ questions });
    } catch (error) {
        console.error("Error in questions API:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}

