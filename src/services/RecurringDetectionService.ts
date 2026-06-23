import { getMongoClient } from "@/db/connectionDb";
import { ObjectId } from "mongodb";

interface RecurringPattern {
    label: string;
    normalizedLabel: string;
    amount: number;
    interval: "monthly" | "weekly";
    lastSeen: Date;
    count: number;
}

export class RecurringDetectionService {
    /**
     * Analyze the last 90 days of transactions for a user and detect recurring payments.
     * Marks matching transactions as `recurring: true` and saves a summary to the user document.
     */
    static async detectForUser(userId: string): Promise<{ detected: number }> {
        const client = await getMongoClient();
        const db = client.db("financeApp");

        const since = new Date();
        since.setDate(since.getDate() - 90);

        const transactions = await db.collection("transactions")
            .find({
                userId: new ObjectId(userId),
                type: "expense",
                date: { $gte: since },
                merchantName: { $exists: true, $ne: null }
            })
            .sort({ date: -1 })
            .toArray();

        if (transactions.length === 0) return { detected: 0 };

        // Group by normalized merchant name
        const groups = new Map<string, typeof transactions>();
        for (const tx of transactions) {
            const key = this.normalizeMerchant(tx.merchantName || tx.description || "");
            if (!key) continue;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(tx);
        }

        const detected: RecurringPattern[] = [];
        const bulkOps: any[] = [];

        for (const [key, txs] of groups.entries()) {
            if (txs.length < 2) continue;

            // Check if amounts are similar (within 15%)
            const amounts = txs.map(t => t.amount);
            const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
            const maxDeviation = Math.max(...amounts.map(a => Math.abs(a - avgAmount) / avgAmount));
            if (maxDeviation > 0.15) continue;

            // Determine interval by checking gaps between dates
            const dates = txs.map(t => new Date(t.date)).sort((a, b) => a.getTime() - b.getTime());
            const gaps: number[] = [];
            for (let i = 1; i < dates.length; i++) {
                gaps.push((dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24));
            }
            const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;

            let interval: "monthly" | "weekly" | null = null;
            if (avgGap >= 25 && avgGap <= 35) interval = "monthly";
            else if (avgGap >= 5 && avgGap <= 9) interval = "weekly";

            if (!interval) continue;

            // Ensure transactions span at least 2 distinct calendar months
            const months = new Set(dates.map(d => `${d.getFullYear()}-${d.getMonth()}`));
            if (months.size < 2) continue;

            detected.push({
                label: txs[0].merchantName || txs[0].description || key,
                normalizedLabel: key,
                amount: Math.round(avgAmount * 100) / 100,
                interval,
                lastSeen: dates[dates.length - 1],
                count: txs.length
            });

            // Mark all matching transactions
            for (const tx of txs) {
                bulkOps.push({
                    updateOne: {
                        filter: { _id: tx._id },
                        update: { $set: { recurring: true, recurringLabel: key, recurringInterval: interval } }
                    }
                });
            }
        }

        // Execute bulk update
        if (bulkOps.length > 0) {
            await db.collection("transactions").bulkWrite(bulkOps);
        }

        // Save summary to user document
        if (detected.length > 0) {
            await db.collection("users").updateOne(
                { _id: new ObjectId(userId) },
                {
                    $set: {
                        recurringSubscriptions: detected.map(d => ({
                            label: d.label,
                            amount: d.amount,
                            interval: d.interval,
                            lastSeen: d.lastSeen
                        })),
                        recurringUpdatedAt: new Date()
                    }
                }
            );

            await this.projectFutureRecurring(userId, detected, db);
        }

        return { detected: detected.length };
    }

    /**
     * Injeta transações pendentes no futuro (próximo mês/semana) baseado nas recorrências ativas detectadas.
     * Isso reduz o atrito do usuário, prevendo os gastos fixos.
     */
    private static async projectFutureRecurring(userId: string, patterns: RecurringPattern[], db: any) {
        const projectedTxs: any[] = [];
        const today = new Date();

        for (const pattern of patterns) {
            // Se a última ocorrência foi há mais de 45 dias para mensal, ou mais de 14 para semanal, ignoramos (pode ter sido cancelado)
            const daysSinceLast = (today.getTime() - pattern.lastSeen.getTime()) / (1000 * 60 * 60 * 24);
            if (pattern.interval === 'monthly' && daysSinceLast > 45) continue;
            if (pattern.interval === 'weekly' && daysSinceLast > 14) continue;

            const nextDate = new Date(pattern.lastSeen);
            if (pattern.interval === 'monthly') {
                nextDate.setMonth(nextDate.getMonth() + 1);
            } else {
                nextDate.setDate(nextDate.getDate() + 7);
            }

            // Se a próxima data ainda não chegou ou acabou de chegar (janela de 5 dias), projetamos
            // Verificamos se já não existe uma transação projetada para esse label nesse mês/semana para evitar duplicatas infinitas
            
            const startOfWindow = new Date(nextDate);
            startOfWindow.setDate(startOfWindow.getDate() - 5);
            const endOfWindow = new Date(nextDate);
            endOfWindow.setDate(endOfWindow.getDate() + 5);

            const existing = await db.collection("transactions").findOne({
                userId: new ObjectId(userId),
                recurringLabel: pattern.normalizedLabel,
                date: { $gte: startOfWindow, $lte: endOfWindow }
            });

            if (!existing) {
                projectedTxs.push({
                    userId: new ObjectId(userId),
                    type: 'expense',
                    amount: pattern.amount,
                    description: `[Previsto] ${pattern.label}`,
                    merchantName: pattern.label,
                    category: 'Despesas Fixas',
                    date: nextDate,
                    status: 'pending', // Fundamental: não foi pago ainda
                    isProjected: true, // Flag para a UI saber
                    recurringLabel: pattern.normalizedLabel,
                    recurringInterval: pattern.interval,
                    recurring: true,
                    provider: 'manual', // Tratar como se fosse manual para permitir edição pelo usuário
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        }

        if (projectedTxs.length > 0) {
            await db.collection("transactions").insertMany(projectedTxs);
        }
    }

    private static normalizeMerchant(name: string): string {
        const stopWords = ['pix', 'pgto', 'pagamento', 'compra', 'cartao', 'transf', 'transferencia', 'ted', 'doc'];
        let normalized = name
            .toLowerCase()
            .replace(/[^a-z\u00C0-\u017F\s]/g, " ") // remove numbers and special chars completely
            .replace(/\s+/g, " ")
            .trim();

        // Remove stop words
        const words = normalized.split(' ').filter(w => w.length > 2 && !stopWords.includes(w));
        normalized = words.join(' ').substring(0, 40);

        return normalized || name.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 20); // fallback
    }
}
