# Metodologia de Geração de Insights Financeiros e Inteligência Artificial (V2)

Este documento detalha a fundamentação técnica e a arquitetura de dados atualizada para a geração de insights inteligentes em produção dentro do ecossistema do **Finance App** (BillLens), utilizando a arquitetura de Agentes Inteligentes Preditivos.

---

## 1. A Camada de Dados e Infraestrutura Nativa

A base de qualquer recomendação de IA confiável reside na eficiência da ingestão e qualidade dos dados.

### A. Conexão Serverless-Ready
Anteriormente, o sistema sofria conflitos de compilação no Webpack (Next.js) devido à herança de bibliotecas do NestJS (`replica-failover-mongodb-ts`). O projeto foi refatorado para utilizar puramente o driver nativo `mongodb` (`MongoClient`).
```typescript
// src/db/connectionDb.ts
import { MongoClient, ServerApiVersion } from 'mongodb';
// Singleton pattern para evitar esgotamento de conexões na Vercel
let clientInfo = global._mongoClientInfo;
if (!clientInfo) {
    clientInfo = {
        client: new MongoClient(uri, { serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true } }),
        promise: null
    };
    global._mongoClientInfo = clientInfo;
}
```

### B. Mineração e Agrupamento (Distância de Levenshtein)
Transações bancárias cruas ("Uber Eats", "UBEREATS*SP") são agrupadas dinamicamente usando a métrica de edição de Levenshtein. Isso alimenta a detecção de *Custos Fixos* invisíveis.
```typescript
// src/utils/stringUtils.ts
export function areStringsSimilar(str1: string, str2: string, threshold = 3): boolean {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    return levenshtein(s1, s2) <= threshold; // Matriz de inserção/deleção/substituição
}
```

---

## 2. Processamento Analítico (MongoDB Aggregation Pipelines)

Para evitar *Memory Leaks* no Node.js (Vercel) causados pelo carregamento massivo de transações via `.toArray().forEach()`, o cálculo analítico pesado foi deslocado para o motor nativo do banco de dados BSON.

```typescript
// src/services/InsightService.ts
const pipeline = [
    { $match: { userId: userId, type: 'expense' } },
    {
        $facet: { // Processamento paralelo dentro do DB
            "hoje": [
                { $match: { date: { $gte: startOfToday } } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ],
            "mesAtual": [
                { $match: { date: { $gte: startOfMonth } } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ],
            "historicoAnterior": [ // Busca os últimos 90 dias
                { $match: { date: { $lt: startOfMonth, $gte: prev90Days } } },
                { $group: { _id: { tag: "$tag", month: { $month: "$date" } }, total: { $sum: "$amount" } } }
            ]
        }
    }
];
const [results] = await collection.aggregate(pipeline).toArray();
```
*Ganhos:* O backend carrega apenas **1KB** de totais agregados ao invés de Mb de matrizes redundantes.

---

## 3. Inteligência Artificial Preditiva (Nudge Engine V2)

A orquestração do LLM (Gemini 1.5) no `FinanceAgentService.ts` opera não como um relator de despesas, mas como um **Conselheiro Comportamental Empático**.

### Estratégia de Injeção e Schema:
1. **Contexto Matemático Agregado:** Passamos o payload de `$facet` filtrado para o Agente.
2. **Diretriz de Micro-hábitos:** O LLM é instruído a gerar apenas **1 recomendação cirúrgica** baseada em pequenas adoções na rotina (ex: *Corte um delivery* ao invés de *Transfira todo o saldo*).
3. **Formatador JSON e Explicabilidade:**
    O Schema do Gemini obriga o preenchimento da `explicacaoMatematica`, blindando o sistema contra alucinações.
    ```json
    {
      "resumoDiagnostico": "Resumo empático do status.",
      "nudges": [{
          "foco": "Categoria do problema",
          "impacto": "Alto | Medio",
          "acaoPratica": "Instrução clara para economizar.",
          "explicacaoMatematica": "Sua média era X, você gastou Y. O corte em Z preserva 10% da sua meta."
      }]
    }
    ```

---

## 4. Orquestração e Caching Dinâmico Sensível a Schema (`route.ts`)

A chamada ao LLM consome cotas de API e tempo (média ~1.5s a 3s). Para resiliência do sistema, construímos uma coleção MongoDB `ai_insights_cache`.

### A Lógica do Cache Hash:
O Agente gera uma chave determinística cruzando saldos financeiros do dia:
```typescript
const cacheHash = Buffer.from(JSON.stringify({ 
    mes: contextData.summary.currentMonthTotal, 
    hoje: contextData.summary.todayTotal 
})).toString("base64");
const cacheKey = `nudge_${userId.toString()}_${todayStr}_hash_${cacheHash}`;
```
- **Se não houver nova transação no banco:** O Hash bate, ocorre um *Cache Hit* instantâneo.
- **Se o usuário gastar no cartão:** O gatilho Webhook altera o `currentMonthTotal`, mutando o Hash gerando o *Cache Miss*. A IA é invocada e processa esse novo evento.

### Proteção de *Schema Evolution*:
Validamos se o cache existente bate com o contrato atualizado do código.
```typescript
// Se o cache existir MAS não contiver a matemática (versão ultrapassada), força o Cache Miss.
if (cachedNudge && cachedNudge.aiData && cachedNudge.aiData.nudges[0]?.explicacaoMatematica) {
    aiData = cachedNudge.aiData;
} else {
    // LLM Invoked
}
```

---

## 5. Interface UI e Feedback Loop Contínuo (RLHF)

O frontend (`FinancialInsight.tsx`) não é passivo, ele consome o pipeline acima de forma imersiva:
1. **Shimmer Interativo:** Durante o Cache Miss (espera da IA), a UI exibe animações pulsantes com rodapé cíclico (*Cruzando dados com a base matemática...*).
2. **Acordeão de Transparência:** Renderiza o nó `mathBasis` gerado pelo Nudge Engine em uma sanfona `<details>` amigável para aumentar a confiança humana no cálculo do robô.
3. **Reforço de Aprendizado (RLHF):** Os botões "Útil" e "Não Útil" enviam o feedback na rota REST, gravando na coleção `ai_feedback` contendo o ID do JSON gerado, possibilitando que no semestre seguinte seja feito um ciclo de **Fine-Tuning** absoluto no Modelo base.
