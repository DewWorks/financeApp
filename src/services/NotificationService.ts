import { InsightService, InsightItem } from "./InsightService";
import { sendEmail } from "@/app/functions/emails/sendEmail";
import { getMongoClient } from "@/db/connectionDb";
import { ObjectId } from "mongodb";
import webPush from "web-push";

export class NotificationService {
    private insightService: InsightService;

    constructor() {
        this.insightService = new InsightService();
    }

    async sendPush(userId: string, title: string, body: string, url: string = "/", actions?: any[]) {
        try {
            const client = await getMongoClient();
            const db = client.db('financeApp');
            const subscriptions = await db.collection("push_subscriptions").find({
                userId: new ObjectId(userId)
            }).toArray();

            if (subscriptions.length === 0) return;

            const cleanBody = body.replace(/\*\*/g, "");

            const payload = JSON.stringify({
                title,
                body: cleanBody,
                url,
                actions
            });

            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
            const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
            const vapidEmailRaw = process.env.VAPID_EMAIL || "mailto:suporte@financepro.com";
            const vapidEmail = vapidEmailRaw.startsWith("mailto:") || vapidEmailRaw.startsWith("https:") 
                ? vapidEmailRaw 
                : `mailto:${vapidEmailRaw}`;

            if (vapidPublicKey && vapidPrivateKey) {
                webPush.setVapidDetails(
                    vapidEmail,
                    vapidPublicKey,
                    vapidPrivateKey
                );
            }

            for (const subDoc of subscriptions) {
                try {
                    await webPush.sendNotification(subDoc.subscription, payload);
                } catch (err: any) {
                    console.error("[NotificationService] Push failed for endpoint:", subDoc.subscription.endpoint, err);
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        await db.collection("push_subscriptions").deleteOne({ _id: subDoc._id });
                    }
                }
            }
        } catch (error) {
            console.error("[NotificationService] sendPush error:", error);
        }
    }

    /**
     * Checks for relevant insights and sends email alerts if necessary.
     * Uses throttling to avoid spam (1 alert per type per 24h).
     */
    async checkAndSendAlerts(userId: string) {
        try {
            console.log(`[NotificationService] Checking alerts for user ${userId}...`);

            // 1. Connect DB (Moved to top for Goal Check access)
            const client = await getMongoClient();
            const db = client.db('financeApp');
            const notificationsCol = db.collection('notifications');
            const usersCol = db.collection('users');

            // 2. Generate Deep Insights
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

            // 2b. Check Goals (Positive Reinforcement)
            try {
                const goals = await db.collection("goals").find({ userId: new ObjectId(userId), type: 'savings' }).toArray();

                // We need to calculate saved amount for each goal.
                // Assuming 'tag' maps to category or simple accumulation.
                // For simplicity in this iteration: Check if 'currentAmount' (manually updated) >= 'targetAmount'.
                // Ideally this would aggregate 'income' - 'expense' for that tag. 
                // Let's assume the user manually updates the 'currentAmount' on the Goal in the UI, OR we calculate it.
                // Given the complexities of auto-calculating savings per tag, let's rely on 'currentAmount' field if present, 
                // OR calculate balance for that tag.

                // Let's calculate balance for the tag (Income - Expense for that tag)
                const transactions = await db.collection("transactions").find({ userId: new ObjectId(userId) }).toArray();

                for (const goal of goals) {
                    if (!goal.targetAmount) continue;
                    const tag = goal.tag || goal.category;

                    // Simple Balance Calculation for Tag
                    const tagIncome = transactions
                        .filter(t => t.type === 'income' && (t.tag === tag || t.category === tag))
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

                    // If it's a "Savings Goal", maybe we don't subtract expenses? 
                    // Usually Savings means "I put money aside".
                    // Let's use Balance (Income - Expense) for that Tag.
                    const tagExpense = transactions
                        .filter(t => t.type === 'expense' && (t.tag === tag || t.category === tag))
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

                    const currentBalance = tagIncome - tagExpense; // For a savings goal, usually we treat transfers/incomes as +

                    if (currentBalance >= goal.targetAmount) {
                        // Check if already notified
                        const alertId = `goal-met-${goal._id}`;
                        const alreadySent = await notificationsCol.findOne({ insightId: alertId });

                        if (!alreadySent) {
                            alerts.push({
                                id: alertId,
                                type: 'goal',
                                text: `Meta Atingida: ${goal.title || tag}`,
                                value: `R$ ${currentBalance.toFixed(0)}`,
                                trend: 'positive',
                                details: `Você atingiu sua meta de R$ ${goal.targetAmount}!`
                            });
                        }
                    }
                }
            } catch (err) {
                console.error("[NotificationService] Goal Check Error:", err);
            }

            if (alerts.length === 0) {
                console.log(`[NotificationService] No high-priority alerts found.`);
                return;
            }



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
                // Special handling for Goals (One Time Only, maintained by checking DB above, but safe to double check)
                if (alert.type === 'goal') {
                    await this.sendGoalMetAlert(userId, alert.text, alert.value);
                    continue; // sendGoalMetAlert handles its own logging
                }

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

                // ALSO SEND PUSH NOTIFICATION
                let actions: any[] = [];
                if (alert.id.startsWith('budget-exceeded-') || alert.id.startsWith('budget-warning-')) {
                    const goalId = alert.id.replace('budget-exceeded-', '').replace('budget-warning-', '');
                    actions = [
                        { action: `increase_limit_${goalId}`, title: 'Aumentar R$ 100', icon: '/logo.png' }
                    ];
                }
                await this.sendPush(userId, `Alerta: ${alert.text}`, alert.details || "", "/", actions);

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

    async sendWelcomeEmail(user: { name: string; email: string }) {
        try {
            console.log(`[NotificationService] Sending Welcome Email to ${user.email}`);
            const subject = `Bem-vindo ao FinancePro, ${user.name}! 🚀`;
            const html = `
                <div style="font-family: sans-serif; color: #333;">
                    <h2 style="color: #2563eb;">Sua jornada para a liberdade financeira começa agora!</h2>
                    <p>Olá, <strong>${user.name}</strong>!</p>
                    <p>Estamos muito felizes em ter você conosco. O FinancePro foi criado para descomplicar sua vida financeira.</p>
                    
                    <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">Primeiros Passos:</h3>
                        <ul style="padding-left: 20px;">
                            <li style="margin-bottom: 10px;">🏦 <strong>Conecta seu Banco:</strong> (Plano Max) Para não digitar nada nunca mais.</li>
                            <li style="margin-bottom: 10px;">💬 <strong>Chama no Zap:</strong> Adicione nosso bot e mande mensagens: "Gastei 50 no mercado".</li>
                            <li style="margin-bottom: 10px;">🎯 <strong>Defina Metas:</strong> Diga ao sistema quanto quer economizar.</li>
                        </ul>
                    </div>

                    <p>Se precisar de algo, é só chamar.</p>
                    
                    <div style="margin-top: 30px; text-align: center;">
                        <a href="https://finance-pro-mu.vercel.app/" style="background-color: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Acessar Dashboard
                        </a>
                    </div>
                </div>
            `;
            await sendEmail({ to: user.email, subject, htmlContent: html });
        } catch (error) {
            console.error("[NotificationService] Welcome Email Error:", error);
        }
    }

    async sendWeeklyDigest(userId: string) {
        try {
            const client = await getMongoClient();
            const db = client.db('financeApp');
            const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
            if (!user || !user.email) return;

            // Generate Insight Data
            const insights = await this.insightService.generateDailyInsight(userId);
            // Fix: Use the direct weekly summary logic we added to InsightService
            const rawWeekTotal = insights.weeklySummary?.total || 0;
            const weekTotal = rawWeekTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            const topCategory = insights.insights.find(i => i.type === 'category' && i.trend === 'neutral')?.text || "Várias";

            console.log(`[NotificationService] Sending Weekly Digest to ${user.email}`);

            const subject = `📊 Seu Resumo Semanal FinancePro`;
            const html = `
                <div style="font-family: sans-serif; color: #333;">
                    <h2 style="color: #2563eb;">Como foi sua semana?</h2>
                    <p>Olá, <strong>${user.name}</strong>!</p>
                    <p>Aqui está o resumo das suas finanças nos últimos 7 dias:</p>

                    <div style="display: flex; gap: 20px; margin: 20px 0;">
                        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; flex: 1;">
                            <div style="font-size: 12px; color: #666;">Gastos da Semana</div>
                            <div style="font-size: 20px; font-weight: bold; color: #111;">${weekTotal}</div>
                        </div>
                        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; flex: 1;">
                            <div style="font-size: 12px; color: #666;">Destaque</div>
                            <div style="font-size: 16px; font-weight: bold; color: #111;">${topCategory}</div>
                        </div>
                    </div>

                    <p>Acesse o app para ver os gráficos detalhados e ajustar suas metas.</p>

                    <div style="margin-top: 30px; text-align: center;">
                        <a href="https://finance-pro-mu.vercel.app/" style="background-color: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Detalhes
                        </a>
                    </div>
                </div>
            `;
            await sendEmail({ to: user.email, subject, htmlContent: html });

            // ALSO SEND PUSH
            await this.sendPush(
                userId, 
                "📊 Resumo Semanal FinancePro", 
                `Gastos da semana: ${weekTotal}. Veja seu resumo detalhado e ajuste suas metas!`
            );

        } catch (error) {
            console.error("[NotificationService] Weekly Digest Error:", error);
        }
    }

    async sendInactivityReminder(userId: string) {
        try {
            const client = await getMongoClient();
            const db = client.db('financeApp');
            const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
            if (!user || !user.email) return;

            console.log(`[NotificationService] Sending Inactivity Reminder to ${user.email}`);

            const subject = `🥺 Suas finanças sentem sua falta...`;
            const html = `
                <div style="font-family: sans-serif; color: #333;">
                    <h2 style="color: #e11d48;">Tudo bem por aí?</h2>
                    <p>Olá, <strong>${user.name}</strong>!</p>
                    <p>Faz um tempinho que não vemos movimentações na sua conta.</p>
                    <p>Para manter o controle financeiro, a consistência é chave. Que tal registrar os gastos da semana hoje?</p>
                    
                    <p>Lembre-se: Você pode registrar gastos enviando uma mensagem no WhatsApp! 🎙️</p>

                    <div style="margin-top: 30px; text-align: center;">
                        <a href="https://finance-pro-mu.vercel.app/" style="background-color: #e11d48; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Voltar para o App
                        </a>
                    </div>
                </div>
            `;
            await sendEmail({ to: user.email, subject, htmlContent: html });

            // ALSO SEND PUSH
            await this.sendPush(
                userId, 
                "🥺 Suas finanças sentem sua falta...", 
                "Faz um tempinho que não vemos novas movimentações. Registre seus gastos para manter o controle!",
                "/",
                [{ action: 'speak_fin', title: '🎙️ Falar com Fin', icon: '/logo.png' }]
            );

        } catch (error) {
            console.error("[NotificationService] Inactivity Reminder Error:", error);
        }
    }

    async sendGoalMetAlert(userId: string, goalName: string, amount: string) {
        try {
            const client = await getMongoClient();
            const db = client.db('financeApp');
            const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
            if (!user || !user.email) return;

            console.log(`[NotificationService] Sending Goal Met Alert to ${user.email}`);

            const subject = `🎉 Parabéns! Meta "${goalName}" Atingida!`;
            const html = `
                <div style="font-family: sans-serif; color: #333;">
                    <h2 style="color: #16a34a;">Vitória Financeira! 🏆</h2>
                    <p>Olá, <strong>${user.name}</strong>!</p>
                    <p>Temos ótimas notícias: Você atingiu sua meta de economia <strong>${goalName}</strong>!</p>
                    
                    <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0;">
                        <h3 style="margin: 0; color: #15803d; font-size: 24px;">${amount} Economizados</h3>
                        <p style="margin-top: 5px; color: #166534;">Todo seu esforço valeu a pena.</p>
                    </div>

                    <p>Que tal comemorar (com moderação) ou já criar a próxima meta?</p>

                    <div style="margin-top: 30px; text-align: center;">
                        <a href="https://finance-pro-mu.vercel.app/" style="background-color: #16a34a; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Definir Nova Meta
                        </a>
                    </div>
                </div>
            `;
            await sendEmail({ to: user.email, subject, htmlContent: html });

            // ALSO SEND PUSH
            await this.sendPush(
                userId, 
                "🏆 Meta Atingida!", 
                `Parabéns! Você atingiu sua meta de economia "${goalName}" com ${amount} economizados!`, 
                "/?tab=goals"
            );

            // Log notification to prevent spamming
            const notificationsCol = db.collection('notifications');
            await notificationsCol.insertOne({
                userId: new ObjectId(userId),
                insightId: `goal-met-${goalName.toLowerCase().replace(/\s+/g, '-')}`,
                type: 'goal',
                sentAt: new Date()
            });

        } catch (error) {
            console.error("[NotificationService] Goal Met Error:", error);
        }
    }


    async sendNudgeEmail(userId: string) {
        try {
            const client = await getMongoClient();
            const db = client.db('financeApp');
            const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
            if (!user || !user.email) return;

            console.log(`[NotificationService] Sending Nudge Email to ${user.email}`);

            const subject = `🤔 Esqueceu de algo?`;
            const html = `
                <div style="font-family: sans-serif; color: #333;">
                    <h2 style="color: #6366f1;">Passou rápido, né?</h2>
                    <p>Olá, <strong>${user.name}</strong>!</p>
                    <p>Notamos que você não registrou gastos nos últimos 3 dias.</p>
                    <p>Para ter clareza total das suas finanças, registrar os pequenos gastos diários faz toda a diferença.</p>
                    
                    <div style="background-color: #eef2ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>Dica:</strong> Se não tiver tempo, apenas mande um áudio para nosso bot no WhatsApp!</p>
                    </div>

                    <div style="margin-top: 30px; text-align: center;">
                        <a href="https://finance-pro-mu.vercel.app/" style="background-color: #6366f1; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Registrar
                        </a>
                    </div>
                </div>
            `;
            await sendEmail({ to: user.email, subject, htmlContent: html });

            // ALSO SEND PUSH
            await this.sendPush(
                userId, 
                "🤔 Esqueceu de algo?", 
                "Notamos que você não registrou gastos nos últimos 3 dias. Que tal registrar os de hoje?",
                "/",
                [{ action: 'speak_fin', title: '🎙️ Falar com Fin', icon: '/logo.png' }]
            );
        } catch (error) {
            console.error("[NotificationService] Nudge Email Error:", error);
        }
    }

    async sendComebackEmail(userId: string) {
        try {
            const client = await getMongoClient();
            const db = client.db('financeApp');
            const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
            if (!user || !user.email) return;

            console.log(`[NotificationService] Sending Comeback Email to ${user.email}`);

            const subject = `🚀 Muitas novidades no FinancePro!`;
            const html = `
                <div style="font-family: sans-serif; color: #333;">
                    <h2 style="color: #0ea5e9;">Sentimos sua falta!</h2>
                    <p>Olá, <strong>${user.name}</strong>!</p>
                    <p>Faz um tempo que não te vemos por aqui (30 dias ou mais). Tanta coisa mudou...</p>
                    
                    <h3 style="color: #0ea5e9;">O que há de novo:</h3>
                    <ul style="padding-left: 20px;">
                        <li style="margin-bottom: 10px;">🧠 <strong>IA Mais Inteligente:</strong> Agora ela entende melhor seus hábitos.</li>
                        <li style="margin-bottom: 10px;">⚡ <strong>Performance:</strong> O app está muito mais rápido.</li>
                        <li style="margin-bottom: 10px;">🔒 <strong>Segurança:</strong> Seus dados ainda mais protegidos.</li>
                    </ul>

                    <p>Que tal dar uma olhadinha sem compromisso?</p>

                    <div style="margin-top: 30px; text-align: center;">
                        <a href="https://finance-pro-mu.vercel.app/" style="background-color: #0ea5e9; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Detalhes
                        </a>
                    </div>
                </div>
            `;
            await sendEmail({ to: user.email, subject, htmlContent: html });

            // ALSO SEND PUSH
            await this.sendPush(
                userId, 
                "🚀 Muitas novidades no FinancePro!", 
                "Fizemos várias melhorias e adicionamos o Fin AI Inteligente. Que tal voltar e conferir?"
            );
        } catch (error) {
            console.error("[NotificationService] Comeback Email Error:", error);
        }
    }
}
