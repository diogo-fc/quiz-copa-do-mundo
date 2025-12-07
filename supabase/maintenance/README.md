# Supabase Maintenance Scripts

Scripts SQL para verificação e correção de consistência de dados do Copa Quiz Battle.

## Estrutura

```
maintenance/
├── checks/     → SQLs de verificação (read-only)
├── fixes/      → SQLs de correção (alteram dados)
└── reports/    → Relatório completo consolidado
```

## Como Usar

1. **Verificações**: Execute os scripts em `checks/` no Supabase SQL Editor para identificar problemas
2. **Correções**: Execute os scripts em `fixes/` APENAS se as verificações indicarem problemas
3. **Relatório**: Use `reports/relatorio_completo.sql` para um diagnóstico geral

## ⚠️ Importante

- Sempre execute verificações ANTES de correções
- Faça backup antes de executar scripts de correção em produção
- Scripts de correção são irreversíveis

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
