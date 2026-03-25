import { NextResponse } from "next/server";
import { InsightService } from "@/services/InsightService";
import { PlanService } from "@/services/PlanService";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

async function getUserIdFromToken() {
    const token = (await cookies()).get("auth_token")?.value;
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        return decoded.userId;
    } catch {
        return null;
    }
}

/**
 * @swagger
 * /api/insights:
 *   get:
 *     tags:
 *       - Insights
 *     summary: Get daily insights
 *     description: Generates financial insights using AI based on user transactions.
 *     parameters:
 *       - in: query
 *         name: profileId
 *         schema:
 *           type: string
 *         description: Optional Profile ID for collaborative insights
 *       - in: query
 *         name: scope
 *         schema:
 *           type: string
 *           enum: [recent, all]
 *           default: recent
 *         description: Analysis scope
 *     responses:
 *       200:
 *         description: Insight data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET(request: Request) {
    try {
        const userId = await getUserIdFromToken();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Pegar profileId da query param se existir (para contas compartilhadas)
        const { searchParams } = new URL(request.url);
        const profileId = searchParams.get("profileId") || undefined;
        const scope = (searchParams.get("scope") as 'recent' | 'all') || 'recent';

        // Gating for Deep Analysis
        if (scope === 'all') {
            try {
                await PlanService.validate(userId, 'USE_DEEP_INSIGHTS');
            } catch (error: any) {
                if (error.name === 'PlanRestrictionError') {
                    return NextResponse.json({ error: error.message }, { status: 403 });
                }
                throw error;
            }
        }

        const service = new InsightService();
        const insight = await service.generateDailyInsight(userId, profileId, scope);

        // O CORAÇÃO PREDITIVO (Nudge Engine) com Caching Diário
        if (insight.contextForAI) {
            try {
                const { getMongoClient } = await import('@/db/connectionDb');
                const client = await getMongoClient();
                const db = client.db('financeApp');
                
                // Chave de cache sensível a novas transações (Invalida se o saldo ou dia mudar)
                const todayStr = new Date().toISOString().split('T')[0];
                const cacheHash = `${insight.monthSummary.total.toFixed(0)}_${insight.dailySummary.total.toFixed(0)}`;
                const cacheKey = `nudge_${userId}_${todayStr}_hash_${cacheHash}`;

                let aiData;
                const cachedNudge = await db.collection("ai_insights_cache").findOne({ _id: cacheKey as any });

                if (cachedNudge && cachedNudge.aiData && cachedNudge.aiData.nudges && cachedNudge.aiData.nudges[0]?.explicacaoMatematica) {
                    // Cache Hit: Usa dado já gerado para este momento financeiro (validado para o novo schema)
                    aiData = cachedNudge.aiData;
                } else {
                    // Cache Miss: Chama a IA pois é a primeira vez hoje ou a pessoa gastou algo novo
                    const { FinanceAgentService } = await import('@/services/FinanceAgentService');
                    const agent = new FinanceAgentService();
                    
                    const aiPrompt = `Gere Nudges prescritivos baseados neste contexto financeiro exato: ${JSON.stringify(insight.contextForAI)}. Lembre-se, retorne APENAS o JSON válido.`;
                    const aiResponseRaw = await agent.processMessage(aiPrompt, userId);
                    
                    const cleanJsonStr = aiResponseRaw.replace(/```json/g, '').replace(/```/g, '').trim();
                    aiData = JSON.parse(cleanJsonStr);

                    // Adicionar Timestamp de Geração da Máquina
                    aiData.generatedAt = new Date().toISOString();

                    if (aiData?.nudges) {
                        db.collection("ai_insights_cache").updateOne(
                            { _id: cacheKey as any },
                            { $set: { aiData, createdAt: new Date() } },
                            { upsert: true }
                        ).catch(e => console.error("Erro ao salvar cache de nudge:", e));
                    }
                }

                if (aiData?.nudges && Array.isArray(aiData.nudges)) {
                    // Formatar hora para exibição limpa do status de atualização ("Atualizado às 16:30")
                    const timeString = aiData.generatedAt 
                        ? new Date(aiData.generatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }) 
                        : new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });

                    aiData.nudges.reverse().forEach((nudge: any, idx: number) => {
                        insight.insights.unshift({
                            id: `ai-nudge-${Date.now()}-${idx}`,
                            type: "tip",
                            text: nudge.foco || "Recomendação Preditiva",
                            value: nudge.impacto === "Alto" ? "🔥 Alto Impacto" : "💡 Dica",
                            trend: "neutral",
                            details: `(Atualizado às ${timeString}) • ` + (nudge.motivoVinculado || "Baseado nos dados em tempo real."),
                            recommendation: nudge.acaoPratica,
                            mathBasis: nudge.explicacaoMatematica
                        });
                    });
                }
            } catch (e) {
                console.error("Falha ao gerar AI Nudges (Timeout ou JSON Parse Error):", e);
                // Retorna silenciosamente apenas os insights determinísticos do MongoDB
            }
        }

        return NextResponse.json(insight);
    } catch (error) {
        console.error("Error generating insights:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
