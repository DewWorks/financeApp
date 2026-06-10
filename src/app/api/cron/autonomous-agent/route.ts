import { NextResponse } from "next/server";
import { getMongoClient } from "@/db/connectionDb";
import { AutonomousAgentService } from "@/services/AutonomousAgentService";
import { BehaviorPatternService } from "@/services/BehaviorPatternService";
import { getCronCursor, setCronCursor } from "@/lib/CronCursor";
import { SystemLogger } from "@/lib/SystemLogger";

export const dynamic = "force-dynamic";
// Vercel Pro: increase to 60. Hobby: stays at 10 (enforced by Vercel, not this export).
export const maxDuration = 60;

const CRON = "autonomous-agent";
const BATCH = 3; // Process 3 users per invocation — safe within 10s
const TIMEOUT_MS = 8500; // Hard stop before Vercel kills the function

export async function GET(request: Request) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        if (process.env.NODE_ENV === "production") {
            return new NextResponse("Unauthorized", { status: 401 });
        }
    }

    const start = Date.now();
    SystemLogger.info(CRON, "Cron started");

    try {
        const client = await getMongoClient();
        const db = client.db("financeApp");

        // Get all active user IDs (last 30 days)
        const since = new Date();
        since.setDate(since.getDate() - 30);
        const allUserIds = await db.collection("transactions").distinct("userId", { date: { $gte: since } });

        const offset = await getCronCursor(CRON);
        const slice = allUserIds.slice(offset, offset + BATCH);

        // If we've processed everyone, reset cursor for next full pass
        if (slice.length === 0) {
            await setCronCursor(CRON, 0);
            SystemLogger.info(CRON, `All ${allUserIds.length} users processed. Cursor reset.`);
            return NextResponse.json({ success: true, status: "cycle_complete", total: allUserIds.length });
        }

        SystemLogger.info(CRON, `Processing batch offset=${offset}, users=${slice.length}/${allUserIds.length}`);

        let sent = 0, errors = 0;

        for (const userId of slice) {
            // Hard timeout guard — stop before Vercel kills us
            if (Date.now() - start > TIMEOUT_MS) {
                SystemLogger.warn(CRON, `Timeout guard hit at user ${userId.toString()}, saving cursor`);
                break;
            }
            try {
                await BehaviorPatternService.analyzeForUser(userId.toString());
                const result = await AutonomousAgentService.runForUser(userId.toString());
                if (result.sent) sent++;
                SystemLogger.success(CRON, `User ${userId.toString()} processed`, { sent: result.sent });
            } catch (err: any) {
                errors++;
                SystemLogger.error(CRON, `Error for user ${userId.toString()}: ${err.message}`);
                // Always continue — one user error must not stop others
            }
        }

        // Advance cursor for next invocation
        await setCronCursor(CRON, offset + slice.length);

        const elapsed = Date.now() - start;
        SystemLogger.success(CRON, `Batch done — sent=${sent} errors=${errors} elapsed=${elapsed}ms`);

        return NextResponse.json({
            success: true,
            offset,
            processed: slice.length,
            remaining: allUserIds.length - offset - slice.length,
            sent,
            errors,
            elapsedMs: elapsed
        });

    } catch (error: any) {
        SystemLogger.error(CRON, `Fatal: ${error.message}`);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
