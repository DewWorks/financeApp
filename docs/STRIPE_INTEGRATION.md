# Documentação da Integração Stripe

Esta documentação descreve toda a lógica técnica, fluxo de dados e componentes envolvidos na integração de pagamentos e assinaturas utilizando o Stripe.

## Visão Geral

O sistema utiliza o Stripe no modo **Assinatura (Subscription)** para gerenciar os planos de acesso (Free, Pro e Ultimate). A integração é composta por:

1.  **Frontend**: Interface de seleção de planos e gatilhos de upgrade.
2.  **API Checkout**: Rota para criação de sessões de pagamento.
3.  **API Webhook**: Rota para escutar eventos assíncronos do Stripe e sincronizar o banco de dados.
4.  **Banco de Dados**: Persistência do estado da assinatura no modelo de Usuário.

---

## 1. Pré-requisitos e Configuração

Para o correto funcionamento, as seguintes variáveis de ambiente devem estar configuradas no arquivo `.env`:

*   `STRIPE_SECRET_KEY`: Chave secreta da API Stripe (Server-side).
*   `NEXT_PUBLIC_STRIPE_PUBLIC_KEY`: Chave pública (Client-side, se necessário).
*   `STRIPE_WEBHOOK_SECRET`: Segredo de assinatura para verificar a autenticidade dos webhooks.
*   `STRIPE_PLAN_PRO`: ID do Preço (Price ID) configurado no Dashboard do Stripe para o plano PRO.
*   `STRIPE_PLAN_MAX`: ID do Preço (Price ID) configurado no Dashboard do Stripe para o plano ULTIMATE.
*   `NEXT_PUBLIC_APP_URL`: URL base da aplicação (ex: http://localhost:3000) para redirecionamentos.

---

## 2. Modelagem de Dados (MongoDB)

O estado da assinatura é armazenado diretamente no documento do Usuário (`User`).

**Arquivo:** `src/interfaces/IUser.ts` e `src/app/models/User.ts`

A interface `IUser` possui o objeto `subscription`:

```typescript
export interface ISubscription {
    plan: 'FREE' | 'PRO' | 'MAX';        // Nível de acesso atual
    status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIAL'; // Estado no Stripe
    providerId?: string;                 // ID do Cliente no Stripe (cus_...)
    subscriptionId?: string;             // ID da Assinatura (sub_...)
    expiresAt?: Date;                    // Data de expiração/renovação
}
```

---

## 3. Lógica Backend

### 3.1. Rota de Checkout
**Caminho:** `src/app/api/stripe/checkout/route.ts`
**Método:** `POST`

Esta rota é responsável por iniciar o processo de pagamento.

**Fluxo:**
1.  Recebe `priceId` ("PRO" ou "MAX") e `userId` do frontend.
2.  Verifica se o usuário existe no banco de dados.
3.  **Resolução de Cliente:** Verifica se o usuário já possui um `providerId` (Stripe Customer ID). Se não, cria um novo Cliente no Stripe e salva o ID no usuário.
4.  **Mapeamento de Planos:** Converte "PRO" ou "MAX" para os IDs de preço reais do Stripe (variáveis de ambiente).
5.  **Criação da Sessão:** Gera uma `stripe.checkout.sessions` com:
    *   `mode`: 'subscription'
    *   `customer`: ID do cliente recuperado.
    *   `line_items`: O preço selecionado.
    *   `success_url`: Redirecionamento após sucesso (`/dashboard?success=true`).
    *   `cancel_url`: Redirecionamento após cancelamento (`/pricing?canceled=true`).
    *   `metadata`: Inclui o `userId` para identificação posterior no webhook.
6.  Retorna a URL da sessão (`url`) para o frontend realizar o redirecionamento.

### 3.2. Webhooks e Sincronização
**Caminho:** `src/app/api/stripe/webhook/route.ts`
**Método:** `POST`

Esta rota recebe eventos enviados pelo Stripe para manter o banco de dados sincronizado.

**Segurança:**
*   Valida a assinatura do request (`Stripe-Signature`) utilizando o `STRIPE_WEBHOOK_SECRET` e o método `stripe.webhooks.constructEvent`.

**Eventos Tratados:**

*   **`checkout.session.completed`**:
    *   Ocorre quando o pagamento inicial é confirmado.
    *   Extrai o `userId` dos metadados da sessão.
    *   Recupera os detalhes da assinatura criada para identificar o plano (comparando o Price ID).
    *   Atualiza o Usuário no banco: Define `plan`, `status` como ACTIVE, e salva `subscriptionId` e datas.

*   **`customer.subscription.deleted`**:
    *   Ocorre quando a assinatura é cancelada ou expira.
    *   Busca o usuário pelo `providerId` (Customer ID).
    *   Reverte o plano para `FREE` e define status como `CANCELED`.

*   **`customer.subscription.updated`**:
    *   Ocorre em renovações automáticas, falhas de pagamento ou alterações.
    *   Atualiza o `status` (ex: de active para past_due) e a nova data de expiração (`expiresAt`).

---

## 4. Frontend e Interface do Usuário

### 4.1. Página de Planos (`/pricing`)
**Localização:** `src/app/pricing/page.tsx`

*   Exibe os três níveis de planos (Free, Pro, Ultimate).
*   Ao clicar em assinar, faz uma requisição POST para `/api/stripe/checkout`.
*   Redireciona o navegador para a URL retornada pela API (Página de pagamento do Stripe).
*   Possui tratamento para estados de carregamento e retorno de erro.

### 4.2. Controle de Acesso (`PlanGateContext`)
**Localização:** `src/context/PlanGateContext.tsx`

Um Contexto React que centraliza a lógica de permissões:
*   `checkFeature(feature)`: Retorna verdadeiro/falso se o plano atual suporta a funcionalidade (ex: 'OPEN_FINANCE').
*   `openUpgradeModal()`: Abre um modal incentivando o upgrade quando o usuário tenta acessar um recurso bloqueado.

### 4.3. Componentes de Conversão (Dashboard)

Para induzir o usuário Free a assinar, foram implementados componentes estratégicos na página inicial (`src/app/page.tsx`):

1.  **Banner de Upsell (`UpsellBanner.tsx`)**:
    *   Componente dinâmico posicionado no topo do dashboard.
    *   **Lógica**:
        *   Se usuário **Free**: Mostra banner promovendo IA e WhatsApp (Plano Pro).
        *   Se usuário **Pro**: Mostra banner promovendo Open Finance (Plano Ultimate).
        *   Se usuário **Ultimate**: O banner não é renderizado.
    *   Visualmente destacado com gradientes e chamadas para ação (CTA) claras.

2.  **Widget Open Finance**:
    *   Se o usuário não tem acesso, o botão "Conectar Conta" dispara o modal de upgrade via `PlanGateContext` em vez de navegar para a rota de conexão bancária.

---

## 5. Fluxo Completo de Assinatura

1.  **Gatilho**: O usuário clica em "Assinar" na página `/pricing` ou em um banner de upsell no Dashboard.
2.  **API**: O frontend chama `POST /api/stripe/checkout`.
3.  **Redirecionamento**: O usuário é levado ao ambiente seguro do Stripe.
4.  **Pagamento**: O usuário insere os dados do cartão e confirma.
5.  **Processamento**: O Stripe cobra o cartão e dispara um evento `checkout.session.completed` para a rota de Webhook da aplicação.
6.  **Sincronização**: O Webhook recebe o evento, valida e atualiza o campo `subscription.plan` no MongoDB do usuário.
7.  **Retorno**: O usuário é redirecionado de volta para `/dashboard?success=true`.
8.  **Acesso**: Ao carregar o dashboard, o contexto de usuário recarrega os dados, percebe o novo plano e desbloqueia as funcionalidades (ex: remove o banner de upsell, libera Open Finance).
