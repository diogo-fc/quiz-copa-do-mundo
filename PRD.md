# Copa Quiz Battle — PRD (Product Requirements Document)

> **Versão:** 1.0  
> **Evento:** Copa do Mundo FIFA 2026 (EUA, México, Canadá)  
> **Plataforma:** Web App (PWA) — Mobile First  

---

## 1. Visão do Produto

Copa Quiz Battle é um jogo de perguntas e respostas multiplayer sobre a história das Copas do Mundo. Os usuários competem em quizzes sobre seleções, jogadores, curiosidades e momentos históricos, acumulando pontos e subindo em rankings.

### Proposta de Valor

- Entretenimento gratuito e educativo para fãs de futebol
- Competição social com amigos e comunidade global
- Conteúdo atualizado em tempo real durante a Copa
- Sem paywall — monetização 100% indireta (ads, afiliados)

---

## 2. Público-Alvo

### Persona Primária: Torcedor Casual
- Idade: 18-45 anos
- Assiste jogos da Copa mas não acompanha futebol o ano todo
- Busca entretenimento rápido durante intervalos e pré-jogos
- Gosta de competir com amigos em redes sociais

### Persona Secundária: Fanático por Futebol
- Idade: 25-55 anos
- Conhecimento profundo sobre história das Copas
- Quer provar seu conhecimento e desafiar outros
- Valoriza perguntas difíceis e nichos específicos

---

## 3. Funcionalidades (MVP)

### 3.1 Sistema de Quiz

| Modo | Descrição |
|------|-----------|
| **Treino** | Quiz solo com perguntas aleatórias, sem limite de tempo. Ideal para aprender. |
| **Desafio** | Rodadas cronometradas (15 perguntas em 5 minutos). Pontuação por acerto + velocidade. |
| **Duelo PvP** | Desafie um amigo via link. Mesmo set de perguntas, quem pontua mais vence. |
| **Quiz Diário** | 5 perguntas novas todo dia. Streak rewards para dias consecutivos. |
| **Quiz Temático** | Categorias: Seleções, Artilheiros, Finais, Curiosidades, Copa 2026. |

### 3.2 Sistema de Progressão

| Elemento | Mecânica |
|----------|----------|
| **XP** | Ganho por acerto, bônus por streak, multiplicador por dificuldade |
| **Níveis** | 1-100 com títulos: Reserva → Titular → Craque → Lenda |
| **Conquistas** | Badges colecionáveis (ex: "Conhecedor de Finais", "Expert Brasil") |
| **Ranking Global** | Tabela semanal e mensal. Reset no início da Copa. |
| **Ranking Amigos** | Comparação apenas entre amigos conectados |

### 3.3 Sistema Social

- Login social (Google)
- Compartilhar resultados com card visual para Instagram/WhatsApp
- Convidar amigos via link direto para duelo
- Feed de atividades dos amigos

### 3.4 Mecânicas de Engajamento

- **Dicas:** Eliminar 2 opções erradas (limitado por dia ou via rewarded ad)
- **Vidas:** 3 vidas no modo desafio, recupera com tempo ou rewarded ad
- **Streaks:** Bônus por dias consecutivos jogando
- **Notificações:** Quiz diário disponível, amigo te desafiou, novo recorde

---

## 4. Monetização

**Modelo:** 100% gratuito para usuários. Receita indireta.

| Canal | Implementação | Receita Estimada |
|-------|---------------|------------------|
| **Google AdSense** | Banner no rodapé + Interstitial entre rodadas (max 1/3 jogos) | $2-5 CPM |
| **Rewarded Ads** | "Assista 30s para vida extra" ou "Dobrar XP" | $10-20 CPM |
| **Patrocínio** | "Perguntas sobre Brasil por [Marca]" | R$ 5k-20k/mês |
| **Afiliados Bets** | CTA para casas .bet.br após quiz de estatísticas | R$ 50-200/lead |
| **Afiliados E-commerce** | Links para camisas oficiais (Amazon, Netshoes) | 3-8% comissão |

### Projeção Conservadora

| Métrica | Pré-Copa | Durante Copa |
|---------|----------|--------------|
| MAU | 10.000 | 100.000 |
| Pageviews/mês | 150.000 | 2.000.000 |
| Receita Total | R$ 1.000 | R$ 16.000 |

---

## 5. User Stories

### Épico: Onboarding
- [ ] Como usuário, quero criar conta com Google em 1 clique
- [ ] Como usuário, quero fazer quiz tutorial de 5 perguntas
- [ ] Como usuário, quero escolher minha seleção favorita

### Épico: Gameplay
- [ ] Como jogador, quero ver timer claramente para cada pergunta
- [ ] Como jogador, quero ver resposta correta + explicação após errar
- [ ] Como jogador, quero filtrar perguntas por categoria
- [ ] Como jogador, quero usar dica para eliminar 2 opções
- [ ] Como jogador, quero ver meu progresso de XP e nível
- [ ] Como jogador, quero receber notificação do quiz diário

### Épico: Social
- [ ] Como jogador, quero desafiar amigo via link WhatsApp
- [ ] Como jogador, quero compartilhar resultado como card bonito
- [ ] Como jogador, quero ver ranking comparado aos amigos
- [ ] Como jogador, quero ver feed de atividades dos amigos

### Épico: Monetização
- [ ] Como usuário, quero assistir ad para ganhar vida extra
- [ ] Como usuário, quero ver ads não-intrusivos (banner rodapé)
- [ ] Como sistema, quero rastrear cliques em links de afiliados

---

## 6. Arquitetura Técnica

### 6.1 Stack Recomendado

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| **Frontend** | Next.js 14 + React 18 | SSR para SEO, App Router, deploy fácil |
| **Estilização** | Tailwind CSS | Produtividade, responsivo, bundle pequeno |
| **Backend/Auth/DB** | Supabase | Auth social, PostgreSQL, Realtime, Storage |
| **Hospedagem** | Vercel (Free Tier) | CI/CD automático, edge functions, SSL |
| **Analytics** | Google Analytics 4 | Gratuito, integração com AdSense |
| **Ads** | Google AdSense | Maior inventário, pagamento em reais |

### 6.2 Estrutura de Pastas

```
/app
  /(auth)
    /login/page.tsx
    /callback/page.tsx
  /(game)
    /play/page.tsx
    /play/[mode]/page.tsx
    /results/[sessionId]/page.tsx
  /(social)
    /ranking/page.tsx
    /profile/page.tsx
    /duel/[id]/page.tsx
  /api
    /questions/route.ts
    /sessions/route.ts
    /achievements/route.ts
/components
  /ui (Button, Card, Modal, etc.)
  /game (QuestionCard, Timer, ProgressBar, etc.)
  /social (ShareCard, RankingList, etc.)
/lib
  /supabase.ts
  /utils.ts
  /constants.ts
/hooks
  /useAuth.ts
  /useQuiz.ts
  /useTimer.ts
```

### 6.3 Modelo de Dados (Supabase/PostgreSQL)

```sql
-- Usuários
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  favorite_team TEXT,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak_days INTEGER DEFAULT 0,
  last_played_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Perguntas
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  options JSONB NOT NULL, -- ["opção A", "opção B", "opção C", "opção D"]
  correct_index INTEGER NOT NULL, -- 0-3
  category TEXT NOT NULL, -- 'selecoes', 'finais', 'artilheiros', 'curiosidades', 'copa2026'
  difficulty TEXT NOT NULL, -- 'facil', 'medio', 'dificil'
  explanation TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sessões de Jogo
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  mode TEXT NOT NULL, -- 'treino', 'desafio', 'duelo', 'diario'
  category TEXT,
  score INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  time_spent_seconds INTEGER,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Respostas (para analytics)
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(id),
  question_id UUID REFERENCES questions(id),
  selected_index INTEGER,
  is_correct BOOLEAN,
  time_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Conquistas
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL, -- 'first_game', 'streak_7', 'expert_brasil', etc.
  unlocked_at TIMESTAMP DEFAULT NOW()
);

-- Duelos
CREATE TABLE duels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID REFERENCES users(id),
  opponent_id UUID REFERENCES users(id),
  question_ids JSONB NOT NULL, -- IDs das perguntas do duelo
  challenger_score INTEGER,
  opponent_score INTEGER,
  status TEXT DEFAULT 'pending', -- 'pending', 'active', 'completed'
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Índices
CREATE INDEX idx_questions_category ON questions(category);
CREATE INDEX idx_sessions_user ON game_sessions(user_id);
CREATE INDEX idx_achievements_user ON achievements(user_id);
```

### 6.4 APIs Principais

```typescript
// GET /api/questions?category=selecoes&difficulty=medio&limit=15
// Retorna perguntas aleatórias filtradas

// POST /api/sessions
// Body: { mode, category, questionIds }
// Cria nova sessão de jogo

// PATCH /api/sessions/[id]
// Body: { answers: [...], score, completed: true }
// Atualiza sessão com respostas

// POST /api/duels
// Body: { opponentId? }
// Cria duelo e retorna link compartilhável

// GET /api/ranking?type=global|friends&period=weekly|monthly
// Retorna ranking ordenado por XP
```

---

## 7. UI/UX Guidelines

### Design System

- **Cores Primárias:** Verde (#10B981), Amarelo (#FBBF24), Azul (#3B82F6)
- **Cores de Feedback:** Correto (#22C55E), Errado (#EF4444)
- **Fundo:** Dark mode padrão (#0F172A), light mode opcional
- **Tipografia:** Inter (UI), sistema nativo para performance
- **Bordas:** Arredondadas (rounded-xl), sombras sutis
- **Animações:** Framer Motion para transições suaves

### Telas Principais

1. **Home:** Seleção de modo de jogo, stats rápidas, quiz diário destacado
2. **Quiz:** Pergunta + 4 opções + timer + progresso
3. **Resultado:** Score, XP ganho, comparação com média, botão compartilhar
4. **Ranking:** Tabs (Global/Amigos), lista com avatar e score
5. **Perfil:** Stats, conquistas, histórico, configurações
6. **Share Card:** Imagem 1080x1920 com resultado para stories

### Mobile First

- Touch targets mínimo 44x44px
- Navegação por gestos onde aplicável
- Bottom navigation fixa
- Fontes legíveis (min 16px body)

---

## 8. Cronograma

| Fase | Duração | Entregas |
|------|---------|----------|
| **MVP** | 4 semanas | Quiz básico, auth, 200 perguntas, ranking simples |
| **Beta** | 3 semanas | Duelos PvP, compartilhamento social, conquistas |
| **Launch** | 2 semanas | Ads, PWA, performance, SEO |
| **Growth** | Contínuo | Perguntas Copa 2026, parcerias, melhorias |

---

## 9. Requisitos Não-Funcionais

- **Performance:** FCP < 1.5s, LCP < 2.5s
- **Responsividade:** Funcional em 320px+
- **PWA:** Instalável, funciona offline (modo treino)
- **Acessibilidade:** WCAG 2.1 nível AA
- **SEO:** Lighthouse score > 90
- **Segurança:** RLS no Supabase, validação server-side

---

## 10. Métricas de Sucesso (KPIs)

| Métrica | Meta Pré-Copa | Meta Durante Copa |
|---------|---------------|-------------------|
| Instalações | 5.000 | 50.000 |
| DAU | 500 | 15.000 |
| Retenção D7 | 25% | 40% |
| Sessão Média | 4 min | 8 min |
| Partidas/Usuário/Dia | 2 | 5 |
| Taxa Compartilhamento | 5% | 15% |

---

## 11. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Baixa adesão inicial | Alto | Lançar 2 meses antes, SEO, parcerias |
| Perguntas repetitivas | Médio | 500+ perguntas, rotação inteligente |
| Sobrecarga servidor | Médio | Edge functions, cache, Supabase escala |
| AdSense rejeitado | Alto | Alternativas: Media.net, Ezoic |
| Concorrência | Baixo | UX superior, viralidade social |

---

## 12. Checklist de Lançamento

- [ ] 200+ perguntas categorizadas e revisadas
- [ ] Auth funcionando (Google, Facebook, Apple)
- [ ] 5 modos de quiz implementados
- [ ] Sistema de XP e níveis
- [ ] Ranking global e de amigos
- [ ] Share card para redes sociais
- [ ] PWA configurado com manifest e service worker
- [ ] Google Analytics integrado
- [ ] AdSense aprovado e implementado
- [ ] Testes em iOS Safari e Android Chrome
- [ ] Performance Lighthouse > 90
- [ ] Termos de uso e política de privacidade
- [ ] Domínio configurado com SSL

---

*Este documento serve como fonte de verdade para o desenvolvimento. Referencie-o com `@PRD.md` no Antigravity.*
