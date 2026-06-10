import { getMongoClient } from "@/db/connectionDb";
import { ObjectId } from "mongodb";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { sendEmail } from "@/app/functions/emails/sendEmail";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export class AutonomousAgentService {
    /**
     * Runs the autonomous daily analysis for a single user.
     * Compares this week vs last week spending by category,
     * finds the biggest deviation, generates a personalized insight via Gemini,
     * and sends push + email if relevant.
     */
    static async runForUser(userId: string): Promise<{ sent: boolean; reason?: string }> {
        const client = await getMongoClient();
        const db = client.db("financeApp");

        const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
        if (!user?.email) return { sent: false, reason: "no_email" };

        // --- Throttle: max 1 autonomous insight per user per day ---
        const THROTTLE_TYPE = "autonomous-insight";
        const throttleDate = new Date();
        throttleDate.setHours(0, 0, 0, 0); // start of today

        const alreadySent = await db.collection("notifications").findOne({
            userId: new ObjectId(userId),
            insightId: THROTTLE_TYPE,
            sentAt: { $gte: throttleDate }
        });
        if (alreadySent) return { sent: false, reason: "throttled" };

        // --- Aggregate spending for this week and last week ---
        const now = new Date();
        const startThisWeek = new Date(now);
        startThisWeek.setDate(now.getDate() - now.getDay()); // Sunday
        startThisWeek.setHours(0, 0, 0, 0);

        const startLastWeek = new Date(startThisWeek);
        startLastWeek.setDate(startLastWeek.getDate() - 7);

        const [thisWeekData, lastWeekData] = await Promise.all([
            db.collection("transactions").aggregate([
                { $match: { userId: new ObjectId(userId), type: "expense", date: { $gte: startThisWeek } } },
                { $group: { _id: "$tag", total: { $sum: "$amount" } } }
            ]).toArray(),
            db.collection("transactions").aggregate([
                { $match: { userId: new ObjectId(userId), type: "expense", date: { $gte: startLastWeek, $lt: startThisWeek } } },
                { $group: { _id: "$tag", total: { $sum: "$amount" } } }
            ]).toArray()
        ]);

        const thisWeekMap = new Map(thisWeekData.map(r => [r._id, r.total]));
        const lastWeekMap = new Map(lastWeekData.map(r => [r._id, r.total]));

        // Find categories with biggest relative increase
        let biggestDeviation: { category: string; thisWeek: number; lastWeek: number; pct: number } | null = null;

        for (const [cat, thisTotal] of thisWeekMap.entries()) {
            const lastTotal = lastWeekMap.get(cat) || 0;
            if (lastTotal === 0 || thisTotal < 50) continue; // Skip tiny or new categories
            const pct = ((thisTotal - lastTotal) / lastTotal) * 100;
            if (pct > 30 && (!biggestDeviation || pct > biggestDeviation.pct)) {
                biggestDeviation = { category: cat, thisWeek: thisTotal, lastWeek: lastTotal, pct };
            }
        }

        if (!biggestDeviation) return { sent: false, reason: "no_significant_deviation" };

        // Also fetch spending patterns for personalization
        const patterns = (user as any).spendingPatterns;
        const peakDayMsg = patterns?.peakDayName
            ? ` Seus dias de maior gasto costumam ser nas ${patterns.peakDayName}s.`
            : "";

        // --- Generate personalized insight text with Gemini ---
        const prompt = `
Você é o Fin, um assistente financeiro brasileiro amigável e direto.
Gere uma mensagem push de alerta financeiro em 2 frases (máximo 120 caracteres no total).
Tom: empático, sem julgamentos, com um dado concreto.

Dados:
- Categoria: ${biggestDeviation.category}
- Gasto essa semana: R$ ${biggestDeviation.thisWeek.toFixed(2)}
- Gasto semana passada: R$ ${biggestDeviation.lastWeek.toFixed(2)}
- Aumento: ${biggestDeviation.pct.toFixed(0)}%
${peakDayMsg}

Retorne APENAS o texto da mensagem, sem aspas, sem prefixos.`;

        let insightText = `Seus gastos em ${biggestDeviation.category} aumentaram ${biggestDeviation.pct.toFixed(0)}% essa semana (R$ ${biggestDeviation.thisWeek.toFixed(2)} vs R$ ${biggestDeviation.lastWeek.toFixed(2)} na semana passada).`;

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const res = await model.generateContent(prompt);
            const generated = res.response.text().trim();
            if (generated.length > 10) insightText = generated;
        } catch {
            // Use fallback text
        }

        // --- Send Push Notification ---
        try {
            const { NotificationService } = await import("./NotificationService");
            const notifier = new NotificationService();
            await notifier.sendPush(
                userId,
                "📊 Fin detectou algo",
                insightText,
                "/",
                [{ action: "speak_fin", title: "🎙️ Falar com Fin", icon: "/logo.png" }]
            );
        } catch (e) {
            console.error("[AutonomousAgent] Push failed:", e);
        }

        // --- Send Email ---
        const emailHtml = `
            <div style="font-family: sans-serif; color: #1a1a2e; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #e11d48 0%, #7c3aed 100%); padding: 32px; border-radius: 12px 12px 0 0;">
                    <h2 style="color: white; margin: 0; font-size: 22px;">📊 Fin Detectou Algo</h2>
                    <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">Análise semanal automática</p>
                </div>
                <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
                    <p>Olá, <strong>${user.name || "usuário"}</strong>!</p>
                    <p>${insightText}</p>
                    
                    <div style="background: #fef2f2; border-left: 4px solid #e11d48; padding: 16px; border-radius: 8px; margin: 20px 0;">
                        <strong>Categoria:</strong> ${biggestDeviation.category}<br>
                        <strong>Essa semana:</strong> R$ ${biggestDeviation.thisWeek.toFixed(2)}<br>
                        <strong>Semana passada:</strong> R$ ${biggestDeviation.lastWeek.toFixed(2)}<br>
                        <strong>Variação:</strong> +${biggestDeviation.pct.toFixed(0)}%
                    </div>

                    <div style="text-align: center; margin-top: 24px;">
                        <a href="https://finance-pro-mu.vercel.app/?startVoice=true" 
                           style="background: #e11d48; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                            🎙️ Falar com o Fin
                        </a>
                    </div>
                    <p style="font-size: 12px; color: #9ca3af; margin-top: 24px; text-align: center;">
                        Você recebe esse alerta porque ativou notificações inteligentes do FinancePro.
                    </p>
                </div>
            </div>`;

        try {
            await sendEmail({
                to: user.email,
                subject: `📊 Fin detectou: seus gastos em ${biggestDeviation.category} subiram ${biggestDeviation.pct.toFixed(0)}%`,
                htmlContent: emailHtml
            });
        } catch (e) {
            console.error("[AutonomousAgent] Email failed:", e);
        }

        // --- Log to prevent spam ---
        await db.collection("notifications").updateOne(
            { userId: new ObjectId(userId), insightId: THROTTLE_TYPE },
            { $set: { userId: new ObjectId(userId), insightId: THROTTLE_TYPE, type: "autonomous", sentAt: new Date() } },
            { upsert: true }
        );

        return { sent: true };
    }
}
