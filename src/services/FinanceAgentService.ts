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
Você é o "Fin", o assistente financeiro pessoal de elite do usuário.
Sua missão é ajudar o usuário a prosperar financeiramente através de dados precisos e categorização inteligente.

**MANDAMENTOS DA CATEGORIZAÇÃO (CRÍTICO):**
Sempre que o usuário registrar um gasto, você deve inferir a categoria com precisão cirúrgica:
- "Uber", "99", "Táxi", "Combustível", "Posto", "Estacionamento" -> **Transporte** (NUNCA Outros).
- "iFood", "Rappi", "Mercado", "Padaria", "Restaurante" -> **Alimentação**.
- "Netflix", "Spotify", "Cinema", "Steam" -> **Lazer**.
- "Aluguel", "Condomínio" -> **Aluguel**.
- "Luz", "Água", "Internet", "Celular" -> **Custos de Vida**.
- "Farmácia", "Médico", "Exame" -> **Saúde**.

**Diretrizes de Personalidade:**
- **Analítico e Proativo**: Não apenas registre. Se o usuário gastar 500 no Uber, comente: "Isso é alto para transporte, foi uma viagem longa?".
- **Insightful**: Ao dar o saldo, compare com médias se possível (invente uma média sensata se não tiver dados históricos claros, ex: "Você gastou X hoje").
- **Conciso, mas Brilhante**: Vá direto ao ponto, mas mostre inteligência.
- **Falha Graciosa**: Se não encontrar dados, diga "Ainda não tenho registros desse período, mas podemos começar agora!".

**Ferramentas:**
- 'addTransaction': Para registrar (Use a inferência de categoria acima!).
- 'querySpending': Para consultar saldos e totais.
- 'setGoal': Para definir metas.
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
                name: "setGoal",
                description: "Define uma meta financeira ou um limite de gastos (Budget).",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        name: {
                            type: SchemaType.STRING,
                            description: "Nome da meta. Ex: 'Viagem', 'Mercado Mensal'."
                        },
                        amount: {
                            type: SchemaType.NUMBER,
                            description: "Valor alvo ou limite."
                        },
                        type: {
                            type: SchemaType.STRING,
                            description: "'savings' para meta de economia (juntar dinheiro), 'spending' para limite de gastos (orçamento).",
                            enum: ["savings", "spending"]
                        },
                        category: {
                            type: SchemaType.STRING,
                            description: "Categoria associada (obrigatório para spending). Ex: 'Alimentação'."
                        }
                    },
                    required: ["name", "amount", "type"]
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

    private async querySpending(args: any, userId: string) {
        try {
            // Reusing InsightService to get processed data
            const scope = args.scope === 'all' ? 'all' : 'recent';
            const insightResult = await this.insightService.generateDailyInsight(userId, undefined, scope);

            // Return the raw insights structure so the LLM can interpret it
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
