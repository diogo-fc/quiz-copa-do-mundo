/**
 * Script para carregar perguntas no Supabase
 * 
 * Uso: npx tsx scripts/seed-questions.ts
 * 
 * Requer as seguintes variáveis de ambiente:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SECRET_KEY (service_role key para bypass RLS)
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Carregar variáveis de ambiente
dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;

// Interface para perguntas do JSON
interface QuestionFromJSON {
    id?: string;
    text?: string;
    question?: string; // alguns arquivos usam 'question' ao invés de 'text'
    options: string[];
    correct_answer: number | string;
    category: string;
    difficulty: string;
    explanation?: string;
}

// Interface para perguntas no formato do banco
interface QuestionForDB {
    id?: string;
    text: string;
    options: string[];
    correct_answer: number;
    category: string;
    difficulty: string;
    explanation?: string;
}

// Normalizar categoria para formato do banco
function normalizeCategory(category: string): string {
    const categoryMap: Record<string, string> = {
        "artilheiros": "artilheiros",
        "finais": "finais",
        "selecoes": "selecoes",
        "curiosidades": "curiosidades",
        "copa2026": "copa2026",
        "Copa 2026": "copa2026",
    };
    return categoryMap[category] || category.toLowerCase().replace(/\s+/g, "");
}

// Normalizar dificuldade para formato do banco
function normalizeDifficulty(difficulty: string): string {
    const difficultyMap: Record<string, string> = {
        "facil": "facil",
        "fácil": "facil",
        "easy": "facil",
        "medio": "medio",
        "médio": "medio",
        "medium": "medio",
        "dificil": "dificil",
        "difícil": "dificil",
        "hard": "dificil",
    };
    return difficultyMap[difficulty] || difficulty.toLowerCase();
}

// Converter correct_answer para índice numérico
function normalizeCorrectAnswer(answer: number | string, options: string[]): number {
    if (typeof answer === "number") {
        return answer;
    }
    // Se for string, encontrar o índice da opção correta
    const index = options.findIndex(opt => opt === answer);
    return index >= 0 ? index : 0;
}

async function seedQuestions(): Promise<void> {
    console.log("🏆 Copa Quiz - Seed de Perguntas\n");
    console.log("=".repeat(50));

    // Validar variáveis de ambiente
    if (!SUPABASE_URL) {
        console.error("❌ ERRO: NEXT_PUBLIC_SUPABASE_URL não definida!");
        process.exit(1);
    }

    if (!SUPABASE_SERVICE_KEY) {
        console.error("❌ ERRO: SUPABASE_SECRET_KEY não definida!");
        console.error("   Adicione a variável SUPABASE_SECRET_KEY no .env.local");
        console.error("   Você pode encontrar essa chave no Supabase Dashboard > Settings > API");
        process.exit(1);
    }

    console.log(`✅ URL: ${SUPABASE_URL.substring(0, 30)}...`);
    console.log(`✅ Service Key: ${SUPABASE_SERVICE_KEY.substring(0, 20)}...`);
    console.log();

    // Criar cliente Supabase com service_role key (bypass RLS)
    const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    // Carregar arquivo JSON
    const jsonPath = path.join(process.cwd(), "data", "questions_unified.json");

    if (!fs.existsSync(jsonPath)) {
        console.error(`❌ ERRO: Arquivo não encontrado: ${jsonPath}`);
        process.exit(1);
    }

    console.log(`📂 Lendo arquivo: ${jsonPath}\n`);

    // Limpar tabela antes de inserir
    console.log("🗑️  Limpando tabela questions...");
    const { error: deleteError } = await supabase
        .from("questions")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // deleta todos (workaround para delete all)

    if (deleteError) {
        console.error(`❌ Erro ao limpar tabela: ${deleteError.message}`);
        process.exit(1);
    }
    console.log("✅ Tabela limpa!\n");

    const rawData = fs.readFileSync(jsonPath, "utf-8");
    const questions: QuestionFromJSON[] = JSON.parse(rawData);

    console.log(`📊 Total de perguntas no arquivo: ${questions.length}\n`);

    // Processar e normalizar perguntas
    const questionsForDB: QuestionForDB[] = questions.map((q, index) => {
        const text = q.text || q.question || "";

        if (!text) {
            console.warn(`⚠️  Pergunta ${index + 1} sem texto, ignorando...`);
            return null;
        }

        const question: QuestionForDB = {
            text: text,
            options: q.options,
            correct_answer: normalizeCorrectAnswer(q.correct_answer, q.options),
            category: normalizeCategory(q.category),
            difficulty: normalizeDifficulty(q.difficulty),
            explanation: q.explanation,
        };

        // Só inclui id se existir no JSON e for um UUID válido
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (q.id && uuidRegex.test(q.id)) {
            question.id = q.id;
        }

        return question;
    }).filter((q): q is QuestionForDB => q !== null);

    // Separar perguntas com e sem id
    const questionsWithId = questionsForDB.filter(q => q.id);
    const questionsWithoutId = questionsForDB.filter(q => !q.id);

    console.log(`✅ Perguntas válidas para inserção: ${questionsForDB.length}`);
    console.log(`   - Com ID (upsert): ${questionsWithId.length}`);
    console.log(`   - Sem ID (insert): ${questionsWithoutId.length}\n`);
    console.log("=".repeat(50));
    console.log("Iniciando inserção em lotes...\n");

    // Upsert/Insert em lotes de 50
    const BATCH_SIZE = 50;
    let successCount = 0;
    let errorCount = 0;
    const errors: { index: number; error: string }[] = [];

    // Primeiro: inserir perguntas SEM id (insert normal)
    if (questionsWithoutId.length > 0) {
        console.log("📝 Inserindo perguntas sem ID...\n");
        for (let i = 0; i < questionsWithoutId.length; i += BATCH_SIZE) {
            const batch = questionsWithoutId.slice(i, i + BATCH_SIZE);
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(questionsWithoutId.length / BATCH_SIZE);

            process.stdout.write(`📦 Lote ${batchNumber}/${totalBatches} (${batch.length} perguntas)... `);

            const { error } = await supabase
                .from("questions")
                .insert(batch)
                .select();

            if (error) {
                console.log("❌");
                console.error(`   Erro: ${error.message}`);
                errors.push({ index: i, error: error.message });
                errorCount += batch.length;
            } else {
                console.log("✅");
                successCount += batch.length;
            }
        }
    }

    // Segundo: upsert perguntas COM id
    if (questionsWithId.length > 0) {
        console.log("\n📝 Upsert perguntas com ID...\n");
        for (let i = 0; i < questionsWithId.length; i += BATCH_SIZE) {
            const batch = questionsWithId.slice(i, i + BATCH_SIZE);
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(questionsWithId.length / BATCH_SIZE);

            process.stdout.write(`📦 Lote ${batchNumber}/${totalBatches} (${batch.length} perguntas)... `);

            const { error } = await supabase
                .from("questions")
                .upsert(batch, {
                    onConflict: "id",
                    ignoreDuplicates: false,
                })
                .select();

            if (error) {
                console.log("❌");
                console.error(`   Erro: ${error.message}`);
                errors.push({ index: i, error: error.message });
                errorCount += batch.length;
            } else {
                console.log("✅");
                successCount += batch.length;
            }
        }
    }

    // Resumo final
    console.log("\n" + "=".repeat(50));
    console.log("📊 RESUMO\n");
    console.log(`   ✅ Inseridas/atualizadas: ${successCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);

    if (errors.length > 0) {
        console.log("\n⚠️  Detalhes dos erros:");
        errors.forEach(e => {
            console.log(`   - Lote iniciando em ${e.index}: ${e.error}`);
        });
    }

    // Verificar contagem final no banco
    const { count, error: countError } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true });

    if (!countError && count !== null) {
        console.log(`\n📈 Total de perguntas no banco: ${count}`);
    }

    console.log("\n🎉 Seed concluído!");
}

// Executar
seedQuestions().catch((err) => {
    console.error("❌ Erro fatal:", err);
    process.exit(1);
});
