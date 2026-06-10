import { getMongoClient } from "@/db/connectionDb";
import { ObjectId } from "mongodb";
import { sendEmail } from "@/app/functions/emails/sendEmail";

const THRESHOLDS = [0.5, 0.75, 0.9]; // 50%, 75%, 90%

export class BudgetGuardianService {
    /**
     * Check if a new expense causes a budget threshold to be crossed for a spending goal.
     * Called after every transaction addition.
     * Sends push + email alert when a threshold is first crossed (once per threshold per month).
     */
    static async checkThresholds(userId: string, tag: string, newAmount: number): Promise<void> {
        try {
            const client = await getMongoClient();
            const db = client.db("financeApp");

            // Find spending goals for this category
            const goals = await db.collection("goals").find({
                userId: new ObjectId(userId),
                type: "spending",
                tag: tag
            }).toArray();

            if (goals.length === 0) return;

            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            // Recalculate current total for this tag this month
            const totalResult = await db.collection("transactions").aggregate([
                {
                    $match: {
                        userId: new ObjectId(userId),
                        type: "expense",
                        tag: tag,
                        date: { $gte: startOfMonth },
                        recurring: { $ne: true }
                    }
                },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]).toArray();

            const currentTotal = totalResult[0]?.total || 0;

            for (const goal of goals) {
                if (!goal.targetAmount || goal.targetAmount === 0) continue;
                const ratio = currentTotal / goal.targetAmount;

                for (const threshold of THRESHOLDS) {
                    if (ratio < threshold) continue;

                    // Check if we already sent this threshold alert this month
                    const alertKey = `guardian-${goal._id.toString()}-${Math.round(threshold * 100)}`;
                    const alreadySent = await db.collection("notifications").findOne({
                        userId: new ObjectId(userId),
                        insightId: alertKey,
                        sentAt: { $gte: startOfMonth }
                    });
                    if (alreadySent) continue;

                    // Send alert
                    const pct = Math.round(threshold * 100);
                    const remaining = Math.max(0, goal.targetAmount - currentTotal).toFixed(2);
                    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });

                    const pushBody = `🛡️ Guardião: ${pct}% do orçamento de ${tag} usado (R$ ${currentTotal.toFixed(2)} / R$ ${goal.targetAmount.toFixed(2)}). Faltam R$ ${remaining}.`;

                    // Push
                    const { NotificationService } = await import("./NotificationService");
                    const notifier = new NotificationService();
                    await notifier.sendPush(
                        userId,
                        `🛡️ Alerta de Orçamento: ${tag}`,
                        pushBody,
                        "/",
                        [
                            { action: `increase_limit_${goal._id.toString()}`, title: "Aumentar R$ 100", icon: "/logo.png" },
                            { action: "speak_fin", title: "🎙️ Falar com Fin", icon: "/logo.png" }
                        ]
                    );

                    // Email
                    if (user?.email) {
                        const statusColor = pct >= 90 ? "#ef4444" : pct >= 75 ? "#f97316" : "#eab308";
                        const emailHtml = `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                            <div style="background: ${statusColor}; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
                                <h2 style="color: white; margin: 0;">🛡️ Alerta do Guardião Financeiro</h2>
                            </div>
                            <div style="background: white; padding: 28px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                                <p>Olá, <strong>${user.name || "usuário"}</strong>!</p>
                                <p>Você atingiu <strong>${pct}% do orçamento</strong> de <strong>${tag}</strong> este mês.</p>
                                
                                <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                        <span>Gasto atual:</span><strong>R$ ${currentTotal.toFixed(2)}</strong>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                        <span>Limite:</span><strong>R$ ${goal.targetAmount.toFixed(2)}</strong>
                                    </div>
                                    <div style="display: flex; justify-content: space-between;">
                                        <span>Disponível:</span><strong style="color: ${statusColor}">R$ ${remaining}</strong>
                                    </div>
                                    <div style="background: #e5e7eb; border-radius: 4px; height: 8px; margin-top: 12px;">
                                        <div style="background: ${statusColor}; width: ${Math.min(pct, 100)}%; height: 8px; border-radius: 4px;"></div>
                                    </div>
                                </div>
                                
                                <div style="text-align: center; margin-top: 20px;">
                                    <a href="https://finance-pro-mu.vercel.app/?startVoice=true"
                                       style="background: #e11d48; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                                        Falar com Fin
                                    </a>
                                </div>
                            </div>
                        </div>`;

                        await sendEmail({
                            to: user.email,
                            subject: `🛡️ ${pct}% do orçamento de ${tag} atingido`,
                            htmlContent: emailHtml
                        });
                    }

                    // Log to prevent re-sending this threshold this month
                    await db.collection("notifications").updateOne(
                        { userId: new ObjectId(userId), insightId: alertKey },
                        { $set: { userId: new ObjectId(userId), insightId: alertKey, type: "guardian", sentAt: new Date() } },
                        { upsert: true }
                    );

                    break; // Only fire the highest threshold alert
                }
            }
        } catch (error) {
            console.error("[BudgetGuardianService] Error:", error);
        }
    }
}
