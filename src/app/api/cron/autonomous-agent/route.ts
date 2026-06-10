import { NextResponse } from "next/server";
import { getMongoClient } from "@/db/connectionDb";
import { AutonomousAgentService } from "@/services/AutonomousAgentService";
import { BehaviorPatternService } from "@/services/BehaviorPatternService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        if (process.env.NODE_ENV === "production") {
            return new NextResponse("Unauthorized", { status: 401 });
        }
    }

    try {
        const client = await getMongoClient();
        const db = client.db("financeApp");

        // Find users active in the last 30 days
        const since = new Date();
        since.setDate(since.getDate() - 30);

        const activeUserIds = await db.collection("transactions").distinct("userId", {
            date: { $gte: since }
        });

        console.log(`[AutonomousAgent Cron] Processing ${activeUserIds.length} active users`);

        let sent = 0;
        let analyzed = 0;
        const BATCH = 50;

        for (const userId of activeUserIds.slice(0, BATCH)) {
            try {
                // Run behavior analysis first (lightweight)
                await BehaviorPatternService.analyzeForUser(userId.toString());

                // Run autonomous insight
                const result = await AutonomousAgentService.runForUser(userId.toString());
                if (result.sent) sent++;
                analyzed++;
            } catch (err) {
                console.error(`[AutonomousAgent Cron] Error for user ${userId}:`, err);
            }
        }

        return NextResponse.json({
            success: true,
            analyzed,
            sent,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("[AutonomousAgent Cron] Fatal error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
