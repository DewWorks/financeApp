import { InsightService, InsightItem } from "./InsightService";
import { sendEmail } from "@/app/functions/emails/sendEmail";
import { getMongoClient } from "@/db/connectionDb";
import { ObjectId } from "mongodb";

export class NotificationService {
    private insightService: InsightService;

    constructor() {
        this.insightService = new InsightService();
    }

    /**
     * Checks for relevant insights and sends email alerts if necessary.
     * Uses throttling to avoid spam (1 alert per type per 24h).
     */
    async checkAndSendAlerts(userId: string) {
        try {
            console.log(`[NotificationService] Checking alerts for user ${userId}...`);

            // 1. Generate Deep Insights
            const result = await this.insightService.generateDailyInsight(userId, undefined, 'all');
            const insights = result.insights;

            // 2. Filter High-Priority Insights
            const alerts = insights.filter(i => {
                // Critical Budget / Anomaly
                if (i.type === 'category' && i.trend === 'negative' && (i.id.startsWith('anomaly-') || i.id.startsWith('budget-exceeded'))) return true;
                // Positive Reinforcement (Zero Spend)
                if (i.type === 'zero_spend') return true;
                // Weekly Review (only if significant drop/rise)
                if (i.type === 'weekly' && (i.id === 'weekly-rise' || i.id === 'weekly-drop')) return true;

                return false;
            });

            if (alerts.length === 0) {
                console.log(`[NotificationService] No high-priority alerts found.`);
                return;
            }

            // 3. Connect DB for Throttling Check
            const client = await getMongoClient();
            const db = client.db('financeApp');
            const notificationsCol = db.collection('notifications');
            const usersCol = db.collection('users');

            // 4. Get User Email
            const user = await usersCol.findOne({ _id: new ObjectId(userId) });
            if (!user || !user.email) {
                console.warn(`[NotificationService] User ${userId} has no email.`);
                return;
            }

            // 5. Throttling Loop (WEEKLY LIMIT)
            const THROTTLE_DAYS = 7;
            const throttleDate = new Date(Date.now() - THROTTLE_DAYS * 24 * 60 * 60 * 1000);

            for (const alert of alerts) {
                // Check if sent in last 7 days
                const lastSent = await notificationsCol.findOne({
                    userId: new ObjectId(userId),
                    insightId: alert.id,
                    sentAt: { $gt: throttleDate }
                });

                if (lastSent) {
                    console.log(`[NotificationService] Alert ${alert.id} throttled (already sent in last ${THROTTLE_DAYS} days).`);
                    continue;
                }

                // 6. Send Email
                console.log(`[NotificationService] Sending alert ${alert.id} to ${user.email}`);
                const emailHtml = this.buildAlertHtml(alert, user.name || "Usuário");

                await sendEmail({
                    to: user.email,
                    subject: `FinancePro: ${alert.text}`,
                    htmlContent: emailHtml
                });

                // 7. Log Notification
                await notificationsCol.updateOne(
                    { userId: new ObjectId(userId), insightId: alert.id },
                    {
                        $set: {
                            userId: new ObjectId(userId),
                            insightId: alert.id,
                            type: alert.type,
                            sentAt: new Date()
                        }
                    },
                    { upsert: true }
                );
            }

        } catch (error) {
            console.error("[NotificationService] Error:", error);
        }
    }

    private buildAlertHtml(item: InsightItem, userName: string): string {
        const color = item.trend === 'negative' ? '#e11d48' : // red-600
            item.trend === 'positive' ? '#16a34a' : // green-600
                '#2563eb'; // blue-600

        const icon = item.trend === 'negative' ? '⚠️' :
            item.trend === 'positive' ? '🎉' : 'ℹ️';

        return `
            <div style="font-family: sans-serif; color: #333;">
                <h2 style="color: ${color}; margin-top: 0;">${icon} ${item.text}</h2>
                <p>Olá, <strong>${userName}</strong>!</p>
                <p>Identificamos algo importante nas suas finanças:</p>
                
                <div style="background-color: #f9fafb; border-left: 4px solid ${color}; padding: 15px; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0; font-size: 24px;">${item.value}</h3>
                    <p style="margin: 0; font-size: 16px;">${item.details}</p>
                </div>

                ${item.recommendation ? `
                <p style="margin-top: 20px;">
                    <strong>Dica FinancePro:</strong><br/>
                    ${item.recommendation}
                </p>
                ` : ''}

                <div style="margin-top: 30px; text-align: center;">
                    <a href="https://finance-pro-mu.vercel.app/" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        detalhes
                    </a>
                </div>
            </div>
        `;
    }

    async sendUpsellEmail(userId: string, planType: "PRO" | "MAX") {
        try {
            const client = await getMongoClient();
            const db = client.db('financeApp');
            const notificationsCol = db.collection('notifications');
            const insightId = `upsell-${planType.toLowerCase()}`;

            // 1. "ONCE EVER" Throttling Check
            const alreadySent = await notificationsCol.findOne({
                userId: new ObjectId(userId),
                insightId: insightId
            });

            if (alreadySent) {
                // console.log(`[NotificationService] Upsell email for ${planType} already sent to user ${userId}. Skipping.`);
                return;
            }

            // 2. Get User Email
            const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
            if (!user || !user.email) return;

            console.log(`[NotificationService] Sending Upsell Email (${planType}) to ${user.email}`);

            // 3. Email Content
            const subject = `🚀 Descubra o poder do FinancePro ${planType}`;
            const html = `
                <div style="font-family: sans-serif; color: #333;">
                    <h2 style="color: #2563eb;">Desbloqueie todo o seu potencial financeiro!</h2>
                    <p>Olá, <strong>${user.name || "Investidor"}</strong>!</p>
                    <p>Você tentou acessar uma funcionalidade exclusiva do <strong>Plano ${planType}</strong>.</p>
                    <p>Imagine ter controle total com:</p>
                    <ul style="background-color: #f0f9ff; padding: 20px; border-radius: 8px;">
                        ${planType === 'MAX' ?
                    '<li>🤖 <strong>IA Avançada:</strong> Análise de anomalias e projeção de gastos.</li><li>🏦 <strong>Sincronização Bancária:</strong> Conecte suas contas automaticamente.</li>'
                    :
                    '<li>📊 <strong>Sem Limites:</strong> Registre quantas transações quiser.</li><li>💬 <strong>WhatsApp Bot:</strong> Lance gastos direto pelo Zap.</li>'}
                    </ul>
                    <p>Não deixe para depois. Assuma o controle agora.</p>
                    <div style="margin-top: 30px; text-align: center;">
                        <a href="https://finance-pro-mu.vercel.app/pricing" style="background-color: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                            Saiba mais
                        </a>
                    </div>
                </div>
            `;

            await sendEmail({ to: user.email, subject, htmlContent: html });

            // 4. Log to prevent sending again
            await notificationsCol.insertOne({
                userId: new ObjectId(userId),
                insightId: insightId,
                type: 'upsell',
                sentAt: new Date()
            });

        } catch (error) {
            console.error("[NotificationService] Upsell Error:", error);
        }
    }
}
