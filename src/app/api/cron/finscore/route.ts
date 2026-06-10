import { NextResponse } from "next/server";
import { getMongoClient } from "@/db/connectionDb";
import { FinScoreService } from "@/services/FinScoreService";

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

        const allUsers = await db.collection("users")
            .find({ email: { $exists: true } })
            .project({ _id: 1 })
            .toArray();

        console.log(`[FinScore Cron] Calculating scores for ${allUsers.length} users`);

        let processed = 0;
        const scores: number[] = [];

        for (const user of allUsers) {
            try {
                const { score } = await FinScoreService.calculateAndSave(user._id.toString());
                scores.push(score);
                processed++;
            } catch (err) {
                console.error(`[FinScore Cron] Error for user ${user._id}:`, err);
            }
        }

        const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

        return NextResponse.json({
            success: true,
            processed,
            avgScore,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("[FinScore Cron] Fatal error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
