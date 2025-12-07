import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/quiz";
    const error = searchParams.get("error");
    const error_description = searchParams.get("error_description");

    // Handle OAuth errors from provider
    if (error) {
        console.error("OAuth error:", error, error_description);
        return NextResponse.redirect(
            `${origin}/login?error=${encodeURIComponent(error_description || error)}`
        );
    }

    if (code) {
        try {
            const supabase = await createClient();
            const { error: authError } = await supabase.auth.exchangeCodeForSession(code);

            if (!authError) {
                return NextResponse.redirect(`${origin}${next}`);
            }

            console.error("Auth exchange error:", authError.message);
            return NextResponse.redirect(
                `${origin}/login?error=${encodeURIComponent(authError.message)}`
            );
        } catch (err) {
            console.error("Callback error:", err);
            return NextResponse.redirect(`${origin}/login?error=callback_error`);
        }
    }

    // No code provided
    return NextResponse.redirect(`${origin}/login?error=no_code`);
}

