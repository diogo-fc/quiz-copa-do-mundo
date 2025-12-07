// Script para testar conexão com Supabase
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Testando conexao com Supabase...\n");
console.log("URL:", supabaseUrl);
console.log("Key:", supabaseKey?.substring(0, 20) + "...\n");

if (!supabaseUrl || !supabaseKey) {
    console.error("ERRO: Variaveis de ambiente nao encontradas!");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    const tables = ["profiles", "questions", "game_sessions", "user_achievements", "daily_completions"];

    console.log("Verificando tabelas...\n");

    for (const table of tables) {
        try {
            const { data, error, count } = await supabase
                .from(table)
                .select("*", { count: "exact", head: true });

            if (error) {
                console.log("[ERRO] " + table + ": " + error.message);
            } else {
                console.log("[OK] " + table + ": " + (count || 0) + " registros");
            }
        } catch (err) {
            console.log("[ERRO] " + table + ": " + err.message);
        }
    }

    console.log("\nVerificando funcoes RPC...\n");

    // Testar função get_random_questions
    try {
        const { data, error } = await supabase.rpc("get_random_questions", {
            category_filter: null,
            difficulty_filter: null,
            limit_count: 5
        });

        if (error) {
            console.log("[ERRO] get_random_questions: " + error.message);
        } else {
            console.log("[OK] get_random_questions: retornou " + (data?.length || 0) + " perguntas");
        }
    } catch (err) {
        console.log("[ERRO] get_random_questions: " + err.message);
    }

    console.log("\nTeste concluido!");
}

testConnection();
