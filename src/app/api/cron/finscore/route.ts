import { NextResponse } from "next/server";
import { getMongoClient } from "@/db/connectionDb";
import { FinScoreService } from "@/services/FinScoreService";
import { getCronCursor, setCronCursor } from "@/lib/CronCursor";
import { SystemLogger } from "@/lib/SystemLogger";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CRON = "finscore";
const BATCH = 5; // FinScore is DB-only, fast
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
        const allUsers = await db.collection("users")
            .find({ email: { $exists: true } })
            .project({ _id: 1 })
            .toArray();

        const offset = await getCronCursor(CRON);
        const slice = allUsers.slice(offset, offset + BATCH);

        if (slice.length === 0) {
            await setCronCursor(CRON, 0);
            SystemLogger.info(CRON, "Cycle complete. Cursor reset.");
            return NextResponse.json({ success: true, status: "cycle_complete", total: allUsers.length });
        }

        SystemLogger.info(CRON, `Batch offset=${offset}, users=${slice.length}/${allUsers.length}`);

        const scores: number[] = [];
        let errors = 0;

        for (const user of slice) {
            if (Date.now() - start > TIMEOUT_MS) {
                SystemLogger.warn(CRON, "Timeout guard hit, saving cursor");
                break;
            }
            try {
                const { score } = await FinScoreService.calculateAndSave(user._id.toString());
                scores.push(score);
                SystemLogger.success(CRON, `User ${user._id.toString()} score=${score}`);
            } catch (err: any) {
                errors++;
                SystemLogger.error(CRON, `Error user ${user._id.toString()}: ${err.message}`);
            }
        }

        await setCronCursor(CRON, offset + slice.length);
        const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

        return NextResponse.json({
            success: true,
            offset,
            processed: slice.length,
            remaining: allUsers.length - offset - slice.length,
            avgScore: avg,
            errors,
            elapsedMs: Date.now() - start
        });

    } catch (error: any) {
        SystemLogger.error(CRON, `Fatal: ${error.message}`);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
