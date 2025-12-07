# Supabase Maintenance Scripts

Scripts SQL para verificação e correção de consistência de dados do Copa Quiz Battle.

## Estrutura

```
maintenance/
├── README.md
├── checks/          → SQLs de verificação detalhada (manual)
├── fixes/           → SQLs de correção (alteram dados)
├── functions/       → Funções RPC para automação
│   └── run_all_consistency_checks.sql
└── reports/         → Relatório completo consolidado
```

## 🚀 Setup Rápido

### 1. Criar a função no Supabase

Execute no **Supabase SQL Editor**:
```sql
-- Cole o conteúdo de: functions/run_all_consistency_checks.sql
```

### 2. Testar

```sql
SELECT run_all_consistency_checks();
```

Ou via API:
```
https://quiz-copa-do-mundo.vercel.app/api/maintenance/check
```

## 📊 Verificações Automáticas (via função unificada)

| Tipo | Descrição |
|------|-----------|
| `XP_MISMATCH` | XP do perfil não bate com soma das partidas |
| `LEVEL_MISMATCH` | Nível incorreto para o XP atual |
| `BROKEN_STREAK` | Streak > 0 mas não jogou recentemente |
| `MISSING_ACHIEVEMENT` | Conquista first_quiz faltando |
| `ORPHAN_SESSIONS` | Partidas sem usuário válido |

## 🔧 Quando usar cada pasta

| Pasta | Quando usar |
|-------|------------|
| `checks/` | Diagnóstico detalhado manual (mostra QUAIS registros tem problema) |
| `fixes/` | Corrigir dados após identificar problemas |
| `functions/` | Automação via API e cron jobs |
| `reports/` | Relatório completo para auditoria |

## ⚠️ Importante

- Scripts em `fixes/` têm alterações **comentadas por segurança**
- Sempre execute a versão "DRY RUN" primeiro
- O cron automático roda diariamente às 6:00 AM (Brasil)

## 📧 Relatório por Email

Configurado via Vercel Cron + Resend. Envia email para `dfcsk8@gmail.com` quando encontra problemas.

## Regras de Negócio

### XP
```
XP = FLOOR(score × mode_multiplier × 0.1)

Multiplicadores:
- treino: 0.5
- desafio: 1.0
- diario: 1.2
- duelo: 1.5
```

### Nível
```
XP_para_nivel = FLOOR(100 × nivel^1.5)
```

### Streak
- Jogou ontem → incrementa
- Pulou um dia → reseta para 1
- Já jogou hoje → mantém
