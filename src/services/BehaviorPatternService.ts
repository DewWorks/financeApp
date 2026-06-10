import { getMongoClient } from "@/db/connectionDb";
import { ObjectId } from "mongodb";

const DAY_NAMES_PT = ["domingos", "segundas", "terças", "quartas", "quintas", "sextas", "sábados"];

export class BehaviorPatternService {
    /**
     * Analyze spending patterns by day of week for a user (last 90 days).
     * Saves peakDay, peakDayName, and avgByDay to user document.
     */
    static async analyzeForUser(userId: string): Promise<void> {
        try {
            const client = await getMongoClient();
            const db = client.db("financeApp");

            const since = new Date();
            since.setDate(since.getDate() - 90);

            const result = await db.collection("transactions").aggregate([
                {
                    $match: {
                        userId: new ObjectId(userId),
                        type: "expense",
                        date: { $gte: since }
                    }
                },
                {
                    $group: {
                        _id: { $dayOfWeek: "$date" }, // 1=Sun, 7=Sat
                        total: { $sum: "$amount" },
                        count: { $sum: 1 }
                    }
                }
            ]).toArray();

            if (result.length === 0) return;

            // Build map 0-6 (Sun=0...Sat=6) with avg spending
            const avgByDay: Record<number, number> = {};
            for (const r of result) {
                const dayIndex = (r._id - 1); // Mongo: 1=Sun → 0
                avgByDay[dayIndex] = Math.round(r.total / 13); // ~90 days / 7 * num weeks
            }

            const peakEntry = Object.entries(avgByDay).sort(([, a], [, b]) => b - a)[0];
            const peakDay = peakEntry ? parseInt(peakEntry[0]) : 5; // Default Friday
            const peakDayName = DAY_NAMES_PT[peakDay] || "sextas";

            await db.collection("users").updateOne(
                { _id: new ObjectId(userId) },
                {
                    $set: {
                        "spendingPatterns.peakDay": peakDay,
                        "spendingPatterns.peakDayName": peakDayName,
                        "spendingPatterns.avgByDay": avgByDay,
                        "spendingPatterns.updatedAt": new Date()
                    }
                }
            );
        } catch (error) {
            console.error("[BehaviorPatternService] Error:", error);
        }
    }
}
