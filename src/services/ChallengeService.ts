import { getMongoClient } from "@/db/connectionDb";
import { ObjectId } from "mongodb";
import { Recommendation } from "@/app/models/Recommendation";
import { IRecommendation } from "@/interfaces/IRecommendation";

export class ChallengeService {
    /**
     * Accept a recommendation and turn it into an active challenge.
     */
    static async acceptChallenge(userId: string, recommendationId: string): Promise<any> {
        const client = await getMongoClient();
        const db = client.db("financeApp");

        const recId = new ObjectId(recommendationId);
        const uId = new ObjectId(userId);

        const recommendation = await db.collection("recommendations").findOne({
            _id: recId,
            userId: uId,
        });

        if (!recommendation) {
            throw new Error("Recomendação não encontrada.");
        }

        if (recommendation.status !== "PENDING" && recommendation.status !== "VIEWED") {
            throw new Error("Desafio já aceito ou concluído.");
        }

        // Set duration to 7 days
        const challengeStartDate = new Date();
        const challengeEndDate = new Date();
        challengeEndDate.setDate(challengeEndDate.getDate() + 7);

        // Derive targetLimit. For example, if user spends on average R$ 500 in Category,
        // and recommendation suggests saving R$ 100, targetLimit = 400.
        // If not specified, we can estimate targetLimit = 1.5 * impactEstimate.
        // Let's query recent category spending or use a simple estimate:
        const impactEstimate = recommendation.impactEstimate || 50;
        const targetLimit = Math.max(50, impactEstimate * 2); 

        const result = await db.collection("recommendations").updateOne(
            { _id: recId, userId: uId },
            {
                $set: {
                    status: "ACTIVE",
                    challengeStartDate,
                    challengeEndDate,
                    targetLimit,
                },
            }
        );

        return {
            success: true,
            challengeStartDate,
            challengeEndDate,
            targetLimit,
        };
    }

    /**
     * Recuse/Dismiss a challenge.
     */
    static async dismissChallenge(userId: string, recommendationId: string): Promise<any> {
        const client = await getMongoClient();
        const db = client.db("financeApp");

        const result = await db.collection("recommendations").updateOne(
            { _id: new ObjectId(recommendationId), userId: new ObjectId(userId) },
            { $set: { status: "DISMISSED" } }
        );

        return { success: result.modifiedCount > 0 };
    }

    /**
     * Reconcile completed or failed challenges for a user.
     * Usually run on login, dashboard load, or daily cron.
     */
    static async reconcileUserChallenges(userId: string): Promise<any> {
        const client = await getMongoClient();
        const db = client.db("financeApp");
        const uId = new ObjectId(userId);

        const now = new Date();

        // Find active challenges whose deadline has passed
        const activeChallenges = await db
            .collection("recommendations")
            .find({
                userId: uId,
                status: "ACTIVE",
                challengeEndDate: { $lte: now },
            })
            .toArray();

        const updates = [];

        for (const challenge of activeChallenges) {
            const startDate = new Date(challenge.challengeStartDate);
            const endDate = new Date(challenge.challengeEndDate);

            // Fetch actual expenses in category during challenge period
            const match = {
                userId: uId,
                tag: challenge.category,
                type: "expense",
                date: {
                    $gte: startDate,
                    $lte: endDate,
                },
            };

            const result = await db
                .collection("transactions")
                .aggregate([
                    { $match: match },
                    { $group: { _id: null, total: { $sum: "$amount" } } },
                ])
                .toArray();

            const actualSpent = result[0]?.total || 0;
            const targetLimit = challenge.targetLimit || 100;

            const isSuccess = actualSpent <= targetLimit;
            const newStatus = isSuccess ? "COMPLETED" : "FAILED";

            updates.push(
                db.collection("recommendations").updateOne(
                    { _id: challenge._id },
                    {
                        $set: {
                            status: newStatus,
                        },
                    }
                )
            );

            // Update user profile ROI totalSaved if success
            if (isSuccess) {
                const savedAmount = challenge.impactEstimate || 50;
                await db.collection("users").updateOne(
                    { _id: uId },
                    { $inc: { totalSavedWithFin: savedAmount } }
                );
            }
        }

        if (updates.length > 0) {
            await Promise.all(updates);
        }

        return { reconciledCount: activeChallenges.length };
    }

    /**
     * Calculate ROI savings.
     */
    static async getUserSavingsROI(userId: string): Promise<{ totalSaved: number; completedCount: number; activeCount: number }> {
        const client = await getMongoClient();
        const db = client.db("financeApp");
        const uId = new ObjectId(userId);

        // Reconcile before reading stats
        await this.reconcileUserChallenges(userId);

        // Sum up impact of completed recommendations
        const completed = await db
            .collection("recommendations")
            .find({ userId: uId, status: "COMPLETED" })
            .toArray();

        const totalSaved = completed.reduce((acc, curr) => acc + (curr.impactEstimate || 0), 0);

        const activeCount = await db
            .collection("recommendations")
            .countDocuments({ userId: uId, status: "ACTIVE" });

        return {
            totalSaved,
            completedCount: completed.length,
            activeCount,
        };
    }
}
