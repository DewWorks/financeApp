import { getMongoClient } from "@/db/connectionDb";
import { ObjectId } from "mongodb";
import { areStringsSimilar } from "@/utils/stringUtils";

export interface InsightItem {
    id: string;
    type: "weekly" | "monthly" | "category" | "zero_spend" | "tip" | "general" | "deep_metric" | "savings" | "trend" | "goal" | "locked";
    text: string;
    value: string;
    trend: "positive" | "negative" | "neutral";
    details?: string;
    recommendation?: string;
    mathBasis?: string;
    richData?: {
        projection?: {
            current: number;
            projected: number;
            dailyAvg: number;
            daysRemaining: number;
            breakdown?: {
                fixed: number;
                variable: number;
                fixedItems: string[];
                variableItems: string[];
            }
        };
        comparison?: {
            expense: number;
            income: number;
            ratio: number;
        };
        status?: "good" | "warning" | "critical" | "excellent";
    };
    feedback?: 'up' | 'down'; // Pillar 5: RLHF Indicator
}

export interface InsightResult {
    greeting: string;
    insights: InsightItem[];
    dailySummary: {
        total: number;
    };
    weeklySummary: {
        total: number;
    };
    monthSummary: {
        total: number;
    };
    contextForAI?: any; // To pass raw grouped data to the Agent
}

export class InsightService {
    async generateDailyInsight(userId: string, profileId?: string, scope: 'recent' | 'all' = 'recent'): Promise<InsightResult> {
        const client = await getMongoClient();
        const db = client.db("financeApp");
        const collection = db.collection("transactions");

        // 1. Saudação + Timezone Seguro (Pillar 6)
        // Obter início do dia e do mês em UTC coerente
        const now = new Date();
        const clientOffsetHours = -3; // Assumption if client timezone not sent, default to BRT
        // For accurate daily ranges, we should adjust the UTC bounds:
        // Ex: Start of Today in BRT is 03:00 UTC.
        
        let greeting = "Olá";
        const hoursBRT = (now.getUTCHours() + clientOffsetHours + 24) % 24;
        if (hoursBRT >= 5 && hoursBRT < 12) greeting = "Bom dia";
        else if (hoursBRT >= 12 && hoursBRT < 18) greeting = "Boa tarde";
        else greeting = "Boa noite";

        // Query Base
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const matchBase: any = {}; 
        if (profileId) {
            matchBase.profileId = new ObjectId(profileId);
        } else {
            matchBase.userId = new ObjectId(userId);
        }

        // Time limits (Pillar 6)
        // Creating properly shifted boundaries
        const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
        startOfToday.setUTCHours(startOfToday.getUTCHours() - clientOffsetHours); // Shift 3 hours forward to catch BRT midnight
        
        const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
        startOfMonth.setUTCHours(startOfMonth.getUTCHours() - clientOffsetHours);

        const startOfLastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0));
        startOfLastMonth.setUTCHours(startOfLastMonth.getUTCHours() - clientOffsetHours);

        // Calculate start of week (Sunday)
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setUTCDate(startOfToday.getUTCDate() - startOfToday.getUTCDay());

        const startOfLastWeek = new Date(startOfWeek);
        startOfLastWeek.setUTCDate(startOfLastWeek.getUTCDate() - 7);

        const historyLimitDate = new Date(startOfMonth);
        historyLimitDate.setUTCMonth(historyLimitDate.getUTCMonth() - 3);

        // 2. Refatoração Crítica: Agregação MongoDB (Pillar 2)
        const pipeline = [
            { $match: matchBase },
            {
                $facet: {
                    // Totais Básicos
                    "todayExpense": [
                        { $match: { type: 'expense', date: { $gte: startOfToday } } },
                        { $group: { _id: null, total: { $sum: "$amount" } } }
                    ],
                    "weekExpense": [
                        { $match: { type: 'expense', date: { $gte: startOfWeek } } },
                        { $group: { _id: null, total: { $sum: "$amount" } } }
                    ],
                    "lastWeekExpense": [
                        { $match: { type: 'expense', date: { $gte: startOfLastWeek, $lt: startOfWeek } } },
                        { $group: { _id: null, total: { $sum: "$amount" } } }
                    ],
                    "monthExpense": [
                        { $match: { type: 'expense', date: { $gte: startOfMonth } } },
                        { $group: { _id: null, total: { $sum: "$amount" } } }
                    ],
                    "monthIncome": [
                        { $match: { type: 'income', date: { $gte: startOfMonth } } },
                        { $group: { _id: null, total: { $sum: "$amount" } } }
                    ],
                    // Deep Metrics & Categorias Correntes
                    "categoryMonthSplit": [
                        { $match: { type: 'expense', date: { $gte: startOfMonth } } },
                        { $group: { _id: "$tag", total: { $sum: "$amount" } } }
                    ],
                    // Buscar Transações (apenas descrições) dos ultimos meses para calcular Recorrência (Custo Fixo)
                    "recentTransactionsForInertia": [
                         { $match: { type: 'expense', date: { $gte: historyLimitDate } } },
                         { $project: { _id: 1, description: 1, amount: 1, date: 1, tag: 1 } },
                         { $limit: 1000 } // Safety limit
                    ],
                    // Totalizações Globais (últimos 12m) - Apenas se for scope ALL
                    "globalContext": scope === 'recent' ? [] : [
                        { $match: { type: 'expense', date: { $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) } } },
                        { $group: { _id: { month: { $month: "$date" }, year: { $year: "$date" } }, total: { $sum: "$amount" } } }
                    ]
                }
            }
        ];

        const [results] = await collection.aggregate(pipeline).toArray();

        // Extraindo resumos
        const todayTotal = results.todayExpense[0]?.total || 0;
        const weekTotal = results.weekExpense[0]?.total || 0;
        const lastWeekTotal = results.lastWeekExpense[0]?.total || 0;
        const monthTotal = results.monthExpense[0]?.total || 0;
        const monthIncome = results.monthIncome[0]?.total || 0;

        const categoryMap = results.categoryMonthSplit.reduce((acc: any, curr: any) => {
            const cat = curr._id || "Outros";
            acc[cat] = curr.total;
            return acc;
        }, {} as Record<string, number>);

        // 3. Mineração de Dados: Levenshtein para Inércia (Pillar 3)
        let fixedTotal = 0;
        let variableTotal = 0;
        const fixedItemsSet = new Set<string>();
        const variableItemsSet = new Set<string>();

        const rawTransactions = results.recentTransactionsForInertia || [];
        
        const recurrenceDescMap: { [key: string]: { amounts: number[], count: number } } = {};
        
        rawTransactions.forEach((t: any) => {
            const desc = (t.description || "").toLowerCase().trim();
            if (!desc) return;
            
            // Find similar group using Levenshtein
            let assignedGroup = null;
            for (const existingGroup of Object.keys(recurrenceDescMap)) {
                if (areStringsSimilar(desc, existingGroup, 3)) { // Tolerance of 3 chars
                    assignedGroup = existingGroup;
                    break;
                }
            }

            if (!assignedGroup) {
                assignedGroup = desc;
                recurrenceDescMap[assignedGroup] = { amounts: [], count: 0 };
            }

            recurrenceDescMap[assignedGroup].amounts.push(Number(t.amount));
            recurrenceDescMap[assignedGroup].count += 1;
        });

        // Identificar padrões de custo fixo
        const detectedFixedDescriptions = new Set<string>();
        Object.entries(recurrenceDescMap).forEach(([key, data]) => {
            // Se ocorreu em múltiplos meses (simulado pela contagem > 2) com variância baixa
            if (data.count >= 2) {
                const avg = data.amounts.reduce((a, b) => a + b, 0) / data.amounts.length;
                const variance = data.amounts.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / data.amounts.length;
                const stdDev = Math.sqrt(variance);
                if ((stdDev / avg) < 0.15) { // < 15% variancia = Custo Fixo
                    detectedFixedDescriptions.add(key);
                }
            }
        });

        // Categorizar os gastos do MÊS ATUAL como fixos ou variáveis
        const currentMonthRaw = rawTransactions.filter((t: any) => new Date(t.date) >= startOfMonth);
        
        currentMonthRaw.forEach((t: any) => {
            const amount = Number(t.amount);
            const cat = (t.tag || "Outros").toLowerCase();
            const desc = (t.description || "").toLowerCase().trim();
            
            const fixedKeywords = ["aluguel", "condominio", "internet", "netflix", "spotify", "energia", "luz", "agua", "mensalidade"];
            const isFixedKeyword = fixedKeywords.some(k => cat.includes(k) || desc.includes(k));
            
            // Verifica no grupo Levenshtein
            let isFixedPattern = false;
            for (const fixedDesc of detectedFixedDescriptions) {
                if (areStringsSimilar(desc, fixedDesc, 3)) {
                    isFixedPattern = true; break;
                }
            }

            if (isFixedKeyword || isFixedPattern) {
                fixedTotal += amount;
                fixedItemsSet.add(t.description || "Fixo");
            } else {
                variableTotal += amount;
                if (t.tag !== "Outros") variableItemsSet.add(t.tag || "");
            }
        });

        const insights: InsightItem[] = [];

        // Context for Agent (NUDGE ENGINE - Pillar 1 pre-feed)
        // Enviamos esse payload bruto para o LLM gerar a Ação Prática
        const contextForAI = {
            monthlyTotals: { expense: monthTotal, income: monthIncome },
            categoryBreakdown: categoryMap,
            fixedCosts: Array.from(fixedItemsSet),
            variableCosts: Array.from(variableItemsSet),
            detectedAnomalies: [] as string[]
        };

        // =========================================================
        // GOAL & BUDGET STRATEGY
        // =========================================================
        const goals = await db.collection("goals").find({
            userId: new ObjectId(userId),
            type: 'spending'
        }).toArray();

        goals.forEach((goal: any) => {
            const cat = goal.tag || goal.category;
            const limit = goal.targetAmount || 0;
            const spent = categoryMap[cat] || 0;

            if (limit > 0 && spent > 0) {
                const percentage = (spent / limit) * 100;
                if (percentage > 100) {
                    insights.push({
                        id: `budget-exceeded-${goal._id}`,
                        type: "category",
                        text: `Meta Estourada: ${cat}`,
                        value: `${percentage.toFixed(0)}%`,
                        trend: "negative",
                        details: `Você gastou R$ ${spent.toFixed(2)} de um limite de R$ ${limit.toFixed(2)}.`,
                        recommendation: "Pare de gastar nessa categoria imediatamente."
                    });
                } else if (percentage >= 80) {
                    insights.push({
                        id: `budget-warning-${goal._id}`,
                        type: "category",
                        text: `Alerta: ${cat}`,
                        value: `${percentage.toFixed(0)}%`,
                        trend: "warning" as any,
                        details: `Você já consumiu ${percentage.toFixed(0)}% da sua meta para ${cat}.`,
                        recommendation: "Restam poucos recursos, economize."
                    });
                }
            }
        });

        // Calculos de Projeção Mensal Simplificados
        if (monthTotal > 0) {
            const daysInMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth() + 1, 0).getDate();
            const daysPassed = startOfToday.getDate() || 1;
            
            const variableAvg = variableTotal / daysPassed;
            const variableProjected = variableAvg * daysInMonth;
            const projectedTotal = Math.round(variableProjected + fixedTotal);

            let status: "good" | "warning" | "critical" | "excellent" = "good";
            const ratio = projectedTotal / (monthIncome || monthTotal * 1.5);

            if (ratio > 1.0) status = "critical";
            else if (ratio > 0.85) status = "warning";
            else if (ratio < 0.6) status = "excellent";

            insights.push({
                id: "monthly-status",
                type: "monthly",
                text: `Resumo do Mês`,
                value: `R$ ${monthTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
                trend: "neutral",
                details: `Projeção: R$ ${projectedTotal.toLocaleString('pt-BR')} (Variável R$ ${Math.round(variableProjected)} + Fixo R$ ${Math.round(fixedTotal)})`,
                richData: {
                    projection: {
                        current: monthTotal,
                        projected: projectedTotal,
                        dailyAvg: monthTotal / daysPassed,
                        daysRemaining: daysInMonth - daysPassed,
                        breakdown: {
                            fixed: fixedTotal,
                            variable: variableTotal,
                            fixedItems: Array.from(fixedItemsSet).slice(0, 5),
                            variableItems: Array.from(variableItemsSet).slice(0, 5)
                        }
                    },
                    comparison: {
                        expense: projectedTotal,
                        income: monthIncome > 0 ? monthIncome : monthTotal * 1.2,
                        ratio: ratio
                    },
                    status: status
                }
            });
        }

        // Semanal
        if (weekTotal > 0) {
            const diff = weekTotal - lastWeekTotal;
            const percentage = lastWeekTotal > 0 ? (diff / lastWeekTotal) * 100 : 0;
            
            insights.push({
                id: "weekly-status",
                type: "weekly",
                text: percentage > 15 ? "Aceleração de Gastos" : "Ritmo Semanal",
                value: `R$ ${weekTotal.toFixed(0)}`,
                trend: percentage > 15 ? "negative" : "neutral",
                details: percentage !== 0 
                    ? `Nesta semana você já consumiu R$ ${weekTotal.toFixed(0)}. Isso é ${percentage > 0 ? '+' : ''}${percentage.toFixed(0)}% de diferença comparado aos R$ ${lastWeekTotal.toFixed(0)} da semana passada.` 
                    : `Até agora, você consumiu R$ ${weekTotal.toFixed(0)} nesta semana. Controle as despesas variáveis para fechar o caixa no positivo.`,
            });
        }

        // Zero Spend
        if (todayTotal === 0 && hoursBRT >= 16) {
            insights.push({
                id: "zero-spend",
                type: "zero_spend",
                text: "Dia Zero Gastos! 👏",
                value: "R$ 0",
                trend: "positive",
                details: `Já são ${hoursBRT}h e não detectamos nenhuma despesa hoje. Dias sem consumo não-essencial são os maiores responsáveis por gerar salto no patrimônio mensal.`,
            });
        }

        // Fallbacks
        if (insights.length === 0) {
            insights.push({
                id: "fallback",
                type: "general",
                text: "Mantenha o foco",
                value: "---",
                trend: "neutral",
                details: "Registre suas movimentações para gerar inteligência financeira."
            });
        }

        return {
            greeting,
            insights,
            dailySummary: { total: todayTotal },
            weeklySummary: { total: weekTotal },
            monthSummary: { total: monthTotal },
            contextForAI // Envio direto para o Nudge Engine
        };
    }
}
