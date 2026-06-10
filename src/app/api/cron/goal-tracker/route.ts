import { NextResponse } from "next/server";
import { getMongoClient } from "@/db/connectionDb";
import { GoalTrackingService } from "@/services/GoalTrackingService";

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

        // Find all users with active goals
        const usersWithGoals = await db.collection("goals").distinct("userId");

        console.log(`[GoalTracker Cron] Processing ${usersWithGoals.length} users with goals`);

        let totalUpdated = 0;
        let totalCompleted = 0;

        for (const userId of usersWithGoals) {
            try {
                const { updated, completed } = await GoalTrackingService.updateGoalProgress(userId.toString());
                totalUpdated += updated;
                totalCompleted += completed;
            } catch (err) {
                console.error(`[GoalTracker Cron] Error for user ${userId}:`, err);
            }
        }

        return NextResponse.json({
            success: true,
            usersProcessed: usersWithGoals.length,
            totalUpdated,
            totalCompleted,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("[GoalTracker Cron] Fatal error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
