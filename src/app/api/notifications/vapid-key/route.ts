import { NextResponse } from "next/server";

// VAPID keys for Web Push
// In production, these should be stored in environment variables
// Generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

export async function GET() {
    if (!VAPID_PUBLIC_KEY) {
        return NextResponse.json(
            { error: "VAPID key not configured" },
            { status: 500 }
        );
    }

    return NextResponse.json({ publicKey: VAPID_PUBLIC_KEY });
}
