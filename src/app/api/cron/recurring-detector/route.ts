import { NextResponse } from "next/server";
import { getMongoClient } from "@/db/connectionDb";
import { RecurringDetectionService } from "@/services/RecurringDetectionService";

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

        // Only process users who connected a bank (have pluggy transactions)
        const usersWithBank = await db.collection("transactions").distinct("userId", {
            provider: "pluggy"
        });

        console.log(`[RecurringDetector Cron] Processing ${usersWithBank.length} users with bank connections`);

        let totalDetected = 0;

        for (const userId of usersWithBank) {
            try {
                const { detected } = await RecurringDetectionService.detectForUser(userId.toString());
                totalDetected += detected;
            } catch (err) {
                console.error(`[RecurringDetector Cron] Error for user ${userId}:`, err);
            }
        }

        return NextResponse.json({
            success: true,
            usersProcessed: usersWithBank.length,
            totalDetected,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("[RecurringDetector Cron] Fatal error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
