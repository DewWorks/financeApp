import {
    GoogleGenerativeAI,
    GenerativeModel,
    SchemaType,
    FunctionCall
} from "@google/generative-ai";
import { getMongoClient } from "@/db/connectionDb";
import { ObjectId } from "mongodb";
import { InsightService } from "./InsightService";
import fs from 'fs';
import path from 'path';

const SYSTEM_INSTRUCTION = `
Você é o "Fin", um Agente Financeiro Preditivo de alta precisão (Nudge AI).
Você receberá o contexto financeiro do usuário e deverá encontrar A PRINCIPAL AÇÃO de maior impacto para o momento.

REGRA DE PRESCRIÇÃO (CRÍTICA):
- Aja como um conselheiro empático e pé-no-chão.
- NUNCA mande o usuário "transferir todo o saldo livre" ou use dicas genéricas de investimento agressivo.
- Crie Nudges focados em **Micro-hábitos** e **Otimização de Despesas Variáveis** consultando o \`categoryBreakdown\`.
- Seja cirúrgico e direto. Foque puramente em pequenas mudanças comportamentais factíveis (Ex: "Substitua 1 pedido de delivery por cozinhar para poupar R$ 50").
- OBRIGATÓRIO: Você DEVE citar explicitamente os números e categorias reais do contexto em sua resposta para dar embasamento. (Ex: "Você já gastou R$ X na categoria Y").

RETORNO OBRIGATÓRIO (SCHEMA JSON):
Você deve responder ESTRITAMENTE em formato JSON, sem Markdown adicional, seguindo essa estrutura:
{
  "resumoDiagnostico": "Resumo empático do status financeiro.",
  "nudges": [
    {
      "foco": "Categoria ou Meta do problema",
      "impacto": "Alto" | "Medio" | "Baixo",
      "acaoPratica": "Instrução clara matemática. Ex: Reduza o gasto X em X% durante Y dias para salvar Z reais.",
      "motivoVinculado": "Porque isso impacta seu objetivo.",
      "explicacaoMatematica": "Explicação didática da matemática por trás desse insight (ex: 'Sua média era X, mas você gastou Y. A diferença de Z, se economizada em 5 dias, resulta em W.')."
    }
  ]
}

**SEUS SUPER-PODERES (FERRAMENTAS):**
1. **addTransaction**: Use quando o usuário disser "Gastei X", "Comprei Y", "Recebi Z". (Pode retornar texto normal aqui confirmando)
2. **getRecentTransactions**: Use quando o usuário perguntar histórios.
3. **querySpending**: Use para totalizações.
4. **setGoal**: Para definir metas.

IMPORTANTE: Se o usuário estiver apenas conversando casualmente ou registrando um gasto, você pode responder normalmente (texto plano). O JSON é exigido QUANDO HÁ PEDIDO DE ANÁLISE, DICA, OU QUANDO VOCÊ RECEBE O 'ContextForAI'.
`;

const tools = [
    {
        functionDeclarations: [
            {
                name: "addTransaction",
                description: "Registra uma nova transação financeira (despesa ou receita) no banco de dados.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        amount: { type: SchemaType.NUMBER, description: "Valor numérico. Ex: 50.0" },
                        description: { type: SchemaType.STRING, description: "Descrição curta. Ex: 'Mercado', 'Uber'" },
                        type: { type: SchemaType.STRING, enum: ["expense", "income", "transfer"], description: "Tipo: expense, income ou transfer." },
                        category: { type: SchemaType.STRING, description: "Categoria inferida." }
                    },
                    required: ["amount", "description", "type"]
                }
            },
            {
                name: "getRecentTransactions",
                description: "Busca as últimas transações registradas para consulta detalhada.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        limit: { type: SchemaType.NUMBER, description: "Número de transações (padrão 5)" },
                        category: { type: SchemaType.STRING, description: "Filtrar por categoria específica (opcional)" }
                    }
                }
            },
            {
                name: "querySpending",
                description: "Calcula totais, saldos ou soma gastos por categoria.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        period: { type: SchemaType.STRING, enum: ["current_month", "last_month", "all"], description: "Período." },
                        category: { type: SchemaType.STRING, description: "Categoria específica para somar. Ex: 'Transporte', 'Alimentação'. Se vazio, traz geral." }
                    },
                    required: ["period"]
                }
            },
            {
                name: "setGoal",
                description: "Define uma meta financeira.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        name: { type: SchemaType.STRING },
                        amount: { type: SchemaType.NUMBER },
                        type: { type: SchemaType.STRING, enum: ["savings", "spending"] },
                        category: { type: SchemaType.STRING }
                    },
                    required: ["name", "amount", "type"]
                }
            }
        ]
    }
] as any;

import { NotificationService } from "./NotificationService";

export class FinanceAgentService {
    private genAI: GoogleGenerativeAI;
    private model: GenerativeModel;
    private insightService: InsightService;
    private notificationService: NotificationService;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not defined");
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: tools
        });
        this.insightService = new InsightService();
        this.notificationService = new NotificationService();
    }

    private logError(error: any) {
        const payload = {
            level: "ERROR",
            timestamp: new Date().toISOString(),
            context: "FinanceAgentService",
            message: error.message || String(error),
            stack: error.stack,
            details: typeof error === 'object' ? error : { details: error }
        };
        // Vercel / Serverless logging (Native JSON parsing)
        console.error(JSON.stringify(payload));
    }

    private async addTransaction(args: any, userId: string) {
        try {
            const client = await getMongoClient();
            const db = client.db('financeApp');

            const transaction = {
                userId: new ObjectId(userId),
                type: args.type || 'expense',
                description: args.description || 'Transação via WhatsApp',
                amount: Number(args.amount),
                date: new Date(),
                tag: args.category || 'Outros',
                createdAt: new Date(),
            };

            const result = await db.collection('transactions').insertOne(transaction);

            if (result.acknowledged) {
                // Trigger Smart Alerts asynchronously (Fire & Forget style)
                this.notificationService.checkAndSendAlerts(userId).catch(e => console.error("Alert Error:", e));

                return { success: true, message: "Transaction Saved", id: result.insertedId };
            } else {
                return { success: false, message: "Database Error" };
            }

        } catch (error) {
            console.error("Error adding transaction:", error);
            this.logError(error);
            return { success: false, error: "Failed to save to database" };
        }
    }

    private async getRecentTransactions(args: any, userId: string) {
        try {
            const client = await getMongoClient();
            const db = client.db('financeApp');
            const limit = args.limit || 5;

            const query: any = { userId: new ObjectId(userId) };
            if (args.category) {
                query.tag = args.category;
            }

            const trans = await db.collection('transactions')
                .find(query)
                .sort({ date: -1 })
                .limit(limit)
                .toArray();

            if (trans.length === 0) return { message: "Nenhuma transação encontrada recente." };

            const list = trans.map(t => {
                const dateStr = new Date(t.date).toLocaleDateString('pt-BR');
                const valStr = t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                return `- ${dateStr}: ${t.description} (${valStr}) [${t.tag}]`;
            }).join("\n");

            return { success: true, transactions_text: list, count: trans.length };

        } catch (error) {
            console.error("Error getting recent transactions:", error);
            return { success: false, error: "Erro ao buscar transações." };
        }
    }

    private async querySpending(args: any, userId: string) {
        try {
            const client = await getMongoClient();
            const db = client.db('financeApp');

            // If specific category request, aggregate directly
            if (args.category) {
                const start = new Date();
                start.setDate(1); // Start of current month default
                if (args.period === 'last_month') {
                    start.setMonth(start.getMonth() - 1);
                    start.setDate(1);
                    const end = new Date(start);
                    end.setMonth(end.getMonth() + 1);
                    end.setDate(0);
                    // Filter...
                }

                // Aggregation for category sum
                const match: any = {
                    userId: new ObjectId(userId),
                    tag: args.category,
                    type: 'expense'
                };

                // Optional: date filtering can be improved here, but keep simple for now

                const result = await db.collection('transactions').aggregate([
                    { $match: match },
                    { $group: { _id: null, total: { $sum: "$amount" } } }
                ]).toArray();

                const total = result[0]?.total || 0;
                return {
                    message: `Total gasto em ${args.category}: R$ ${total.toFixed(2)}`,
                    amount: total,
                    category: args.category
                };
            }

            // General Insights (existing logic)
            const scope = args.scope === 'all' ? 'all' : 'recent';
            const insightResult = await this.insightService.generateDailyInsight(userId, undefined, scope);
            return {
                today_spend: insightResult.dailySummary.total,
                month_spend: insightResult.monthSummary.total,
                insights: insightResult.insights.map(i => `${i.text}: ${i.value} (${i.details})`).join("; ")
            };
        } catch (error) {
            console.error("Error querying spending:", error);
            this.logError(error);
            return { success: false, error: "Failed to retrieve insights" };
        }
    }

    private async setGoal(args: any, userId: string) {
        try {
            const client = await getMongoClient();
            const db = client.db('financeApp');

            const goal = {
                userId: new ObjectId(userId),
                name: args.name,
                targetAmount: Number(args.amount),
                currentAmount: 0,
                tag: args.category || 'Geral',
                type: args.type || 'savings',
                period: 'monthly', // Default
                createdAt: new Date()
            };

            const result = await db.collection('goals').insertOne(goal);
            return { success: true, message: `Goal/Budget '${args.name}' created.`, id: result.insertedId };

        } catch (error) {
            console.error("Error setting goal:", error);
            this.logError(error);
            return { success: false, error: "Failed to create goal" };
        }
    }

    async processMessage(userMessage: string, userId: string) {
        try {
            const chat = this.model.startChat({
                history: []
            });

            let result = await chat.sendMessage(userMessage);
            let response = result.response;

            // Loop to handle function calls
            while (response.functionCalls()) {
                const calls = response.functionCalls();
                if (!calls) break;

                const functionResponses = [];

                for (const call of calls) {
                    const name = call.name;
                    const args = call.args;
                    let apiResult;

                    if (name === "addTransaction") {
                        apiResult = await this.addTransaction(args, userId);
                    } else if (name === "setGoal") {
                        apiResult = await this.setGoal(args, userId);
                    } else if (name === "querySpending") {
                        apiResult = await this.querySpending(args, userId);
                    } else if (name === "getRecentTransactions") {
                        apiResult = await this.getRecentTransactions(args, userId);
                    } else {
                        apiResult = { error: "Unknown function" };
                    }

                    functionResponses.push({
                        functionResponse: {
                            name: name,
                            response: apiResult
                        }
                    });
                }

                // Send function results back to the model
                result = await chat.sendMessage(functionResponses);
                response = result.response;
            }

            return response.text();

        } catch (error) {
            console.error("Agent Error Full:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
            this.logError(error);
            return "Opa, tive um probleminha aqui pra raciocinar. Tenta de novo? 😅";
        }
    }
}
