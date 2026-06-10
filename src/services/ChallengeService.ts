import { getMongoClient } from "@/db/connectionDb";
import { ObjectId } from "mongodb";
import { Recommendation } from "@/app/models/Recommendation";
import { IRecommendation } from "@/interfaces/IRecommendation";
import { sendEmail } from "@/app/functions/emails/sendEmail";

export class ChallengeService {
    /**
     * Accept a recommendation and turn it into an active challenge.
     * Also automatically creates a spending goal and sends push + email notifications.
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

        const impactEstimate = recommendation.impactEstimate || 50;
        const targetLimit = Math.max(50, impactEstimate * 2);

        // Update recommendation status
        await db.collection("recommendations").updateOne(
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

        // --- Auto-create a spending goal for this challenge ---
        const goalName = `Desafio: ${recommendation.category || recommendation.title}`;
        const goalResult = await db.collection("goals").insertOne({
            userId: uId,
            name: goalName,
            targetAmount: targetLimit,
            currentAmount: 0,
            tag: recommendation.category || "Outros",
            type: "spending",
            period: "monthly",
            fromChallenge: true,
            challengeId: recId,
            challengeEndDate,
            createdAt: new Date()
        });

        const goalId = goalResult.insertedId.toString();

        // --- Send notifications (fire and forget) ---
        const user = await db.collection("users").findOne({ _id: uId });
        const endDateStr = challengeEndDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

        // Push notification
        import("./NotificationService").then(({ NotificationService }) => {
            const notifier = new NotificationService();
            notifier.sendPush(
                userId,
                "🎯 Desafio Aceito!",
                `Meta "${goalName}" criada com limite de R$ ${targetLimit.toFixed(2)} até ${endDateStr}. O Fin está de olho!`,
                "/",
                [
                    { action: `increase_limit_${goalId}`, title: "Ver Meta", icon: "/logo.png" },
                    { action: "speak_fin", title: "🎙️ Falar com Fin", icon: "/logo.png" }
                ]
            ).catch(e => console.error("[ChallengeService] Push error:", e));
        });

        // Email notification
        if (user?.email) {
            const emailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
                <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
                    <div style="font-size: 48px;">🎯</div>
                    <h2 style="color: white; margin: 8px 0 0; font-size: 24px;">Desafio Aceito!</h2>
                    <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">Uma meta foi criada automaticamente para você</p>
                </div>
                <div style="background: white; padding: 32px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                    <p>Olá, <strong>${user.name || "usuário"}</strong>!</p>
                    <p>Você aceitou o desafio <strong>"${recommendation.title}"</strong>. Para te ajudar a acompanhar o progresso, criamos automaticamente uma meta de gasto para você.</p>
                    
                    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <h3 style="margin: 0 0 12px; color: #059669;">📌 ${goalName}</h3>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>Limite de gasto:</span>
                            <strong>R$ ${targetLimit.toFixed(2)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>Categoria:</span>
                            <strong>${recommendation.category || "Geral"}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>Prazo:</span>
                            <strong>Até ${endDateStr} (7 dias)</strong>
                        </div>
                    </div>

                    <p><strong>Dica do Fin:</strong> ${recommendation.actionableStep || "Fique de olho nos seus gastos diários e use o Fin para registrar rapidamente pelo celular."}</p>
                    
                    <p>O Fin vai monitorar seus gastos e te avisar quando você estiver se aproximando do limite! 👀</p>

                    <div style="text-align: center; margin-top: 24px;">
                        <a href="https://finance-pro-mu.vercel.app/?startVoice=true"
                           style="background: #059669; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                            🎙️ Falar com Fin
                        </a>
                    </div>
                </div>
            </div>`;

            sendEmail({
                to: user.email,
                subject: `🎯 Desafio aceito! Meta "${goalName}" criada`,
                htmlContent: emailHtml
            }).catch(e => console.error("[ChallengeService] Email error:", e));
        }

        return {
            success: true,
            challengeStartDate,
            challengeEndDate,
            targetLimit,
            goalId,
            goalName
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
