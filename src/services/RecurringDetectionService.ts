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
        }

        return { detected: detected.length };
    }

    private static normalizeMerchant(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\u00C0-\u017F\s]/g, "") // keep letters/numbers/accents
            .replace(/\s+/g, " ")
            .trim()
            .substring(0, 40); // cap length for key grouping
    }
}
