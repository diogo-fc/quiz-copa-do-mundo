import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Email configuration
const REPORT_EMAIL = "dfcsk8@gmail.com";
const RESEND_API_KEY = process.env.RESEND_API_KEY;

interface Issue {
    type: string;
    description: string;
    count: number;
}

interface CheckResult {
    timestamp: string;
    issues: Issue[];
    stats: {
        totalUsers: number;
        totalSessions: number;
        totalAchievements: number;
    };
    healthy: boolean;
}

// Run all consistency checks using unified SQL function
async function runChecks(): Promise<CheckResult> {
    const supabase = await createClient();

    // Call the unified consistency check function
    const { data, error } = await supabase.rpc("run_all_consistency_checks");

    if (error) {
        console.error("Error running consistency checks:", error);
        // Fallback to basic stats if function doesn't exist
        const { count: totalUsers } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true });

        const { count: totalSessions } = await supabase
            .from("game_sessions")
            .select("*", { count: "exact", head: true });

        const { count: totalAchievements } = await supabase
            .from("user_achievements")
            .select("*", { count: "exact", head: true });

        // Check broken streaks manually as fallback
        const { data: streakIssues } = await supabase
            .from("profiles")
            .select("id")
            .gt("streak_days", 0)
            .is("last_played_at", null);

        const issues: Issue[] = [];
        if (streakIssues && streakIssues.length > 0) {
            issues.push({
                type: "BROKEN_STREAK",
                description: "Streaks que deveriam ter sido resetados",
                count: streakIssues.length,
            });
        }

        return {
            timestamp: new Date().toISOString(),
            issues,
            stats: {
                totalUsers: totalUsers || 0,
                totalSessions: totalSessions || 0,
                totalAchievements: totalAchievements || 0,
            },
            healthy: issues.length === 0,
        };
    }

    // Parse the result from the SQL function
    const result = data as {
        timestamp: string;
        healthy: boolean;
        stats: { total_users: number; total_sessions: number; total_achievements: number };
        issues: (Issue | null)[];
        issue_counts: { total: number };
    };

    // Filter out null issues
    const issues = (result.issues || []).filter((i): i is Issue => i !== null);

    return {
        timestamp: result.timestamp,
        issues,
        stats: {
            totalUsers: result.stats.total_users,
            totalSessions: result.stats.total_sessions,
            totalAchievements: result.stats.total_achievements,
        },
        healthy: result.healthy,
    };
}

// Send email report using Resend
async function sendEmailReport(result: CheckResult): Promise<boolean> {
    if (!RESEND_API_KEY) {
        console.log("RESEND_API_KEY not configured, skipping email");
        return false;
    }

    const statusEmoji = result.healthy ? "✅" : "⚠️";
    const subject = `${statusEmoji} Copa Quiz - Relatório de Manutenção ${new Date().toLocaleDateString("pt-BR")}`;

    const issuesList = result.issues.length > 0
        ? result.issues.map(i => `• ${i.type}: ${i.description} (${i.count} casos)`).join("\n")
        : "Nenhum problema encontrado!";

    const htmlContent = `
        <h2>${statusEmoji} Relatório de Manutenção - Copa Quiz Battle</h2>
        <p><strong>Data:</strong> ${new Date().toLocaleString("pt-BR")}</p>
        
        <h3>📊 Estatísticas</h3>
        <ul>
            <li>Usuários: ${result.stats.totalUsers}</li>
            <li>Partidas: ${result.stats.totalSessions}</li>
            <li>Conquistas: ${result.stats.totalAchievements}</li>
        </ul>
        
        <h3>${result.healthy ? "✅ Status: Saudável" : "⚠️ Problemas Encontrados"}</h3>
        <pre>${issuesList}</pre>
        
        ${!result.healthy ? `
        <p><strong>Ação necessária:</strong> Acesse o Supabase SQL Editor e execute os scripts de correção em <code>supabase/maintenance/fixes/</code></p>
        ` : ""}
        
        <hr>
        <p style="color: #666; font-size: 12px;">Enviado automaticamente pelo Copa Quiz Battle</p>
    `;

    try {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "Copa Quiz <noreply@resend.dev>",
                to: [REPORT_EMAIL],
                subject,
                html: htmlContent,
            }),
        });

        if (!response.ok) {
            console.error("Failed to send email:", await response.text());
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
}

// GET - Run checks (can be called by Vercel Cron)
export async function GET(request: Request) {
    // Verify cron secret for security (optional but recommended)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        console.log("Starting maintenance checks...");
        const result = await runChecks();

        // Send email if there are issues OR if it's a daily report
        const sendDaily = process.env.SEND_DAILY_REPORT === "true";
        if (!result.healthy || sendDaily) {
            await sendEmailReport(result);
        }

        console.log("Maintenance check completed:", result.healthy ? "Healthy" : "Issues found");

        return NextResponse.json({
            success: true,
            ...result,
        });
    } catch (error) {
        console.error("Error running maintenance checks:", error);
        return NextResponse.json(
            { error: "Failed to run checks", details: String(error) },
            { status: 500 }
        );
    }
}
