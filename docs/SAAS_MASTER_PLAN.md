# SaaS Master Plan: FinancePro

Este é o documento definitivo para a transformação do FinancePro em um SaaS lucrativo. Ele consolida a estratégia de preços, viabilidade econômica e o plano técnico de implementação (Permissões, Stripe e Banco de Dados).

---

## 1. Estratégia de Negócio

### O Modelo: Freemium Agressivo
*   **FREE (Entrada)**: Adquire usuários sem custo. 
*   **PRO (Lucro/Volume)**: Converte usuários engajados com preço baixo.
*   **MAX (Premium)**: Monetiza usuários Heavy User com Open Finance e IA.

### Tabela de Preços e Features

| Feature | 🟢 FREE (R$ 0) | 🟡 PRO (R$ 19,90) | 🟣 MAX (R$ 49,90) |
| :--- | :---: | :---: | :---: |
| Lançamento Manual | ⚠️ Max 200 (Total) | ✅ Ilimitado | ✅ Ilimitado |
| Dashboard Básica | ✅ | ✅ | ✅ |
| **Bot WhatsApp** | ❌ (Bloqueado) | ✅ (Áudio/Texto) | ✅ |
| **Open Finance** | ❌ (Bloqueado) | ❌ | ✅ (Automático) |
| **IA Deep Analysis** | ❌ (Bloqueado) | 🟡 (Básico) | ✅ (Completo) |
| Suporte | Comunitário | Prioritário | VIP |

### Viabilidade Financeira (Margem)
*   **Custo Infra Free**: ~R$ 0,00 (Vercel/Mongo Tier Free).
*   **Lucro PRO**: ~R$ 17,90/user (Margem 89%). Custo principal: Twilio.
*   **Lucro MAX**: ~R$ 42,00/user (Margem 85%). Custo principal: Pluggy + Twilio.
*   **Break-even**: Com **12 usuários PRO**, a operação se paga.

---

## 2. Implementação Técnica

### A. Arquitetura (App vs Landing)
*   **Landing Page**: Apenas vitrine. Botão "Assinar" redireciona para o App.
*   **App (FinancePro)**: Centraliza tudo (Auth, Pagamento, Logica).

### B. Banco de Dados (`User.ts`) [PRIORIDADE 1]
Adicionar controle de assinatura no Schema do Usuário.

```typescript
subscription: {
    plan: 'FREE' | 'PRO' | 'MAX';
    status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE';
    providerId: string;    // Stripe Customer ID
    subscriptionId: string; // Stripe Sub ID
    expiresAt: Date;
}
```

### C. Sistema de Permissões (Feature Gating) [PRIORIDADE 2]
Criar um "Guard" central para bloquear acessos no Backend.

**Lógica de Bloqueio:**
1.  **WhatsApp**: Se `plan == FREE`, rejeita mensagens no webhook.
2.  **Pluggy**: Se `plan != MAX`, rotas `/api/bank-connections` retornam 403.
3.  **Insights**: Se `plan == FREE`, retorna apenas resumo simples.

### D. Integração Stripe (Pagamentos & Upgrades) [PRIORIDADE 3]
1.  **Checkout Session**: Criar rota `/api/stripe/checkout`.
    *   Recebe `planId` (Pro ou Max).
    *   Cria sessão no Stripe.
    *   Retorna URL para redirecionamento.
2.  **Webhooks**: Criar rota `/api/stripe/webhook`.
    *   Ouve `checkout.session.completed` -> Ativa plano no Banco.
    *   Ouve `customer.subscription.updated` -> Atualiza status/plano (Upgrade/Downgrade).
    *   Ouve `invoice.payment_failed` -> Marca como `PAST_DUE`.
3.  **Portal do Cliente**: Rota `/api/stripe/portal`.
    *   Permite ao usuário cancelar ou trocar cartão sem intervenção manual.

---

## 3. Plano de Execução

1.  **[ ] Banco de Dados**: Alterar `User` model e criar migração se necessário.
2.  **[ ] Auth Middleware**: Criar utilitário `checkPlan(user, requiredTier)`.
3.  **[ ] Backend Lock**: Protejer rotas do WhatsApp e Pluggy.
4.  **[ ] Frontend Lock**: Criar componente `<PremiumLock>` para esconder botões na UI.
5.  **[ ] Stripe Setup**: Configurar conta, produtos e chaves de API.
6.  **[ ] Checkout Flow**: Implementar rotas de pagamento.

**Próximo Passo**: Executar o item 1 (Banco de Dados).
