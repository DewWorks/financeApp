# Roadmap de Transição para SaaS (Software as a Service)

Este documento detalha o plano técnico e estratégico para transformar o `FinanceApp` em um produto SaaS com múltiplos tiers (Níveis de Plano).

---

## 1. Estrutura de Planos (Tiers)

Definição clara do que cada plano oferece:

### 🟢 FREE (Gratuito)
- **Foco**: Controle manual básico.
- **Features liberadas**:
    - Cadastro manual de Receitas e Despesas.
    - Dashboard básico (resumo do mês).
    - Categorização padrão.

### 🟡 PRO (Intermediário)
- **Foco**: Automação via WhatsApp.
- **Features liberadas**:
    - Tudo do plano FREE.
    - **Bot de WhatsApp**: Enviar áudios/textos para registrar gastos.
    - Insights Básicos (Semana Atual).
    - Suporte Prioritário por email.

### 🟣 MAX (Avançado)
- **Foco**: Automação Total e IA.
- **Features liberadas**:
    - Tudo do plano PRO.
    - **Open Finance (Pluggy)**: Conexão bancária automática.
    - **Insights de IA Profundos**: Taxa de Poupança, Tendência Semestral, Consultoria do Gemini.
    - Sincronização automática diária.

---

## 2. Arquitetura de Pagamentos

### Recomendação: Stripe (Global/Brasil)
O Stripe é a plataforma mais robusta para SaaS (Assinaturas recorrentes).
- **Checkout Session**: O usuário clica em "Assinar PRO", vai para uma página segura do Stripe, paga e volta.
- **Customer Portal**: O usuário gerencia a própria assinatura (cancelar, upgrade, trocar cartão) sem você programar nada.
- **Webhooks**: O Stripe avisa seu backend quando o pagamento cai (`invoice.paid`) ou falha (`invoice.payment_failed`).

**Alternativa Brasileira Pura**: **Asaas** ou **Pagar.me** (foco em PIX recorrente, mas exige mais código manual para gestão de assinatura).

---

## 3. Mudanças Necessárias (Técnico)

### A. Banco de Dados (`User.ts`)
Precisamos adicionar campos de controle de assinatura:
```typescript
interface IUser {
    // ... campos existentes
    subscription: {
        plan: 'FREE' | 'PRO' | 'MAX';
        status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE';
        providerId: string; // ID do Cliente no Stripe (cus_123...)
        subscriptionId: string; // ID da Assinatura (sub_456...)
        expiresAt: Date; // Data da próxima renovação
    }
}
```

### B. Middleware de Proteção (Feature Gating)
Criar um "Guard" no backend e frontend para bloquear recursos.

**Exemplo Backend (API Route)**:
```typescript
// /api/whatsapp/send
export async function POST(req) {
    const user = await getUser(req);
    if (user.subscription.plan === 'FREE') {
        return NextResponse.json({ error: "Upgrade para PRO necessário" }, { status: 403 });
    }
    // ... segue lógica
}
```

**Exemplo Frontend**:
```tsx
{user.plan === 'FREE' ? (
    <LockedFeature message="Disponível no plano PRO" />
) : (
    <WhatsappSettings />
)}
```

---

## 4. Onde Começar? (Passo a Passo)

1.  **Modelagem**: Atualizar o Schema do Usuário (MongoDB).
2.  **Integração Stripe**:
    - Criar conta no Stripe.
    - Criar os produtos "Pro" e "Max" no painel do Stripe.
    - Implementar rota `/api/checkout` (cria sessão de pagamento).
    - Implementar rota `/api/webhook` (recebe confirmação e atualiza o banco).
3.  **Bloqueio de Funcionalidades**:
    - Colocar ifs (`if user.plan !== 'MAX'`) nas rotas do Pluggy.
    - Colocar ifs nas rotas do WhatsApp.
4.  **Interface de Planos**:
    - Criar página `/pricing` ou `/profile/subscription`.
    - Mostrar cards bonitos comparando os planos.

## 5. Opinião & Próximos Passos
Seu sistema já está **tecnicamente pronto** para ser vendido. As features "core" (Sync bancário, IA, Whatsapp) são diferenciais de alto valor.

**O que falta antes de lançar?**
- **Landing Page**: Uma página "vendedora" fora do app (pode ser Next.js mesmo, na rota `/`) explicando o produto.
- **Termos de Uso**: Essencial para lidar com dados bancários (Open Finance).

Quer começar modelando o banco ou configurando o Stripe?
