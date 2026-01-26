# Estudo de Viabilidade Econômica e Estratégia de Preços (SaaS)

Este documento analisa os custos de infraestrutura ("Unit Economics") e propõe uma estratégia de preços para maximizar lucro mantendo baixa barreira de entrada.

---

## 1. Custo por Usuário (Unit Economics)

### 🤖 Custo de IA (Gemini 1.5 Flash)
*Custo revolucionário de baixo.*
*   **Preço**: $0.075 por 1 Milhão de tokens (Input).
*   **Consumo Médio**: Uma transação com prompt consome ~300 tokens.
*   **Cenário**: Usuário com 100 transações/mês = 30.000 tokens.
*   **Custo Mensal**: $0.002 (R$ 0,01).
*   **Conclusão**: O custo de IA é irrelevante na margem. É lucro quase puro.

### 💬 Custo de WhatsApp (Twilio + Meta)
*O maior ofensor variável.*
*   **Twilio**: $0.005 por mensagem.
*   **Meta**: Janelas de serviço (usuário chama) são GRATUITAS (novidade Nov/2024). Marketing/Utility pagos.
*   **Cenário Típico**: O usuário manda áudio (Iniciado pelo usuário) -> A gente responde (Janela de serviço aberta).
    *   Custo Meta: R$ 0,00.
    *   Custo Twilio: $0.005 (~R$ 0,03) por resposta.
*   **Uso Intenso**: 60 interações/mês = R$ 1,80.

### 🏦 Custo de Open Finance (Pluggy)
*Custo Fixo por Conexão.*
*   **Free Tier**: Até 1.000 conexões (Para devs/indies). Cobre o começo da operação.
*   **Scale**: Após isso, planos customizados (estimar ~R$ 2,00 - R$ 5,00 por conta conectada em volume).
*   **Estratégia**: O plano Free do Pluggy sustenta o "Bootstrap". Quando estourar 1.000 contas, você já terá receita para pagar o Enterprise.

### ☁️ Servidor (Vercel + MongoDB)
*   **Vercel**: Free até limites generosos. Pro ($20/mês) se precisar de mais tempo de execução (que já resolvemos com otimização).
*   **MongoDB Atlas**: Free Tier (M0) aguenta muito. M2 (~$9/mês) é o próximo passo.

---

## 2. Proposta de Precificação

A estratégia é **Freemium Agressivo**. O Free não dá prejuízo (custo quase zero) e enche o funil.

### 🟢 FREE (O "Chamariz")
*   **Preço**: **R$ 0,00**
*   **Custo para você**: ~R$ 0,00 (Serverless free tier).
*   **Objetivo**: Adquirir base de usuários, testar servidor, gerar boca-a-boca.
*   **Limitações**: Somente manual. Sem WhatsApp, sem Banco Automático.

### 🟡 PRO (O "Cash Cow")
*   **Preço Sugerido**: **R$ 19,90 / mês**
*   **Features**: WhatsApp Bot (Text/Audio).
*   **Custo Estimado**: R$ 2,00 (Twilio variado).
*   **Margem de Lucro**: **~89% (R$ 17,90 por user)**.
*   **Por que esse preço?**: Barato o suficiente para ser "uma pizza", caro o suficiente para cobrir qualquer abuso de mensagens.

### 🟣 MAX (O "Premium")
*   **Preço Sugerido**: **R$ 49,90 / mês** (ou R$ 39,90 promo).
*   **Features**: Open Finance + IA Deep Analysis.
*   **Custo Estimado**: R$ 5,00 (Pluggy Estimado futuro) + R$ 0,10 (IA) + R$ 2,00 (Twilio).
*   **Margem de Lucro**: **~85% (R$ 42,00 por user)**.
*   **Âncora**: Faz o plano PRO parecer muito barato. Quem tem vida financeira complexa paga R$ 50 rindo para não ter que digitar nada.

---

## 3. Ponto de Equilíbrio (Break-even)

Considerando custos fixos futuros (Vercel Pro R$ 120 + Mongo R$ 60 + Domínio R$ 50 = R$ 230/mês):

*   Você precisa de **12 usuários PRO** (12 x 19,90 = R$ 238) para pagar toda a infraestrutura "séria".
*   Todo o resto é lucro.

## 4. Estratégia de Crescimento

1.  **Lançamento "Beta Fechado"**: Libere o plano MAX por R$ 29,90 para os primeiros 50 usuários. Isso valida o Pluggy e paga a infra inicial.
2.  **Viralização WhatsApp**: No plano Free, permita 5 mensagens de WhatsApp por mês "para testar". Vicia o usuário na facilidade, depois bloqueia e pede upgrade.
3.  **Anual com Desconto**: Venda 12 meses pelo preço de 10. (Cashflow imediato para investir em tráfego pago).

## 5. Próximos Passos
O sistema está pronto. O gargalo agora é **Comercial**, não técnico.
*   Implementar o Stripe seguindo o Roadmap.
*   Configurar a Landing Page.
*   Começar a vender.
