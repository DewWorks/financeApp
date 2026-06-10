import { NextResponse } from "next/server";
import { getMongoClient } from "@/db/connectionDb";
import { GoalTrackingService } from "@/services/GoalTrackingService";
import { getCronCursor, setCronCursor } from "@/lib/CronCursor";
import { SystemLogger } from "@/lib/SystemLogger";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CRON = "goal-tracker";
const BATCH = 5; // Goals are fast (pure DB, no AI) — safe at 5
const TIMEOUT_MS = 8500;

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
        const allUserIds = await db.collection("goals").distinct("userId");

        const offset = await getCronCursor(CRON);
        const slice = allUserIds.slice(offset, offset + BATCH);

        if (slice.length === 0) {
            await setCronCursor(CRON, 0);
            SystemLogger.info(CRON, `Cycle complete. Cursor reset.`);
            return NextResponse.json({ success: true, status: "cycle_complete", total: allUserIds.length });
        }

        SystemLogger.info(CRON, `Batch offset=${offset}, users=${slice.length}/${allUserIds.length}`);

        let updated = 0, completed = 0, errors = 0;

        for (const userId of slice) {
            if (Date.now() - start > TIMEOUT_MS) {
                SystemLogger.warn(CRON, "Timeout guard hit, saving cursor");
                break;
            }
            try {
                const r = await GoalTrackingService.updateGoalProgress(userId.toString());
                updated += r.updated;
                completed += r.completed;
                SystemLogger.success(CRON, `User ${userId.toString()} — updated=${r.updated} completed=${r.completed}`);
            } catch (err: any) {
                errors++;
                SystemLogger.error(CRON, `Error user ${userId.toString()}: ${err.message}`);
            }
        }

        await setCronCursor(CRON, offset + slice.length);

        return NextResponse.json({
            success: true,
            offset,
            processed: slice.length,
            remaining: allUserIds.length - offset - slice.length,
            updated,
            completed,
            errors,
            elapsedMs: Date.now() - start
        });

    } catch (error: any) {
        SystemLogger.error(CRON, `Fatal: ${error.message}`);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
