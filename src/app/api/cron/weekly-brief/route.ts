import { NextResponse } from "next/server";
import { getMongoClient } from "@/db/connectionDb";
import { WeeklyBriefService } from "@/services/WeeklyBriefService";
import { getCronCursor, setCronCursor } from "@/lib/CronCursor";
import { SystemLogger } from "@/lib/SystemLogger";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CRON = "weekly-brief";
const BATCH = 2; // Gemini AI + email = slowest cron — keep at 2
const TIMEOUT_MS = 8000;

export async function GET(request: Request) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        if (process.env.NODE_ENV === "production") return new NextResponse("Unauthorized", { status: 401 });
    }

    const start = Date.now();
    SystemLogger.info(CRON, "Cron started");

    try {
        const client = await getMongoClient();
        const db = client.db("financeApp");
        const since = new Date();
        since.setDate(since.getDate() - 14);
        const allUserIds = await db.collection("transactions").distinct("userId", { date: { $gte: since } });

        const offset = await getCronCursor(CRON);
        const slice = allUserIds.slice(offset, offset + BATCH);

        if (slice.length === 0) {
            await setCronCursor(CRON, 0);
            SystemLogger.info(CRON, "Cycle complete. Cursor reset.");
            return NextResponse.json({ success: true, status: "cycle_complete", total: allUserIds.length });
        }

        SystemLogger.info(CRON, `Batch offset=${offset}, users=${slice.length}/${allUserIds.length}`);

        let sent = 0, errors = 0;

        for (const userId of slice) {
            if (Date.now() - start > TIMEOUT_MS) {
                SystemLogger.warn(CRON, "Timeout guard hit, saving cursor");
                break;
            }
            try {
                const result = await WeeklyBriefService.generateForUser(userId.toString());
                if (result.sent) sent++;
                SystemLogger.success(CRON, `User ${userId.toString()} sent=${result.sent}`);
            } catch (err: any) {
                errors++;
                SystemLogger.error(CRON, `Error user ${userId.toString()}: ${err.message}`);
            }
        }

        await setCronCursor(CRON, offset + slice.length);

        return NextResponse.json({
            success: true, offset,
            processed: slice.length,
            remaining: allUserIds.length - offset - slice.length,
            sent, errors,
            elapsedMs: Date.now() - start
        });

    } catch (error: any) {
        SystemLogger.error(CRON, `Fatal: ${error.message}`);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
