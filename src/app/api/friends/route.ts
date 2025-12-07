import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - List friends
export async function GET() {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
        }

        // Get accepted friendships (both directions)
        const { data: friendships, error } = await supabase
            .from("friendships")
            .select(`
                id,
                friend_id,
                user_id,
                status,
                created_at,
                friend:profiles!friendships_friend_id_fkey(id, name, avatar_url, xp, level),
                user:profiles!friendships_user_id_fkey(id, name, avatar_url, xp, level)
            `)
            .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
            .eq("status", "accepted");

        if (error) {
            console.error("Error fetching friends:", error);
            return NextResponse.json({ error: "Erro ao buscar amigos" }, { status: 500 });
        }

        // Format friends list (get the other person in each friendship)
        const friends = friendships?.map((f) => {
            const friendProfile = f.user_id === user.id ? f.friend : f.user;
            return {
                friendship_id: f.id,
                ...friendProfile,
            };
        }) || [];

        return NextResponse.json({ friends });
    } catch (error) {
        console.error("Error in friends API:", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}

// POST - Add friend (by email or user ID)
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
        }

        const body = await request.json();
        const { email, friend_id } = body;

        let targetUserId = friend_id;

        // If email provided, find user by email
        if (email && !friend_id) {
            const { data: targetUser, error: findError } = await supabase
                .from("profiles")
                .select("id")
                .eq("email", email.toLowerCase())
                .single();

            if (findError || !targetUser) {
                return NextResponse.json(
                    { error: "Usuário não encontrado com esse email" },
                    { status: 404 }
                );
            }
            targetUserId = targetUser.id;
        }

        if (!targetUserId) {
            return NextResponse.json(
                { error: "Email ou ID do amigo é obrigatório" },
                { status: 400 }
            );
        }

        // Can't add yourself
        if (targetUserId === user.id) {
            return NextResponse.json(
                { error: "Você não pode adicionar a si mesmo" },
                { status: 400 }
            );
        }

        // Check if friendship already exists
        const { data: existing } = await supabase
            .from("friendships")
            .select("id, status")
            .or(`and(user_id.eq.${user.id},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${user.id})`)
            .single();

        if (existing) {
            if (existing.status === "accepted") {
                return NextResponse.json(
                    { error: "Vocês já são amigos" },
                    { status: 400 }
                );
            }
            // If pending in other direction, accept it
            const { error: updateError } = await supabase
                .from("friendships")
                .update({ status: "accepted" })
                .eq("id", existing.id);

            if (updateError) {
                return NextResponse.json(
                    { error: "Erro ao aceitar solicitação" },
                    { status: 500 }
                );
            }

            return NextResponse.json({ message: "Amizade aceita!", status: "accepted" });
        }

        // Create new friendship (auto-accept for simplicity)
        const { error: insertError } = await supabase
            .from("friendships")
            .insert({
                user_id: user.id,
                friend_id: targetUserId,
                status: "accepted", // Auto-accept for MVP
            });

        if (insertError) {
            console.error("Error adding friend:", insertError);
            return NextResponse.json(
                { error: "Erro ao adicionar amigo" },
                { status: 500 }
            );
        }

        return NextResponse.json({ message: "Amigo adicionado!", status: "accepted" });
    } catch (error) {
        console.error("Error in friends API:", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}

// DELETE - Remove friend
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const friendshipId = searchParams.get("id");

        if (!friendshipId) {
            return NextResponse.json({ error: "ID da amizade obrigatório" }, { status: 400 });
        }

        // Delete friendship where user is involved
        const { error } = await supabase
            .from("friendships")
            .delete()
            .eq("id", friendshipId)
            .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

        if (error) {
            return NextResponse.json({ error: "Erro ao remover amigo" }, { status: 500 });
        }

        return NextResponse.json({ message: "Amigo removido" });
    } catch (error) {
        console.error("Error in friends API:", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
