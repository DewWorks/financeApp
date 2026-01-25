# Estudo de Escala: Cenário com 2.000 Usuários

Análise técnica e financeira para suportar uma base de **2.000 usuários ativos**, com média de **300 transações/mês** cada.

**Volume Total de Processamento:**
*   **Transações Mensais:** 600.000 txns/mês.
*   **Requisições de IA:** ~180.000 (Considerando Delta Sync - apenas 30% são novas ou editadas).
*   **Mensagens WhatsApp:** ~60.000/mês (30 msgs/usuário).

---

## 1. Infraestrutura (Onde roda o código)

### ☁️ Vercel (Serverless)
*   **Cenário**: 2.000 usuários acessando o app 2x ao dia + Sync Background.
*   **Invocations**: ~500.000 a 800.000 invocações/mês.
*   **Plano**: Vercel Pro ($20 USD / ~R$ 120).
    *   **Limite**: Inclui 1.000.000 de invocações.
    *   **Veredito**: ✅ **Coberto pelo plano base Pro.** Sem sustos.

### 🍃 MongoDB Atlas (Banco de Dados)
*   **Dados**: 600.000 txns x 800 bytes = ~480 MB / mês.
*   **Acumulado (1 ano)**: ~5.7 GB.
*   **IOPS (Leitura/Escrita)**: Com o **BulkWrite** (que implementamos), o banco "nem sente". A carga é muito baixa para 2k usuários.
*   **Plano**:
    *   Começa no **M2** ($9 / ~R$ 54).
    *   Em 6 meses migra para **M10** ($57 / ~R$ 340).
    *   **Veredito**: ✅ Custo baixo e escalável.

---

## 2. APIs Externas (Onde gasta dinheiro)

### 🏦 Open Finance (Pluggy) - O Grande Custo
Aqui está o "gargalo" financeiro.
*   **2.000 Conexões**: Ultrapassa o Free Tier (limite 1.000).
*   **Preço Enterprise**: Estima-se R$ 2,50 por conexão ativa.
*   **Custo Mensal**: 2.000 x R$ 2,50 = **R$ 5.000,00**.
*   *Nota*: Esse custo só existe se o usuário for **Plano MAX (Pago)**. Então a receita cobre.

### 🤖 IA (Gemini 1.5 Flash)
*   **Volume**: 180.000 chamadas x 500 tokens (Input+Output).
*   **Total Tokens**: 90 Milhões de tokens.
*   **Custo**: $0.075 por milhão => 90 * 0.075 = $6.75 USD.
*   **Custo Mensal**: **~R$ 40,00**. (Sim, a IA é absurdamente barata).

### 💬 WhatsApp (Twilio)
*   **Volume**: 60.000 mensagens enviadas.
*   **Custo**: 60k * $0.005 = $300 USD.
*   **Custo Mensal**: **~R$ 1.800,00**.
*   *Nota*: Apenas usuários **PRO/MAX** usam. Receita cobre.

---

## 3. Resumo Financeiro (P&L)

| Item | Custo Mensal Estimado | Quem Paga? |
| :--- | :--- | :--- |
| Infra (Vercel + Mongo) | R$ 460,00 | Custo Fixo |
| Pluggy (2.000 conexões) | R$ 5.000,00 | Cliente MAX |
| Twilio (60k msgs) | R$ 1.800,00 | Cliente PRO/MAX |
| Gemini IA | R$ 40,00 | Cliente MAX |
| **Custo Total Operacional** | **R$ 7.300,00** | |

### Receita Projetada (Cenário Conservador)
Imagine os 2.000 usuários distribuídos assim:
*   **1.000 Free**: R$ 0. (Custo de infra marginal).
*   **600 Pro (R$ 19,90)**: R$ 11.940,00.
*   **400 Max (R$ 49,90)**: R$ 19.960,00.

**Faturamento Bruto**: R$ 31.900,00 / mês.
**Lucro Operacional**: R$ 31.900 - R$ 7.300 = **R$ 24.600,00 / mês (Lucro Líquido)**.

## 4. Conclusão
O sistema **aguenta tranquilamente** 2.000 usuários com a arquitetura atual (Serverless + Mongo).
*   Não precisa de servidor dedicado.
*   Não precisa de Kubernetes/Docker Swarm.
*   O gargalo é apenas financeiro (pagar as APIs), mas a margem de lucro de **77%** é excelente.
