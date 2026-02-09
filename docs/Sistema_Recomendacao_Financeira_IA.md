# Sistema de Recomendação Financeira Pessoal Inteligente Baseado em Agentes de IA

Esta documentação detalha a arquitetura, modelos e fluxo de funcionamento do **Sistema de Recomendação Financeira Inteligente**, conforme proposto no Trabalho de Conclusão de Curso (TCC). O objetivo do sistema é mitigar gastos desnecessários através de agentes autônomos que analisam padrões de consumo e notificam o usuário de forma proativa.

## 1. Visão Geral da Arquitetura (Agentic AI)

O sistema utiliza uma arquitetura baseada em **Agentes Inteligentes**, onde componentes de software independentes colaboram para gerar insights valiosos. Esta arquitetura é orquestrada pelo `AiService` no backend.

### Diagrama de Agentes

```mermaid
graph TD
    User[Usuário] -->|Transação| SyncService[Sincronização Bancária]
    SyncService -->|Novos Dados| Orchestrator[Orquestrador de IA (AiService)]
    
    subgraph "Enxame de Agentes (Agent Swarm)"
        Orchestrator -->|Acionar| ProfilingAgent[Agente de Perfil]
        Orchestrator -->|Acionar| AuditAgent[Agente de Auditoria]
        
        ProfilingAgent -->|Perfil de Consumo (Médias)| RecommenderAgent[Agente de Recomendação]
        AuditAgent -->|Anomalias Identificadas| RecommenderAgent
        
        RecommenderAgent -->|Insight Gerado| NotificationAgent[Agente de Notificação]
    end
    
    NotificationAgent -->|Push API| ServiceWorker[Service Worker (Mobile)]
    ServiceWorker -->|Popup| UserMobile[Celular do Usuário]
    RecommenderAgent -->|Salvar| MongoDB[(Banco de Dados)]
```

### Definição dos Agentes

1.  **Agente de Perfil (Profiling Agent)**:
    *   **Função**: Analisar o histórico de transações (últimos 90 dias) para entender o comportamento "normal" do usuário.
    *   **Saída**: "O usuário gasta em média R$ 600,00 com Delivery por mês."

2.  **Agente de Auditoria (Audit Agent)**:
    *   **Função**: Monitorar transações recentes em tempo real para detectar desvios.
    *   **Saída**: "Alerta: O gasto com Delivery este mês já atingiu R$ 850,00 (41% acima da média)."

3.  **Agente de Recomendação (Recommender Agent - Gemini)**:
    *   **Função**: Receber o perfil e as anomalias e, usando GenAI, criar uma sugestão acionável.
    *   **Prompt**: "Com base no desvio de 41% em Delivery, sugira uma ação prática para reduzir o gasto na próxima semana."
    *   **Saída**: Card de Recomendação (Título, Mensagem, Ação, Impacto Financeiro).

4.  **Agente de Notificação (Notification Agent)**:
    *   **Função**: Decidir *quando* e *como* enviar a mensagem. Evita spam (ex: máximo 1 alerta por categoria por semana).prioriza notificações Push para alertas críticos.

## 2. Modelos de Dados (MongoDB)

O sistema introduz duas novas coleções no banco de dados para suportar essa funcionalidade.

### 2.1 Coleção `recommendations`
Armazena os insights gerados pelos agentes.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `_id` | ObjectId | Identificador único. |
| `userId` | ObjectId | Referência ao usuário. |
| `type` | String | `SAVING_OPPORTUNITY` (Oportunidade), `SPENDING_ALERT` (Alerta), `GOAL_ACHIEVEMENT` (Meta). |
| `category` | String | Categoria relacionada (ex: "Alimentação"). |
| `title` | String | Título curto (ex: "Gasto Alto em Delivery"). |
| `message` | String | Mensagem explicativa do Agente. |
| `actionableStep` | String | Ação sugerida (ex: "Cozinhar em casa 2x esta semana"). |
| `impactEstimate` | Number | Valor estimado de economia (ex: 150.00). |
| `status` | String | `PENDING` (Pendente), `VIEWED` (Visto), `DISMISSED` (Ignorado), `APPLIED` (Aplicado). |
| `generatedAt` | Date | Data de geração. |
| `pushSent` | Boolean | Se foi enviado notificação Push. |

### 2.2 Coleção `push_subscriptions`
Armazena as permissões de notificação dos navegadores (Mobile/Desktop) para envio de Push.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `userId` | ObjectId | Referência ao usuário. |
| `endpoint` | String | URL do serviço de Push do navegador (FCM, Apple, Mozilla). |
| `keys` | Object | Chaves de criptografia (`p256dh`, `auth`) para assinatura VAPID. |
| `device` | String | User-Agent simplificado (ex: "Chrome on Android"). |

## 3. Casos de Uso (Fluxo do Usuário)

### Caso de Uso 1: Recebendo um Alerta Inteligente (Mobile)
**Cenário**: O usuário realizou uma compra de R$ 100,00 no iFood, excedendo sua média mensal.
1.  **Gatilho**: O `SyncService` detecta a nova transação e aciona o Pipeline de Agentes.
2.  **Processamento**:
    *   Agente de Perfil confirma que a média é R$ 400.
    *   Agente de Auditoria nota que o gasto atual é R$ 700.
    *   Agente de Recomendação gera: "Reduza pedidos de fim de semana para economizar R$ 150".
3.  **Notificação**: O Agente de Notificação envia um **Push Notification** para o celular do usuário.
4.  **Interação**:
    *   O celular vibra/toca com a mensagem: "⚠️ Alerta de Gasto: iFood acima da média."
    *   O usuário clica na notificação (sem precisar abrir o app antes).
    *   O app (PWA) abre direto na tela de **Insights**.

### Caso de Uso 2: Visualizando e Aplicando a Recomendação
**Cenário**: O usuário abriu o app após o alerta.
1.  **Visualização**: Na tela "Insights", o usuário vê um Card: "Gasto Alto em Alimentação".
2.  **Detalhes ("Entenda Por Quê")**:
    *   O usuário clica em "Ver Detalhes".
    *   O sistema exibe o racional do Agente: "Você gastou R$ 300 reais a mais que sua média histórica de 3 meses. A maior parte foi em finais de semana."
3.  **Ação**:
    *   O usuário clica em "Vou seguir essa dica".
    *   O sistema marca a recomendação como `APPLIED` e parabeniza o usuário.

### Caso de Uso 3: Configurando Notificações (Opt-in)
**Cenário**: Primeiro acesso ao recurso.
1.  O sistema exibe um botão: "Deseja receber dicas financeiras em tempo real?".
2.  O usuário clica em "Ativar".
3.  O navegador solicita permissão nativa.
4.  O backend salva a `push_subscription`.

## 4. Fluxo Técnico de Implementação

### Passo 1: Configuração VAPID
Geração de chaves pública/privada para assinar as notificações Push de forma segura, garantindo que apenas o nosso servidor possa enviar mensagens para o usuário.

### Passo 2: Service Worker (sw.ts)
O Service Worker é o script que roda em segundo plano no navegador/celular. Ele será configurado para:
*   Ficar "escutando" eventos `push` vindos do servidor.
*   Exibir a notificação visual (`self.registration.showNotification`) mesmo com a aba fechada.
*   Tratar o clique na notificação (`notificationclick`) para abrir a URL correta `/insights`.

### Passo 3: Orquestração no Backend
No `AiService`, implementar a função `orchestrateAgents(userId)` que encapsula a lógica dos 4 agentes, chamando a API do Gemini com o contexto preparado (histórico vs atual) e processando a resposta JSON estruturada.

## 5. Cronograma de Implementação Detalhado

A implementação foi dividida em 5 etapas para garantir folga para testes, validação e alinhamento com a escrita do TCC.

### Etapa 1: Fundação do Sistema (Banco de Dados & API Base)
**Estimativa de Tempo**: 2 dias
**Foco**: Estrutura de dados e operações básicas (CRUD).
*   **O que será feito**:
    *   Criação das Models `Recommendation` e `PushSubscription` no MongoDB.
    *   Serviço `RecommendationService` para salvar e buscar recomendações.
    *   API Routes para o frontend consumir os dados.
*   **Integração TCC**: Momento de validar se os campos do banco atendem às necessidades teóricas (ex: campo "impacto estimado").

### Etapa 2: Inteligência Artificial (O "Cérebro")
**Estimativa de Tempo**: 3 dias
**Foco**: Implementação dos 4 Agentes.
*   **O que será feito**:
    *   **Agente de Perfil**: Algoritmo para calcular médias históricas.
    *   **Agente de Auditoria**: Lógica para comparar "Gasto Atual vs Histórico".
    *   **Agente de Recomendação**: Integração com Gemini para gerar o texto da dica.
    *   **Agente de Notificação**: Lógica de "Throttle" (não mandar spam).
*   **Validação**: Testar se a IA gera dicas sensatas com dados de teste.

### Etapa 3: Engajamento Mobile (PWA & Push)
**Estimativa de Tempo**: 3 dias
**Foco**: Notificações que funcionam com o app fechado ("Popups").
*   **O que será feito**:
    *   Geração de chaves VAPID.
    *   Configuração do Service Worker (`sw.ts`) para receber eventos Push.
    *   Criação do fluxo de "Pedir Permissão" no navegador.
*   **Destaque TCC**: Diferencial tecnológico importante (PWA).

### Etapa 4: Experiência do Usuário (Frontend)
**Estimativa de Tempo**: 3 dias
**Foco**: Telas e Componentes visuais.
*   **O que será feito**:
    *   Criação da página "Insights" (/insights).
    *   Componente visual do Card de Recomendação.
    *   Modal "Entenda o Porquê" (Explicabilidade da IA).
*   **Validação**: Teste de usabilidade (UI/UX).

### Etapa 5: Validação Final & Alinhamento TCC
**Estimativa de Tempo**: 3 dias
**Foco**: Garantia de Qualidade e Escrita.
*   **O que será feito**:
    *   Testes ponta a ponta (Simular uma transação -> Verificar se chega o Push).
    *   Refinamento dos textos da IA (Prompt Engineering).
    *   Captura de telas e métricas para o texto final do TCC.
*   **Folga**: Tempo reservado para corrigir bugs e ajustar a teoria.
