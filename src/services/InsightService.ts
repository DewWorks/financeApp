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
        }

        const now = new Date();
        now.setHours(now.getHours() - 3); // Ajuste GMT-3
        // const todayStr = now.toISOString().split('T')[0];

        // 3. Determinar limite
        const daysToFetch = scope === 'all' ? 365 : 120; // 4 months for trend analysis
        const limit = scope === 'all' ? 2000 : 800;

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
        let monthIncome = 0;
        let fixedTotal = 0;
        let variableTotal = 0;
        const fixedItemsSet = new Set<string>();
        const variableItemsSet = new Set<string>();
        const categoryMap: { [key: string]: number } = {};

        // DYNAMIC FIXED COST DETECTION
        // 1. Group by description AND category
        const recurrenceDescMap: { [key: string]: { amounts: number[], months: Set<string> } } = {};
        const recurrenceCatMap: { [key: string]: { amounts: number[], months: Set<string> } } = {};

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transactions.forEach((t: any) => {
            if (t.type !== 'expense') return;
            const date = parseDate(t.date);
            if (!date) return;
            const monthKey = `${date.getMonth()}/${date.getFullYear()}`;
            const amount = Number(t.amount);

            // By Description
            const desc = (t.description || t.title || "").toLowerCase().trim();
            if (desc) {
                if (!recurrenceDescMap[desc]) recurrenceDescMap[desc] = { amounts: [], months: new Set() };
                recurrenceDescMap[desc].amounts.push(amount);
                recurrenceDescMap[desc].months.add(monthKey);
            }

            // By Category
            const cat = (t.category || t.tag || "").toLowerCase().trim();
            if (cat && cat !== "outros") {
                if (!recurrenceCatMap[cat]) recurrenceCatMap[cat] = { amounts: [], months: new Set() };
                recurrenceCatMap[cat].amounts.push(amount);
                recurrenceCatMap[cat].months.add(monthKey);
            }
        });

        // 2. Identify Fixed Patterns
        const detectedFixedDescriptions = new Set<string>();
        const detectedFixedCategories = new Set<string>();

        const checkConsistency = (map: typeof recurrenceDescMap, targetSet: Set<string>, varianceThreshold = 0.15) => {
            Object.entries(map).forEach(([key, data]) => {
                if (data.months.size >= 2) {
                    const avg = data.amounts.reduce((a, b) => a + b, 0) / data.amounts.length;
                    const variance = data.amounts.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / data.amounts.length;
                    const stdDev = Math.sqrt(variance);
                    if ((stdDev / avg) < varianceThreshold) {
                        targetSet.add(key);
                    }
                }
            });
        }

        checkConsistency(recurrenceDescMap, detectedFixedDescriptions, 0.1);
        checkConsistency(recurrenceCatMap, detectedFixedCategories, 0.2);

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

                    // Split Fixed vs Variable
                    const fixedKeywords = ["aluguel", "condominio", "internet", "netflix", "spotify", "energia", "luz", "agua", "mensalidade", "faculdade", "assinatura"];
                    const normalizedCat = cat.toLowerCase();
                    const desc = (t.description || t.title || "").toLowerCase().trim();

                    const isFixedKeyword = fixedKeywords.some(k => normalizedCat.includes(k));
                    const isFixedPattern = detectedFixedDescriptions.has(desc);
                    const isFixedCategory = detectedFixedCategories.has(normalizedCat);

                    const isFixed = isFixedKeyword || isFixedPattern || isFixedCategory;

                    if (isFixed) {
                        fixedTotal += amount;
                        // Use category for fixed unless it's "Outros"
                        const displayName = (t.category && t.category !== "Outros") ? t.category : (t.description || "Fixo");
                        fixedItemsSet.add(displayName);
                    } else {
                        variableTotal += amount;
                        // For variable, we group by category mainly
                        if (cat !== "Outros") variableItemsSet.add(cat);
                    }
                }
                if (tDate.getMonth() === lastMonth && (tDate.getFullYear() === todayDate.getFullYear() || (currentMonth === 0 && tDate.getFullYear() === todayDate.getFullYear() - 1))) {
                    lastMonthTotal += amount;
                }
            }

            if (isIncome) {
                if (tDate.getMonth() === currentMonth && tDate.getFullYear() === todayDate.getFullYear()) {
                    monthIncome += amount;
                }
            }

            // --- Cálculos Deep / History (Always run for trend context) ---
            const monthKey = `${tDate.getMonth()}/${tDate.getFullYear()}`; // 0/2024

            if (isExpense) {
                // Only count for history if it's NOT the current month
                if (monthKey !== `${todayDate.getMonth()}/${todayDate.getFullYear()}`) {
                    monthlyExpenses[monthKey] = (monthlyExpenses[monthKey] || 0) + amount;
                }

                if (scope === 'all') {
                    totalExpense12M += amount;
                    if (!biggestExpense || amount > biggestExpense.amount) {
                        biggestExpense = { ...t, dateObj: tDate };
                    }
                }
            } else if (isIncome) {
                if (scope === 'all') {
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

            // 5. ANOMALY DETECTION (CATEGORY SPIKES)
            // Calculate average per category over history
            const categoryHistory: { [cat: string]: number[] } = {};

            // We need to re-scan transactions for category history since standard scan only did current/last month
            // Optimization: traverse monthlyExpenses keys is not enough, we need category breakdown per month.
            // Let's do a quick pass on the transactions array again or optimize earlier.
            // Given 'transactions' has 12m data (scope=all), we can just loop.

            transactions.forEach((t: any) => {
                if (t.type === 'expense' && t.category && t.category !== 'Outros') {
                    const d = parseDate(t.date);
                    if (!d) return;
                    // Skip current month for "Average" calculation to be fair
                    if (d.getMonth() === todayDate.getMonth() && d.getFullYear() === todayDate.getFullYear()) return;

                    const k = t.category;
                    if (!categoryHistory[k]) categoryHistory[k] = [];
                    categoryHistory[k].push(Number(t.amount));
                }
            });

            // Analyze current month vs Average
            Object.entries(categoryMap).forEach(([cat, currentAmount]) => {
                const history = categoryHistory[cat];
                if (history && history.length > 0) {
                    // Simple average of all transactions? No, need sum per month.
                    // Correct approach: Group history by month first.
                    // Too complex for one loop. Let's start simple:
                    // Just sum all history amounts and divide by 'monthsAnalyzed' (approx).
                    const totalHist = history.reduce((a, b) => a + b, 0);
                    const avgHist = totalHist / Math.max(monthsAnalyzed, 1); // monthsAnalyzed calculated earlier

                    if (avgHist > 50) { // Ignore trivial amounts
                        const ratio = currentAmount / avgHist;

                        // If we are late in the month (day > 20), direct comparison is valid.
                        // If early, projected comparison is better? 
                        // Let's use direct amount. If I already spent more than my Monthly Average on day 10, that's a HUGE anomaly.

                        if (ratio > 1.4) {
                            insights.push({
                                id: `anomaly-${cat}`,
                                type: "category",
                                text: `Alerta: ${cat}`,
                                value: `+${((ratio - 1) * 100).toFixed(0)}%`,
                                trend: "negative",
                                details: `Você já gastou ${ratio.toFixed(1)}x sua média mensal em ${cat} (R$ ${currentAmount.toFixed(0)} vs Méd: R$ ${avgHist.toFixed(0)}).`,
                                recommendation: "Revise se houve algum gasto extraordinário ou erro de categoria."
                            });
                        }
                    }
                }
            });
        }

        // =========================================================
        // GOAL & BUDGET STRATEGY (High Priority)
        // =========================================================
        const goals = await db.collection("goals").find({
            userId: new ObjectId(userId),
            type: 'spending' // We only monitor budgets here for now
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
                        type: "category", // or 'alert'
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
                        trend: "neutral",
                        details: `Você já consumiu ${percentage.toFixed(0)}% da sua meta para ${cat}.`,
                        recommendation: "Restam poucos recursos, economize."
                    });
                }
            }
        });

        // =========================================================
        // STANDARD STRATEGIES (Standard)
        // =========================================================

        // 1. Monthly Snapshot (Priority: High)
        if (monthTotal > 0) {
            const monthName = todayDate.toLocaleString('pt-BR', { month: 'long' });

            // PROJECTION LOGIC (Refined Fixed vs Variable)
            const daysInMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0).getDate();
            const daysPassed = todayDate.getDate();

            // Variable Projection
            const variableAvg = variableTotal / Math.max(daysPassed, 1);
            const variableProjected = variableAvg * daysInMonth;

            // Total = Variable Projected + Fixed (Actuals only, assuming single payment)
            // Note: If fixed costs are paid early (day 5), simple addition is correct. 
            // If they are late (day 25), they won't be in fixedTotal yet, so projection might be low?
            // BETTER STRATEGY: 
            // If history exists, we should probably know "Expected Fixed Total". 
            // But for now, sticking to the "Don't extrapolate Rent" request is safer to reduce over-projection.
            const projectedTotal = variableProjected + fixedTotal;
            const dailyAvg = monthTotal / Math.max(daysPassed, 1); // Keep for reference if needed

            // Only project if we are at least on day 5 to avoid wild swings
            let projectionText = "";
            if (daysPassed >= 5) {
                // DIDACTIC EXPLANATION
                projectionText = ` 🔮 Projeção: R$ ${projectedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}. Cálculo: Variável (R$ ${variableProjected.toFixed(0)}) + Fixo (R$ ${fixedTotal.toFixed(0)}).`;
            }

            // SMART BLEND LOGIC (Historical vs Current)
            // Calculate average of previous 3 months
            const last3Months = Object.keys(monthlyExpenses)
                .sort((a, b) => {
                    const [ma, ya] = a.split('/').map(Number);
                    const [mb, yb] = b.split('/').map(Number);
                    return new Date(yb, mb).getTime() - new Date(ya, ma).getTime();
                })
                .filter(k => k !== `${todayDate.getMonth()}/${todayDate.getFullYear()}`) // Exclude current
                .slice(0, 3);

            let historicalAvg = 0;
            if (last3Months.length > 0) {
                const sumHistory = last3Months.reduce((sum, key) => sum + monthlyExpenses[key], 0);
                historicalAvg = sumHistory / last3Months.length;
            }

            // Weighted Average: 40% Current Pace + 60% History (if history exists)
            // If > day 20, trust current pace more (80%).
            let weightCurrent = 0.4;
            if (daysPassed > 20) weightCurrent = 0.8;
            else if (daysPassed < 10) weightCurrent = 0.2;
            if (historicalAvg === 0) weightCurrent = 1.0; // No history, full trust current

            let finalProjection = (projectedTotal * weightCurrent) + (historicalAvg * (1 - weightCurrent));

            // Precision Fix & Rounding
            finalProjection = Math.round(finalProjection);

            if (historicalAvg > 0) {
                const p1 = Math.round(weightCurrent * 100);
                const p2 = Math.round((1 - weightCurrent) * 100);
                projectionText += ` (Base: ${p1}% Ritmo Atual + ${p2}% Histórico)`;
            }

            // Determine Rhythm Status and Comparison
            let status: "good" | "warning" | "critical" | "excellent" = "good";

            // USE REAL INCOME IF AVAILABLE, otherwise use 12M Avg, otherwise fallback
            let comparedIncome = monthIncome;
            if (comparedIncome === 0 && totalIncome12M > 0) {
                const monthsCount = Object.keys(monthlyExpenses).length || 1;
                comparedIncome = totalIncome12M / Math.max(monthsCount, 1);
            }
            if (comparedIncome === 0) comparedIncome = monthTotal * 1.2; // Last resort fallback

            const ratio = finalProjection / (comparedIncome || 1);

            if (ratio > 1.0) status = "critical";
            else if (ratio > 0.85) status = "warning";
            else if (ratio < 0.6) status = "excellent";

            // Smart Recommendation
            let recommendation = "Para reduzir a projeção, tente passar alguns dias sem compras (Days Off).";
            if (status === 'critical') {
                recommendation = "Atenção Crítica: Sua projeção ultrapassa sua renda. Corte gastos não essenciais imediatamente.";
            } else if (historicalAvg > 0 && finalProjection > historicalAvg * 1.2) {
                recommendation = "Você está gastando 20% acima do seu histórico. Verifique se houve algum imprevisto.";
            }

            insights.push({
                id: "monthly-status",
                type: "monthly",
                text: `Resumo de ${monthName}`,
                value: `R$ ${monthTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
                trend: "neutral",
                details: `${projectionText} ${daysPassed >= 5 && finalProjection > (monthTotal * 1.5) ? "O ritmo está alto." : "Ritmo controlado."}`,
                recommendation: recommendation,
                richData: {
                    projection: {
                        current: monthTotal,
                        projected: finalProjection,
                        dailyAvg: dailyAvg,
                        daysRemaining: daysInMonth - daysPassed,
                        breakdown: {
                            fixed: fixedTotal,
                            variable: variableTotal,
                            fixedItems: Array.from(fixedItemsSet).slice(0, 5),
                            variableItems: Array.from(variableItemsSet).slice(0, 5)
                        }
                    },
                    comparison: {
                        expense: finalProjection,
                        income: Number(comparedIncome.toFixed(0)),
                        ratio: ratio
                    },
                    status: status
                }
            });
        }

        // 2. Weekly Analysis (Refined Text)
        if (weekTotal > 0) {
            if (lastWeekTotal > 50) {
                const diff = weekTotal - lastWeekTotal;
                const percentage = (diff / lastWeekTotal) * 100;

                if (percentage > 20) {
                    insights.push({
                        id: "weekly-rise",
                        type: "weekly",
                        text: "Atenção na Semana",
                        value: `+${percentage.toFixed(0)}%`,
                        trend: "negative",
                        details: `Seus gastos subiram. Atual: R$ ${weekTotal.toFixed(0)} vs Anterior: R$ ${lastWeekTotal.toFixed(0)}.`,
                    });
                } else if (percentage < -15) {
                    insights.push({
                        id: "weekly-drop",
                        type: "weekly",
                        text: "Economia Semanal",
                        value: `${percentage.toFixed(0)}%`,
                        trend: "positive", // Use positive for savings (green)
                        details: `Você gastou R$ ${Math.abs(diff).toFixed(0)} a menos que na semana passada (R$ ${lastWeekTotal.toFixed(0)}).`,
                    });
                } else {
                    insights.push({
                        id: "weekly-stable",
                        type: "weekly",
                        text: "Semana Estável",
                        value: `R$ ${weekTotal.toFixed(0)}`,
                        trend: "neutral",
                        details: `Gasto semanal dentro da média. Total: R$ ${weekTotal.toFixed(0)}.`,
                    });
                }
            } else {
                // New: Standalone Weekly (No history)
                insights.push({
                    id: "weekly-status",
                    type: "weekly",
                    text: "Gasto Semanal",
                    value: `R$ ${weekTotal.toFixed(0)}`,
                    trend: "neutral",
                    details: `Nesta semana você já registrou R$ ${weekTotal.toFixed(2)} em gastos.`,
                });
            }
        }

        // 3. Category Projection (NEW REQUEST: "Categorizado")
        if (Object.keys(categoryMap).length > 0) {
            const topCategory = Object.entries(categoryMap).reduce((a, b) => a[1] > b[1] ? a : b);
            const catAmount = topCategory[1];
            const catName = topCategory[0].toLowerCase();

            // FIXED COST DETECTION
            const fixedKeywords = ["aluguel", "condominio", "internet", "netflix", "spotify", "energia", "luz", "agua", "mensalidade", "faculdade", "assinatura"];
            const isFixed = fixedKeywords.some(k => catName.includes(k));

            // Project Category Specific
            const daysInMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0).getDate();
            const daysPassed = todayDate.getDate();

            let catProj = 0;
            if (isFixed) {
                // If fixed, do not extrapolate daily. Assume what is paid is paid.
                catProj = catAmount;
            } else {
                const catAvg = catAmount / Math.max(daysPassed, 1);
                catProj = catAvg * daysInMonth;
            }

            if (monthTotal > 0 && catAmount > (monthTotal * 0.3)) {
                let detailsText = `Você já gastou R$ ${catAmount.toFixed(0)} com ${topCategory[0]}. `;
                if (isFixed) {
                    detailsText += `Como é um custo fixo, consideramos esse valor para o fechamento.`;
                } else {
                    detailsText += `Nesse ritmo, fechará o mês gastando R$ ${catProj.toFixed(0)} só nessa categoria.`;
                }

                insights.push({
                    id: "top-category-proj",
                    type: "category",
                    text: `Projeção: ${topCategory[0]}`,
                    value: `R$ ${catProj.toFixed(0)} (Est.)`,
                    trend: "neutral",
                    details: detailsText,
                });
            }
        }

        // 4. Category (Priority: Medium)
        if (Object.keys(categoryMap).length > 0) {
            const topCategory = Object.entries(categoryMap).reduce((a, b) => a[1] > b[1] ? a : b);
            const catAmount = topCategory[1];

            if (monthTotal > 0 && catAmount > (monthTotal * 0.3)) { // Lowered to 30% to appear more often
                insights.push({
                    id: "top-category",
                    type: "category",
                    text: `Foco em ${topCategory[0]}`,
                    value: `${((catAmount / monthTotal) * 100).toFixed(0)}%`,
                    trend: "neutral",
                    details: `${topCategory[0]} representa a maior fatia (${((catAmount / monthTotal) * 100).toFixed(0)}%) dos seus gastos.`,
                });
            }
        }

        // 4. Filler: Daily Average (If needed to reach 3)
        if (monthTotal > 0 && insights.length < 3) {
            const dayOfMont = todayDate.getDate() || 1;
            const avg = monthTotal / dayOfMont;
            insights.push({
                id: "daily-avg",
                type: "general",
                text: "Média Diária",
                value: `R$ ${avg.toFixed(0)}`,
                trend: "neutral",
                details: `Você está gastando em média R$ ${avg.toFixed(2)} por dia este mês.`
            });
        }

        // 5. Zero Spend (Bonus)
        const currentHourBR = new Date().getUTCHours() - 3;
        if (todayTotal === 0 && currentHourBR >= 16) {
            insights.push({
                id: "zero-spend",
                type: "zero_spend",
                text: "Dia Zero Gastos! 👏",
                value: "R$ 0",
                trend: "positive",
                details: "Parabéns! Nenhuma despesa registrada hoje.",
            });
        }

        // Fallbacks (If still < 2, add generics)
        if (insights.length < 2) {
            insights.push({
                id: "general-tip",
                type: "tip",
                text: "Dica Financeira",
                value: "💡",
                trend: "neutral",
                details: "Para começar a investir, o primeiro passo é quitar dívidas de juros altos.",
                recommendation: "Revise faturas de cartão e cheque especial."
            });
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
            },
            weeklySummary: {
                total: weekTotal
            },
            monthSummary: {
                total: monthTotal
            }
        };
    }
}
