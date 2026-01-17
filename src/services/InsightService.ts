import { getMongoClient } from "@/db/connectionDb";
import { ObjectId } from "mongodb";

export interface InsightItem {
    id: string;
    type: "weekly" | "monthly" | "category" | "zero_spend" | "tip" | "general";
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
    async generateDailyInsight(userId: string, profileId?: string): Promise<InsightResult> {
        const client = await getMongoClient();
        const db = client.db("financeApp");
        const collection = db.collection("transactions");

        // 1. Saudação baseada no horário
        const hour = new Date().getUTCHours() - 3;
        let greeting = "Olá";
        if (hour >= 5 && hour < 12) greeting = "Bom dia";
        else if (hour >= 12 && hour < 18) greeting = "Boa tarde";
        else greeting = "Boa noite";

        // 2. Query Base
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query: any = { type: "expense" };
        if (profileId) {
            query.profileId = new ObjectId(profileId);
        } else {
            query.userId = new ObjectId(userId);
            query.profileId = { $exists: false };
        }

        const now = new Date();
        now.setHours(now.getHours() - 3); // Ajuste GMT-3
        const todayStr = now.toISOString().split('T')[0];

        // 3. Buscar transações
        // Sem filtro estrito de data na query para garantir que pegamos tudo, inclusive datas "mal formatadas"
        const transactions = await collection.find({
            ...query,
        }).sort({ _id: -1 }).limit(200).toArray();

        // Helpers de data (ParseDate Robust)
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

        // Agregadores
        let todayTotal = 0;
        let weekTotal = 0;
        let lastWeekTotal = 0;
        let monthTotal = 0;
        let lastMonthTotal = 0;
        const categoryMap: { [key: string]: number } = {};

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transactions.forEach((t: any) => {
            const amount = Number(t.amount) || 0;
            const tDate = parseDate(t.date);
            if (!tDate) return;

            // Hoje - Check robusto de "Mesmo Dia"
            if (tDate.getDate() === todayDate.getDate() &&
                tDate.getMonth() === todayDate.getMonth() &&
                tDate.getFullYear() === todayDate.getFullYear()) {
                todayTotal += amount;
            }

            // Semanal
            const tWeek = getWeekNumber(tDate);
            if (tWeek === currentWeekNum && tDate.getFullYear() === todayDate.getFullYear()) weekTotal += amount;
            if (tWeek === lastWeekNum && tDate.getFullYear() === todayDate.getFullYear()) lastWeekTotal += amount;

            // Mensal
            if (tDate.getMonth() === currentMonth && tDate.getFullYear() === todayDate.getFullYear()) {
                monthTotal += amount;
                const cat = t.tag || t.category || "Outros";
                categoryMap[cat] = (categoryMap[cat] || 0) + amount;
            }
            if (tDate.getMonth() === lastMonth && (tDate.getFullYear() === todayDate.getFullYear() || (currentMonth === 0 && tDate.getFullYear() === todayDate.getFullYear() - 1))) {
                lastMonthTotal += amount;
            }
        });

        // 4. Coleta de múltiplos insights
        const insights: InsightItem[] = [];

        // Insight 1: Variação Semanal
        if (lastWeekTotal > 50) {
            const diff = weekTotal - lastWeekTotal;
            const percentage = (diff / lastWeekTotal) * 100;
            if (percentage > 20) {
                insights.push({
                    id: "weekly-rise",
                    type: "weekly",
                    text: "Gastos da semana subiram",
                    value: `+${percentage.toFixed(0)}%`,
                    trend: "negative",
                    details: `Seus gastos nesta semana (${weekTotal.toFixed(0)}) estão bem maiores que na anterior (${lastWeekTotal.toFixed(0)}).`,
                    recommendation: "Revise suas compras recentes e veja se houve algum imprevisto ou gasto supérfluo."
                });
            } else if (percentage < -15) {
                insights.push({
                    id: "weekly-drop",
                    type: "weekly",
                    text: "Economia na semana",
                    value: `${percentage.toFixed(0)}%`,
                    trend: "positive",
                    details: "Você gastou menos esta semana comparado à anterior.",
                    recommendation: "Ótimo trabalho! Tente manter esse ritmo de economia."
                });
            }
        }

        // Insight 2: Top Categoria Mensal
        if (Object.keys(categoryMap).length > 0) {
            const topCategory = Object.entries(categoryMap).reduce((a, b) => a[1] > b[1] ? a : b);
            const catName = topCategory[0];
            const catAmount = topCategory[1];

            if (monthTotal > 0 && catAmount > (monthTotal * 0.4)) { // > 40%
                insights.push({
                    id: "top-category",
                    type: "category",
                    text: `Atenção com ${catName}`,
                    value: `${((catAmount / monthTotal) * 100).toFixed(0)}%`,
                    trend: "neutral",
                    details: `A categoria ${catName} representa ${((catAmount / monthTotal) * 100).toFixed(0)}% de todos os seus gastos do mês.`,
                    recommendation: `Considere definir um limite específico para ${catName} no próximo mês.`
                });
            }
        }

        // Insight 3: Zero Gastos ou Resumo do Dia
        const h = new Date().getHours(); // Hora servidor
        const currentHourBR = new Date().getUTCHours() - 3;

        if (todayTotal === 0) {
            if (currentHourBR >= 16) {
                insights.push({
                    id: "zero-spend",
                    type: "zero_spend",
                    text: "Dia sem gastos! 👏",
                    value: "R$ 0",
                    trend: "positive",
                    details: "Você não registrou nenhuma despesa hoje.",
                    recommendation: "Dias sem gastos ajudam muito no balanço final do mês. Continue assim!"
                });
            }
        } else {
            insights.push({
                id: "daily-summary",
                type: "general",
                text: "Gastos de hoje",
                value: `R$ ${todayTotal.toFixed(0)}`,
                trend: "neutral",
                details: `Você já gastou R$ ${todayTotal.toFixed(2)} hoje.`,
                recommendation: "Acompanhe seus gastos diários para não perder o controle."
            });
        }

        // Insight 4: Dica Financeira (Random/General)
        // Adiciona uma dica se tiver poucos insights (menos de 2)
        if (insights.length < 2) {
            insights.push({
                id: "general-tip",
                type: "tip",
                text: "Dica Financeira",
                value: "💡",
                trend: "neutral",
                details: "A regra 50-30-20 é ótima: 50% necessidades, 30% desejos, 20% poupança.",
                recommendation: "Tente aplicar essa divisão no seu orçamento mensal."
            });
        }

        // Fallback se nada foi gerado (improvável com as regras acima, mas por segurança)
        if (insights.length === 0) {
            insights.push({
                id: "fallback",
                type: "general",
                text: "Mantenha o foco",
                value: "---",
                trend: "neutral",
                details: "Continue registrando seus gastos para obter insights melhores.",
                recommendation: "O hábito de registrar é o primeiro passo para o controle financeiro."
            });
        }

        return {
            greeting,
            insights, // Retorna array
            dailySummary: {
                total: todayTotal
            }
        };
    }
}
