# Documentacao Tecnica: Integracao Open Finance (Pluggy)

Este documento descreve a arquitetura, fluxos de dados e decisos de implementacao da funcionalidade de Open Finance utilizando o provedor Pluggy.

## Visao Geral

O sistema permite que usuarios conectem suas contas bancarias para sincronizacao automatica de saldos e transacoes. A integracao utiliza a Pluggy como agregador de dados bancarios, comunicando-se via API REST e Webhooks para manter os dados atualizados.

## Arquitetura e Componentes

A solucao e dividida em camadas para separar a logica de interface, controle de API e regras de negocio.

### 1. Frontend (Interface do Usuario)
**Arquivo:** `src/app/bank/page.tsx`

Responsavel por apresentar as conexoes bancarias e gerenciar o fluxo do Widget da Pluggy.

*   **Widget Pluggy (`react-pluggy-connect`)**: Componente que renderiza o fluxo seguro de login bancario. E utilizado em dois modos:
    *   **Criacao**: Para adicionar uma nova conta.
    *   **Atualizacao**: Para reparar uma conexao existente (ex: atualizar senha, resolver MFA).
*   **Gerenciamento de Estados**:
    *   Exibe cards com status da conexao (`UPDATED`, `LOGIN_REQUIRED`, etc.).
    *   Trata o erro `428 Precondition Required` para acionar fluxos de reparo.

### 2. API Routes (Backend Next.js)

Endpoints que interagem com o frontend e com a Pluggy.

*   **`POST /api/pluggy/create-token`**:
    *   Gera o `accessToken` para inicializar o Widget.
    *   **Importante**: Aceita um parametro opcional `updateItemItemId`. Quando fornecido, o token gerado abre o Widget em "Modo de Atualizacao" para aquele item especifico, essencial para o fluxo de reparo.
*   **`POST /api/bank-connections/sync`**:
    *   Aciona a sincronizacao manual de um item.
    *   Implementa um **Polling** de curta duracao (4 segundos) apos solicitar a atualizacao a Pluggy, para tentar retornar o status `UPDATED` imediatamente ao usuario.
    *   Retorna status HTTP `428` se a Pluggy responder com `LOGIN_REQUIRED`, `WAITING_USER_INPUT` ou erro de cota de Sandbox, instruindo o frontend a pedir acao do usuario.
*   **`POST /api/webhooks/pluggy`**:
    *   Recebe notificacoes assincronas da Pluggy (`TRANSACTIONS_NEW`, `ITEM_UPDATED`).
    *   Aciona o `TransactionSyncService` para persistir os dados em background.

### 3. Service Layer (Regras de Negocio)
**Arquivo:** `src/services/TransactionSyncService.ts`

Centraliza a logica de sincronizacao de dados.

*   **`syncAccountBalances(userId, itemId)`**:
    *   Busca o status atual do Item (`item.status`).
    *   Atualiza saldos das contas.
    *   Verifica status criticos (`LOGIN_ERROR`, `WAITING_USER_INPUT`) retornando-os para tratamento superior.
*   **`syncTransactions(userId, itemId)`**:
    *   Realiza a busca de transacoes com **Paginacao Automatica**.
    *   Itera sobre as paginas da API da Pluggy ate que nao haja mais resultados (`totalPages`).
    *   Filtra transacoes ja existentes no banco de dados para evitar duplicidade.
    *   Calcula estatisticas de `new` (novas) e `updated` (atualizadas).

### 4. Modelos de Dados e Tipagem
**Arquivos:** `src/interfaces/IBankConnection.ts`, `src/app/models/BankConnection.ts`

*   **Enum `PluggyItemStatus`**: Define os estados possiveis de uma conexao para garantir consistencia ("Clean Code").
    *   Valores: `UPDATED`, `UPDATING`, `WAITING_USER_INPUT`, `LOGIN_ERROR`, `LOGIN_REQUIRED`, `OUTDATED`.
*   **Schema Mongoose**: O campo `status` e validado contra este Enum.

## Fluxos Principais

### Fluxo de Reparacao de Conexao (Error Handling)

Um dos pontos criticos de Open Finance e a perda de conexao (mudanca de senha, MFA expirado). O sistema trata isso da seguinte forma:

1.  O usuario tenta sincronizar manualmente (`/sync`).
2.  O backend detecta que o status do item na Pluggy e `WAITING_USER_INPUT` ou `LOGIN_REQUIRED`.
3.  O backend retorna erro **428**.
4.  O frontend intercepta o 428, exibe modal "Acao Necessaria".
5.  Usuario clica em "Atualizar".
6.  Frontend solicita novo token via `/create-token` passando o `itemId`.
7.  Widget abre ja na tela de credenciais do banco especifico.

### Tratamento de Limitacao Sandbox

No ambiente de Sandbox (Plano Gratuito), a Pluggy bloqueia atualizacoes via API para contas reais, retornando erro `400`.

1.  Backend captura erro `400` com mensagem `SANDBOX_CLIENT_ITEM_UPDATE_NOT_ALLOWED`.
2.  Backend converte este erro para uma resposta **428** com mensagem amigavel ("Limite do plano Sandbox. Atualize pelo Widget").
3.  O fluxo segue o mesmo caminho de reparacao acima, forçando a atualizacao via Widget, que e permitida.

## Detalhes Tecnicos Importantes

*   **Paginacao**: A API de transacoes da Pluggy e paginada. O `TransactionSyncService` implementa um loop `do...while` respeitando as propriedades `page` e `totalPages` da resposta para garantir ingestao completa do historico.
*   **Polling de Status**: Ao forcar uma atualizacao, o status nao muda instantaneamente para `UPDATED`. O sistema aguarda alguns segundos checando o status repetidamente para melhorar a experiencia do usuario (UX), evitando que ele veja "Atualizando..." se o processo for rapido.
*   **Seguranca**: Nenhum dado de credencial bancaria passa pelos servidores da aplicacao. Tudo e processado diretamente pelo componente `react-pluggy-connect` e pelos servidores da Pluggy.
