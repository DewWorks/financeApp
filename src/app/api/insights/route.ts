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

        // 🚀 O CORAÇÃO PREDITIVO (Nudge Engine)
        if (insight.contextForAI) {
            try {
                // Instancia o agente para invocar o LLM
                const { FinanceAgentService } = await import('@/services/FinanceAgentService');
                const agent = new FinanceAgentService();
                
                const aiPrompt = `Gere Nudges prescritivos baseados neste contexto financeiro exato: ${JSON.stringify(insight.contextForAI)}. Lembre-se, retorne APENAS o JSON válido.`;
                const aiResponseRaw = await agent.processMessage(aiPrompt, userId);
                
                // Limpeza de possíveis blocos markdown que o Gemini possa retornar
                const cleanJsonStr = aiResponseRaw.replace(/```json/g, '').replace(/```/g, '').trim();
                const aiData = JSON.parse(cleanJsonStr);

                if (aiData.nudges && Array.isArray(aiData.nudges)) {
                    // Inserimos os Nudges no topo da lista de Insights para destaque
                    aiData.nudges.reverse().forEach((nudge: any, idx: number) => {
                        insight.insights.unshift({
                            id: `ai-nudge-${Date.now()}-${idx}`,
                            type: "tip",
                            text: nudge.foco || "Recomendação Preditiva",
                            value: nudge.impacto === "Alto" ? "🔥 Alto Impacto" : "💡 Dica",
                            trend: "neutral",
                            details: nudge.motivoVinculado || "Dica baseada no seu padrão de consumo recente.",
                            recommendation: nudge.acaoPratica
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
