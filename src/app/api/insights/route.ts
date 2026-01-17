import { NextResponse } from "next/server";
import { InsightService } from "@/services/InsightService";
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

export async function GET(request: Request) {
    try {
        const userId = await getUserIdFromToken();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Pegar profileId da query param se existir (para contas compartilhadas)
        const { searchParams } = new URL(request.url);
        const profileId = searchParams.get("profileId") || undefined;

        const service = new InsightService();
        const insight = await service.generateDailyInsight(userId, profileId);

        return NextResponse.json(insight);
    } catch (error) {
        console.error("Error generating insights:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
