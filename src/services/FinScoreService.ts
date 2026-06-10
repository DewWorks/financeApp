import { getMongoClient } from "@/db/connectionDb";
import { ObjectId } from "mongodb";

export class FinScoreService {
    /**
     * Calculate and persist the FinScore (0-100) for a user.
     * 4 pillars:
     *   30% - Expense control (1 - expenses/income, capped)
     *   20% - Consistency (days with transactions / days in month)
     *   25% - Goal progress (avg currentAmount/targetAmount)
     *   25% - Month-over-month improvement (prev vs current variable expenses)
     */
    static async calculateAndSave(userId: string): Promise<{ score: number }> {
        const client = await getMongoClient();
        const db = client.db("financeApp");

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const [txThisMonth, txLastMonth, goals, daysWithTx] = await Promise.all([
            // This month's transactions
            db.collection("transactions").aggregate([
                {
                    $match: {
                        userId: new ObjectId(userId),
                        date: { $gte: startOfMonth }
                    }
                },
                {
                    $group: {
                        _id: "$type",
                        total: { $sum: "$amount" }
                    }
                }
            ]).toArray(),

            // Last month's variable expenses
            db.collection("transactions").aggregate([
                {
                    $match: {
                        userId: new ObjectId(userId),
                        type: "expense",
                        date: { $gte: startOfLastMonth, $lte: endOfLastMonth },
                        recurring: { $ne: true }
                    }
                },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]).toArray(),

            // Active goals
            db.collection("goals").find({ userId: new ObjectId(userId) }).toArray(),

            // Distinct days with at least 1 transaction this month
            db.collection("transactions").aggregate([
                {
                    $match: {
                        userId: new ObjectId(userId),
                        date: { $gte: startOfMonth }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: "%Y-%m-%d", date: "$date" }
                        }
                    }
                },
                { $count: "count" }
            ]).toArray()
        ]);

        const income = txThisMonth.find(t => t._id === "income")?.total || 0;
        const expensesThisMonth = txThisMonth.find(t => t._id === "expense")?.total || 0;
        const variableExpensesLastMonth = txLastMonth[0]?.total || 0;
        const uniqueDaysWithTx = daysWithTx[0]?.count || 0;
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const daysElapsed = now.getDate();

        // Pillar 1 (30%): expense control
        let p1 = income > 0 ? Math.max(0, 1 - expensesThisMonth / income) : 0.5;
        p1 = Math.min(1, p1);

        // Pillar 2 (20%): consistency of recording
        const p2 = daysElapsed > 0 ? Math.min(1, uniqueDaysWithTx / Math.min(daysElapsed, 7)) : 0;

        // Pillar 3 (25%): goal progress
        let p3 = 0.5; // neutral if no goals
        if (goals.length > 0) {
            const ratios = goals.map(g => {
                if (!g.targetAmount || g.targetAmount === 0) return 0.5;
                const ratio = g.currentAmount / g.targetAmount;
                // For spending goals: being under target is good
                return g.type === "spending"
                    ? Math.max(0, 1 - ratio) // 0% used = 1.0 (great), 100% = 0.0
                    : Math.min(1, ratio);   // savings: more saved = better
            });
            p3 = ratios.reduce((a, b) => a + b, 0) / ratios.length;
        }

        // Pillar 4 (25%): month-over-month improvement in variable expenses
        let p4 = 0.5; // neutral if no data
        if (variableExpensesLastMonth > 0) {
            // Scale: if same = 0.5, if less = up to 1.0, if more = down to 0
            const ratio = expensesThisMonth / variableExpensesLastMonth;
            p4 = Math.max(0, Math.min(1, 1 - (ratio - 1)));
        }

        const score = Math.round(p1 * 30 + p2 * 20 + p3 * 25 + p4 * 25);

        // Load current score to detect drops
        const userDoc = await db.collection("users").findOne(
            { _id: new ObjectId(userId) },
            { projection: { finScore: 1, finScoreHistory: 1 } }
        );
        const previousScore = userDoc?.finScore ?? null;

        // Save score to user document
        await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    finScore: score,
                    finScoreUpdatedAt: new Date()
                },
                $push: {
                    finScoreHistory: {
                        $each: [{ score, date: new Date() }],
                        $slice: -30 // Keep last 30 data points
                    }
                } as any
            }
        );

        // Alert if score dropped significantly
        if (previousScore !== null && previousScore - score >= 10) {
            import("./NotificationService").then(({ NotificationService }) => {
                const notifier = new NotificationService();
                notifier.sendPush(
                    userId,
                    "📉 Seu FinScore caiu",
                    `Seu score financeiro caiu de ${previousScore} para ${score}. Fale com o Fin para entender o motivo.`,
                    "/",
                    [{ action: "speak_fin", title: "🎙️ Falar com Fin", icon: "/logo.png" }]
                ).catch(() => {});
            });
        }

        return { score };
    }

    static getLabel(score: number): { label: string; color: string; emoji: string } {
        if (score >= 85) return { label: "Ótimo", color: "#22c55e", emoji: "💚" };
        if (score >= 70) return { label: "Bom", color: "#84cc16", emoji: "🟢" };
        if (score >= 50) return { label: "Estável", color: "#eab308", emoji: "🟡" };
        if (score >= 30) return { label: "Em Risco", color: "#f97316", emoji: "🟠" };
        return { label: "Crítico", color: "#ef4444", emoji: "🔴" };
    }
}
