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

        return NextResponse.json(insight);
    } catch (error) {
        console.error("Error generating insights:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
