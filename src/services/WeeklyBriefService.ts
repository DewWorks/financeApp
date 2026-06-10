import { getMongoClient } from "@/db/connectionDb";
import { ObjectId } from "mongodb";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { sendEmail } from "@/app/functions/emails/sendEmail";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export class WeeklyBriefService {
    /**
     * Generate and send a personalized weekly brief for a user.
     * Uses Gemini to write the summary in natural Brazilian Portuguese.
     */
    static async generateForUser(userId: string): Promise<{ sent: boolean }> {
        const client = await getMongoClient();
        const db = client.db("financeApp");

        const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
        if (!user?.email) return { sent: false };

        const now = new Date();
        const startThisWeek = new Date(now);
        startThisWeek.setDate(now.getDate() - now.getDay());
        startThisWeek.setHours(0, 0, 0, 0);

        const startLastWeek = new Date(startThisWeek);
        startLastWeek.setDate(startLastWeek.getDate() - 7);

        const [txThisWeek, txLastWeek, goals] = await Promise.all([
            db.collection("transactions").aggregate([
                {
                    $match: {
                        userId: new ObjectId(userId),
                        type: "expense",
                        date: { $gte: startThisWeek }
                    }
                },
                {
                    $facet: {
                        total: [{ $group: { _id: null, sum: { $sum: "$amount" } } }],
                        byCategory: [{ $group: { _id: "$tag", sum: { $sum: "$amount" } } }, { $sort: { sum: -1 } }]
                    }
                }
            ]).toArray(),
            db.collection("transactions").aggregate([
                {
                    $match: {
                        userId: new ObjectId(userId),
                        type: "expense",
                        date: { $gte: startLastWeek, $lt: startThisWeek }
                    }
                },
                { $group: { _id: null, sum: { $sum: "$amount" } } }
            ]).toArray(),
            db.collection("goals").find({ userId: new ObjectId(userId) }).limit(3).toArray()
        ]);

        const thisWeekTotal = txThisWeek[0]?.total[0]?.sum || 0;
        const lastWeekTotal = txLastWeek[0]?.sum || 0;
        const topCategory = txThisWeek[0]?.byCategory[0];
        const diff = thisWeekTotal - lastWeekTotal;
        const diffPct = lastWeekTotal > 0 ? ((diff / lastWeekTotal) * 100).toFixed(0) : "0";

        // Build AI context
        const context = {
            userName: user.name || "usuário",
            thisWeekTotal: thisWeekTotal.toFixed(2),
            lastWeekTotal: lastWeekTotal.toFixed(2),
            diffPct,
            topCategory: topCategory?._id || "Outros",
            topCategoryAmount: topCategory?.sum?.toFixed(2) || "0",
            goalsCount: goals.length,
            goalsSummary: goals.map(g => `${g.name}: ${((g.currentAmount / g.targetAmount) * 100).toFixed(0)}%`).join(", ")
        };

        const prompt = `
Você é o Fin, assistente financeiro do FinancePro. 
Escreva um resumo semanal amigável para ${context.userName} em 3-4 frases naturais, sem markdown, sem asteriscos.
Use os dados abaixo como base. Tom: empático, motivacional, com 1 dado concreto.

Dados da semana:
- Total gasto: R$ ${context.thisWeekTotal}
- Semana passada: R$ ${context.lastWeekTotal}
- Variação: ${diff >= 0 ? "+" : ""}${context.diffPct}%
- Maior gasto: ${context.topCategory} (R$ ${context.topCategoryAmount})
- Metas ativas: ${context.goalsCount} (${context.goalsSummary || "nenhuma"})

Retorne APENAS o texto do resumo, sem títulos.`;

        let briefText = `Esta semana você gastou R$ ${thisWeekTotal.toFixed(2)}, ${diff < 0 ? `uma redução de ${Math.abs(parseInt(diffPct))}%` : `um aumento de ${diffPct}%`} em relação à semana passada. Seu maior gasto foi em ${topCategory?._id || "Outros"} com R$ ${(topCategory?.sum || 0).toFixed(2)}.`;

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const res = await model.generateContent(prompt);
            const generated = res.response.text().trim().replace(/\*\*/g, "").replace(/\*/g, "");
            if (generated.length > 20) briefText = generated;
        } catch { /* Use fallback */ }

        // Send Push
        try {
            const { NotificationService } = await import("./NotificationService");
            const notifier = new NotificationService();
            await notifier.sendPush(
                userId,
                "📋 Seu Resumo Semanal chegou!",
                `${briefText.substring(0, 100)}...`,
                "/",
                [{ action: "speak_fin", title: "🎙️ Falar com Fin", icon: "/logo.png" }]
            );
        } catch { /* Non-critical */ }

        // Send Email
        const weekStart = startThisWeek.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        const weekEnd = now.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        const trendColor = diff < 0 ? "#22c55e" : "#ef4444";
        const trendIcon = diff < 0 ? "📉" : "📈";
        const trendLabel = diff < 0 ? `Reduziu ${Math.abs(parseInt(diffPct))}%` : `Aumentou ${diffPct}%`;

        const goalsHtml = goals.length > 0
            ? goals.map(g => {
                const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
                return `
                    <div style="margin-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 4px;">
                            <span>${g.name}</span><span>${pct}%</span>
                        </div>
                        <div style="background: #e5e7eb; border-radius: 4px; height: 6px;">
                            <div style="background: #e11d48; width: ${pct}%; height: 6px; border-radius: 4px;"></div>
                        </div>
                    </div>`;
            }).join("")
            : "<p style='color: #9ca3af; font-size: 14px;'>Nenhuma meta ativa.</p>";

        const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
            <div style="background: linear-gradient(135deg, #1e1b4b 0%, #7c3aed 100%); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
                <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 14px;">📋 Resumo Semanal</p>
                <h2 style="color: white; margin: 8px 0 0; font-size: 24px;">${weekStart} — ${weekEnd}</h2>
            </div>
            <div style="background: white; padding: 32px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                <p>Olá, <strong>${user.name || "usuário"}</strong>! ${briefText}</p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0;">
                    <div style="background: #f9fafb; border-radius: 8px; padding: 16px; text-align: center;">
                        <p style="margin: 0; font-size: 13px; color: #6b7280;">Total da Semana</p>
                        <p style="margin: 4px 0 0; font-size: 22px; font-weight: bold;">R$ ${thisWeekTotal.toFixed(2)}</p>
                    </div>
                    <div style="background: #f9fafb; border-radius: 8px; padding: 16px; text-align: center;">
                        <p style="margin: 0; font-size: 13px; color: #6b7280;">Vs. Semana Passada</p>
                        <p style="margin: 4px 0 0; font-size: 22px; font-weight: bold; color: ${trendColor};">${trendIcon} ${trendLabel}</p>
                    </div>
                </div>
                
                <h3 style="font-size: 16px; margin-bottom: 8px;">Maior Categoria</h3>
                <p style="background: #fef2f2; padding: 12px; border-radius: 8px; margin: 0;">
                    <strong>${topCategory?._id || "—"}</strong>: R$ ${(topCategory?.sum || 0).toFixed(2)}
                </p>
                
                <h3 style="font-size: 16px; margin: 20px 0 8px;">Progresso de Metas</h3>
                ${goalsHtml}
                
                <div style="text-align: center; margin-top: 24px;">
                    <a href="https://finance-pro-mu.vercel.app/?startVoice=true"
                       style="background: #7c3aed; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                        🎙️ Conversar com Fin
                    </a>
                </div>
            </div>
        </div>`;

        try {
            await sendEmail({
                to: user.email,
                subject: `📋 Resumo Semanal FinancePro (${weekStart}–${weekEnd})`,
                htmlContent: emailHtml
            });
        } catch (e) {
            console.error("[WeeklyBrief] Email error:", e);
            return { sent: false };
        }

        return { sent: true };
    }
}
