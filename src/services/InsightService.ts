import { getMongoClient } from "@/db/connectionDb";
import { ObjectId } from "mongodb";

export interface InsightItem {
    id: string;
    type: "weekly" | "monthly" | "category" | "zero_spend" | "tip" | "general" | "deep_metric" | "savings" | "trend";
    text: string;
    value: string;
    trend: "positive" | "negative" | "neutral";
    details?: string;
    recommendation?: string;
}

export interface InsightResult {
    greeting: string;
    insights: InsightItem[];
    dailySummary: {
        total: number;
    };
}

export class InsightService {
    async generateDailyInsight(userId: string, profileId?: string, scope: 'recent' | 'all' = 'recent'): Promise<InsightResult> {
        const client = await getMongoClient();
        const db = client.db("financeApp");
        const collection = db.collection("transactions");

        // 1. Saudação
        const hour = new Date().getUTCHours() - 3;
        let greeting = "Olá";
        if (hour >= 5 && hour < 12) greeting = "Bom dia";
        else if (hour >= 12 && hour < 18) greeting = "Boa tarde";
        else greeting = "Boa noite";

        // 2. Query Base
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query: any = {}; // Buscamos tudo, filtraremos depois por tipo se precisar
        if (profileId) {
            query.profileId = new ObjectId(profileId);
        } else {
            query.userId = new ObjectId(userId);
            query.profileId = { $exists: false };
        }

        const now = new Date();
        now.setHours(now.getHours() - 3); // Ajuste GMT-3
        const todayStr = now.toISOString().split('T')[0];

        // 3. Determinar limite
        const daysToFetch = scope === 'all' ? 365 : 60;
        const limit = scope === 'all' ? 2000 : 300; // Aumentar limite para pegar income também

        const transactions = await collection.find({
            ...query,
        }).sort({ date: -1 }).limit(limit).toArray();

        // Helpers
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parseDate = (dateInput: any): Date | null => {
            if (!dateInput) return null;
            if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput;
            const dateStr = String(dateInput);
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const [y, m, d] = dateStr.split('-').map(Number);
                return new Date(y, m - 1, d);
            }
            if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                const [d, m, y] = dateStr.split('/').map(Number);
                return new Date(y, m - 1, d);
            }
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) return d;
            return null;
        };

        const getWeekNumber = (d: Date) => {
            const date = new Date(d.getTime());
            date.setHours(0, 0, 0, 0);
            date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
            const week1 = new Date(date.getFullYear(), 0, 4);
            return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
        };

        const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const currentWeekNum = getWeekNumber(todayDate);
        const lastWeekNum = currentWeekNum - 1;
        const currentMonth = todayDate.getMonth();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;

        // Agregadores Standard
        let todayTotal = 0;
        let weekTotal = 0;
        let lastWeekTotal = 0;
        let monthTotal = 0;
        let lastMonthTotal = 0;
        const categoryMap: { [key: string]: number } = {};

        // Agregadores Deep Analysis
        let totalIncome12M = 0;
        let totalExpense12M = 0;
        const monthlyExpenses: { [key: string]: number } = {};
        const monthlyIncomes: { [key: string]: number } = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let biggestExpense: any = null;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transactions.forEach((t: any) => {
            const amount = Number(t.amount) || 0;
            const tDate = parseDate(t.date);
            if (!tDate) return;

            const diffTime = Math.abs(todayDate.getTime() - tDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > daysToFetch) return;

            const isExpense = t.type === 'expense';
            const isIncome = t.type === 'income';

            // --- Cálculos Padrão (Recente - apenas Despesas) ---
            if (isExpense) {
                if (tDate.getDate() === todayDate.getDate() &&
                    tDate.getMonth() === todayDate.getMonth() &&
                    tDate.getFullYear() === todayDate.getFullYear()) {
                    todayTotal += amount;
                }

                const tWeek = getWeekNumber(tDate);
                if (tWeek === currentWeekNum && tDate.getFullYear() === todayDate.getFullYear()) weekTotal += amount;
                if (tWeek === lastWeekNum && tDate.getFullYear() === todayDate.getFullYear()) lastWeekTotal += amount;

                if (tDate.getMonth() === currentMonth && tDate.getFullYear() === todayDate.getFullYear()) {
                    monthTotal += amount;
                    const cat = t.tag || t.category || "Outros";
                    categoryMap[cat] = (categoryMap[cat] || 0) + amount;
                }
                if (tDate.getMonth() === lastMonth && (tDate.getFullYear() === todayDate.getFullYear() || (currentMonth === 0 && tDate.getFullYear() === todayDate.getFullYear() - 1))) {
                    lastMonthTotal += amount;
                }
            }

            // --- Cálculos Deep (Scope = All) ---
            if (scope === 'all') {
                const monthKey = `${tDate.getMonth()}/${tDate.getFullYear()}`; // 0/2024

                if (isExpense) {
                    totalExpense12M += amount;
                    monthlyExpenses[monthKey] = (monthlyExpenses[monthKey] || 0) + amount;

                    if (!biggestExpense || amount > biggestExpense.amount) {
                        biggestExpense = { ...t, dateObj: tDate };
                    }
                } else if (isIncome) {
                    totalIncome12M += amount;
                    monthlyIncomes[monthKey] = (monthlyIncomes[monthKey] || 0) + amount;
                }
            }
        });

        const insights: InsightItem[] = [];

        // =========================================================
        // DEEP ANALYSIS STRATEGIES (Scope === 'all')
        // =========================================================
        if (scope === 'all') {
            const monthsAnalyzed = Object.keys(monthlyExpenses).length || 1;

            // 1. Savings Rate (Taxa de Poupança) GLOBAL
            if (totalIncome12M > 0) {
                const savings = totalIncome12M - totalExpense12M;
                const savingsRate = (savings / totalIncome12M) * 100;

                if (savingsRate > 20) {
                    insights.push({
                        id: "deep-savings-high",
                        type: "savings",
                        text: "Alta Taxa de Poupança",
                        value: `${savingsRate.toFixed(0)}%`,
                        trend: "positive",
                        details: `No acumulado do período, você poupou ${savingsRate.toFixed(1)}% de toda sua renda.`,
                        recommendation: "Excelente! Considere investir esse excedente para render juros."
                    });
                } else if (savingsRate < 0) {
                    insights.push({
                        id: "deep-savings-neg",
                        type: "savings",
                        text: "Alerta de Déficit",
                        value: `${savingsRate.toFixed(0)}%`,
                        trend: "negative",
                        details: `Você gastou R$ ${Math.abs(savings).toFixed(0)} a mais do que ganhou no período analisado.`,
                        recommendation: "Priorize pagar dívidas e reduzir custos fixos imediatamente."
                    });
                } else {
                    insights.push({
                        id: "deep-savings-neutral",
                        type: "savings",
                        text: "Equilíbrio Financeiro",
                        value: `${savingsRate.toFixed(0)}%`,
                        trend: "neutral",
                        details: `Sua taxa de poupança está em ${savingsRate.toFixed(1)}%. O ideal é tentar chegar a 20%.`,
                        recommendation: "Tente guardar um pouco mais a cada mês para criar sua reserva."
                    });
                }
            }

            // 2. Tendência Semestral (Últimos 3 vs Anteriores 3)
            // Precisamos ordenar as chaves mensais para dividir
            const sortedMonths = Object.keys(monthlyExpenses).sort((a, b) => {
                const [ma, ya] = a.split('/').map(Number);
                const [mb, yb] = b.split('/').map(Number);
                return new Date(ya, ma).getTime() - new Date(yb, mb).getTime();
            });

            if (sortedMonths.length >= 2) {
                // Pega os ultimos 3
                const last3 = sortedMonths.slice(-3);
                const prev3 = sortedMonths.slice(-6, -3); // Se tiver menos de 6, pega o que der

                const avgLast3 = last3.reduce((acc, k) => acc + monthlyExpenses[k], 0) / last3.length;
                const avgPrev3 = prev3.length > 0 ? prev3.reduce((acc, k) => acc + monthlyExpenses[k], 0) / prev3.length : 0;

                if (avgPrev3 > 0) {
                    const trendDiff = avgLast3 - avgPrev3;
                    const trendPct = (trendDiff / avgPrev3) * 100;

                    if (trendPct > 15) {
                        insights.push({
                            id: "deep-trend-rising",
                            type: "trend",
                            text: "Tendência de Alta",
                            value: `+${trendPct.toFixed(0)}%`,
                            trend: "negative",
                            details: `Seus gastos médios recentes (R$ ${avgLast3.toFixed(0)}) estão ${trendPct.toFixed(0)}% maiores que a média anterior.`,
                            recommendation: "Identifique se assumiu novos custos fixos recentemente."
                        });
                    } else if (trendPct < -10) {
                        insights.push({
                            id: "deep-trend-falling",
                            type: "trend",
                            text: "Tendência de Baixa",
                            value: `${trendPct.toFixed(0)}%`,
                            trend: "positive",
                            details: `Seus gastos estão caindo! Média recente: R$ ${avgLast3.toFixed(0)} vs Anterior: R$ ${avgPrev3.toFixed(0)}.`,
                            recommendation: "Sua gestão está funcionando. Continue assim!"
                        });
                    }
                }
            }

            // 3. Média Simples (se não caiu no trend)
            if (monthsAnalyzed > 0 && totalExpense12M > 0) {
                const avg = totalExpense12M / monthsAnalyzed;
                // Só adiciona se não tiver trend forte, pra não ficar redundante? Ou adiciona como dado extra.
                // Vamos adicionar com ID único, o frontend roda no carrossel.
                insights.push({
                    id: "deep-avg",
                    type: "deep_metric",
                    text: "Média Mensal",
                    value: `R$ ${avg.toFixed(0)}`,
                    trend: "neutral",
                    details: `Média de R$ ${avg.toFixed(2)} gastos por mês (base: ${monthsAnalyzed} meses).`,
                    recommendation: "Use este valor como base para montar seu orçamento mensal."
                });
            }

            // 4. Biggest Expense (Mantido)
            if (biggestExpense) {
                insights.push({
                    id: "deep-biggest",
                    type: "deep_metric",
                    text: "Maior Gasto",
                    value: `R$ ${biggestExpense.amount}`,
                    trend: "negative",
                    details: `Gasto único mais alto: '${biggestExpense.description}' em ${biggestExpense.dateObj.toLocaleDateString()}.`,
                    recommendation: "Mapeie grandes despesas anuais para não ser pego de surpresa."
                });
            }
        }

        // =========================================================
        // STANDARD STRATEGIES (Standard)
        // =========================================================

        if (lastWeekTotal > 50) {
            const diff = weekTotal - lastWeekTotal;
            const percentage = (diff / lastWeekTotal) * 100;
            const threshold = scope === 'all' ? 30 : 20;

            if (percentage > threshold) {
                insights.push({
                    id: "weekly-rise",
                    type: "weekly",
                    text: "Gastos da semana subiram",
                    value: `+${percentage.toFixed(0)}%`,
                    trend: "negative",
                    details: `Esta semana: R$ ${weekTotal.toFixed(0)} vs Semana passada: R$ ${lastWeekTotal.toFixed(0)}.`,
                    recommendation: "Atenção com gastos impulsivos no fim de semana."
                });
            } else if (percentage < -15) {
                insights.push({
                    id: "weekly-drop",
                    type: "weekly",
                    text: "Economia na semana",
                    value: `${percentage.toFixed(0)}%`,
                    trend: "positive",
                    details: "Você gastou menos esta semana comparado à anterior.",
                    recommendation: "Excelente resultado semanal!"
                });
            }
        }

        if (Object.keys(categoryMap).length > 0) {
            const topCategory = Object.entries(categoryMap).reduce((a, b) => a[1] > b[1] ? a : b);
            const catAmount = topCategory[1];

            if (monthTotal > 0 && catAmount > (monthTotal * 0.4)) { // 40%
                insights.push({
                    id: "top-category",
                    type: "category",
                    text: `Foco em ${topCategory[0]}`,
                    value: `${((catAmount / monthTotal) * 100).toFixed(0)}%`,
                    trend: "neutral",
                    details: `${topCategory[0]} consome ${((catAmount / monthTotal) * 100).toFixed(0)}% do seu orçamento mensal.`,
                    recommendation: "Avalie se é possível reduzir custos nesta categoria específica."
                });
            }
        }

        const h = new Date().getHours();
        const currentHourBR = new Date().getUTCHours() - 3;

        if (todayTotal === 0 && currentHourBR >= 16) {
            insights.push({
                id: "zero-spend",
                type: "zero_spend",
                text: "Dia sem gastos! 👏",
                value: "R$ 0",
                trend: "positive",
                details: "Você não registrou nenhuma despesa hoje.",
                recommendation: "Dias off ajudam a equilibrar contas pesadas."
            });
        }

        // Fallbacks
        if (insights.length < 2) {
            if (scope === 'all') {
                insights.push({
                    id: "deep-info",
                    type: "general",
                    text: "Análise Histórica",
                    value: "12 meses",
                    trend: "neutral",
                    details: "Base de dados analisada: últimos 365 dias de transações.",
                    recommendation: "Continue registrando receitas e despesas para diagnósticos precisos."
                });
            } else {
                insights.push({
                    id: "general-tip",
                    type: "tip",
                    text: "Dica Rápida",
                    value: "💡",
                    trend: "neutral",
                    details: "Para começar a investir, o primeiro passo é quitar dívidas de juros altos.",
                    recommendation: "Revise faturas de cartão e cheque especial."
                });
            }
        }

        // Garante que temos algo
        if (insights.length === 0) {
            insights.push({
                id: "fallback",
                type: "general",
                text: "Mantenha o foco",
                value: "---",
                trend: "neutral",
                details: "Registre suas movimentações para gerar inteligência financeira.",
                recommendation: "O controle começa pelo registro diário."
            });
        }

        return {
            greeting,
            insights,
            dailySummary: {
                total: todayTotal
            }
        };
    }
}
