import { getMongoClient } from "@/db/connectionDb";
import { ObjectId } from "mongodb";

export class GoalTrackingService {
    /**
     * Recalculates currentAmount for all active goals of a user based on real transactions.
     * For 'spending' goals: sums expenses in the matching category this month.
     * For 'savings' goals: uses the currentAmount field (manually set or from challenge acceptance).
     * 
     * Also detects newly completed goals and triggers notifications.
     */
    static async updateGoalProgress(userId: string, tagFilter?: string): Promise<{ updated: number; completed: number }> {
        const client = await getMongoClient();
        const db = client.db("financeApp");

        const query: any = { userId: new ObjectId(userId) };
        if (tagFilter) query.tag = tagFilter;

        const goals = await db.collection("goals").find(query).toArray();
        if (goals.length === 0) return { updated: 0, completed: 0 };

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        let updated = 0;
        let completed = 0;

        for (const goal of goals) {
            if (goal.type === "spending") {
                // Sum actual expenses in this category this month
                const result = await db.collection("transactions").aggregate([
                    {
                        $match: {
                            userId: new ObjectId(userId),
                            type: "expense",
                            tag: goal.tag,
                            date: { $gte: startOfMonth },
                            recurring: { $ne: true } // Exclude fixed subscriptions
                        }
                    },
                    { $group: { _id: null, total: { $sum: "$amount" } } }
                ]).toArray();

                const newAmount = Math.round((result[0]?.total || 0) * 100) / 100;
                const wasCompleted = goal.completedAt != null;
                const isNowComplete = newAmount >= goal.targetAmount;

                await db.collection("goals").updateOne(
                    { _id: goal._id },
                    { $set: { currentAmount: newAmount, updatedAt: new Date() } }
                );
                updated++;

                // Trigger goal-met notification only once
                if (isNowComplete && !wasCompleted) {
                    await db.collection("goals").updateOne(
                        { _id: goal._id },
                        { $set: { completedAt: new Date() } }
                    );

                    // Send notification (fire and forget)
                    import("./NotificationService").then(({ NotificationService }) => {
                        const notifier = new NotificationService();
                        const formattedAmount = newAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
                        notifier.sendGoalMetAlert(userId, goal.name, formattedAmount)
                            .catch(e => console.error("[GoalTracking] Notification error:", e));
                    });
                    completed++;
                }
            }
            // 'savings' goals are updated manually or via the challenge flow — skip auto-calc for now
        }

        return { updated, completed };
    }
}
