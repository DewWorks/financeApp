import { NextResponse } from "next/server";
import { getMongoClient } from "@/db/connectionDb";
import { WeeklyBriefService } from "@/services/WeeklyBriefService";

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

        // Users active in the last 14 days
        const since = new Date();
        since.setDate(since.getDate() - 14);

        const activeUserIds = await db.collection("transactions").distinct("userId", {
            date: { $gte: since }
        });

        console.log(`[WeeklyBrief Cron] Sending briefs to ${activeUserIds.length} users`);

        let sent = 0;
        const BATCH = 100;

        for (const userId of activeUserIds.slice(0, BATCH)) {
            try {
                const result = await WeeklyBriefService.generateForUser(userId.toString());
                if (result.sent) sent++;
            } catch (err) {
                console.error(`[WeeklyBrief Cron] Error for user ${userId}:`, err);
            }
        }

        return NextResponse.json({
            success: true,
            candidates: activeUserIds.length,
            sent,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("[WeeklyBrief Cron] Fatal error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
