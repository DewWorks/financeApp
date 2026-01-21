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
Você é um assistente financeiro pessoal, amigável e proativo, chamado "Fin".
Seu objetivo é ajudar o usuário a gerenciar suas finanças de forma leve.

**Personalidade:**
- Fale português do Brasil natural.
- Seja empático.
- Use emojis moderadamente.

**Ferramentas:**
- Use 'addTransaction' quando o usuário relatar um gasto ou ganho.
- Use 'querySpending' quando o usuário perguntar sobre gastos passados, status financeiro, ou pedir insights.
- Se a pergunta for genérica, responda com seu conhecimento.
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
                        amount: {
                            type: SchemaType.NUMBER,
                            description: "O valor numérico da transação. Ex: 50.0"
                        },
                        description: {
                            type: SchemaType.STRING,
                            description: "Descrição curta da transação. Ex: 'Mercado', 'Uber', 'Salário'"
                        },
                        type: {
                            type: SchemaType.STRING,
                            description: "Tipo da transação: 'expense' para gastos, 'income' para ganhos.",
                            enum: ["expense", "income"]
                        },
                        category: {
                            type: SchemaType.STRING,
                            description: "Categoria inferida da transação. Ex: 'Alimentação', 'Transporte', 'Lazer'.",
                        }
                    },
                    required: ["amount", "description", "type"]
                }
            },
            {
                name: "querySpending",
                description: "Busca o status financeiro, total gasto ou insights do usuário.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        period: {
                            type: SchemaType.STRING,
                            description: "O período de análise. Use 'current_month' para visão geral do mês.",
                            enum: ["current_month", "last_month", "all"]
                        },
                        scope: {
                            type: SchemaType.STRING,
                            description: "Escopo da análise. 'recent' para últimos 60 dias, 'all' para 12 meses.",
                            enum: ["recent", "all"]
                        }
                    },
                    required: ["period"]
                }
            }
        ]
    }
] as any;

export class FinanceAgentService {
    private genAI: GoogleGenerativeAI;
    private model: GenerativeModel;
    private insightService: InsightService;

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
    }

    private logError(error: any) {
        try {
            const logPath = path.join(process.cwd(), 'agent-error.log');
            const msg = `[${new Date().toISOString()}] ERROR: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}\n`;
            fs.appendFileSync(logPath, msg);
        } catch (e) {
            console.error("Failed to write to log file", e);
        }
    }

    private async addTransaction(args: any, userId: string) {
        try {
            const client = await getMongoClient();
            const db = client.db('financeApp');

            const transaction = {
                userId: new ObjectId(userId),
                // profileId: new ObjectId(userId), // REMOVED: InsightService expects no profileId for personal view
                type: args.type || 'expense',
                description: args.description || 'Transação via WhatsApp',
                amount: Number(args.amount),
                date: new Date(),
                tag: args.category || 'Outros',
                createdAt: new Date(),
            };

            const result = await db.collection('transactions').insertOne(transaction);

            if (result.acknowledged) {
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

    private async querySpending(args: any, userId: string) {
        try {
            // Reusing InsightService to get processed data
            const scope = args.scope === 'all' ? 'all' : 'recent';
            const insightResult = await this.insightService.generateDailyInsight(userId, undefined, scope);

            // Return the raw insights structure so the LLM can interpret it
            return {
                summary_today: insightResult.dailySummary.total,
                insights: insightResult.insights.map(i => `${i.text}: ${i.value} (${i.details})`).join("; ")
            };
        } catch (error) {
            console.error("Error querying spending:", error);
            this.logError(error);
            return { success: false, error: "Failed to retrieve insights" };
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
                        // Pass userId context
                        apiResult = await this.addTransaction(args, userId);
                    } else if (name === "querySpending") {
                        // Pass userId context
                        apiResult = await this.querySpending(args, userId);
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
