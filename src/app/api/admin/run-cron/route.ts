import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getCronCursor, setCronCursor, resetCronCursor } from "@/lib/CronCursor";
import { SystemLogger } from "@/lib/SystemLogger";
import { getMongoClient } from "@/db/connectionDb";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/admin/run-cron
 * Triggers ONE batch of each cron service directly (no HTTP hop).
 * Respects cursor state — picks up where the scheduled job left off.
 * Body: { cron: string, reset?: boolean }
 *   reset=true → resets cursor to 0 before running (re-processes from start)
 */
export async function POST(request: Request) {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const { cron, reset } = body;

    const ALLOWED = ["autonomous-agent", "goal-tracker", "finscore", "recurring-detector", "weekly-brief", "daily-smart-digest"];
    if (!cron || !ALLOWED.includes(cron)) {
        return NextResponse.json({ error: `Cron inválido. Opções: ${ALLOWED.join(", ")}` }, { status: 400 });
    }

    if (reset) {
        await resetCronCursor(cron);
        SystemLogger.info("admin/run-cron", `Cursor reset for ${cron}`);
    }

    const start = Date.now();
    const TIMEOUT_MS = 8000;
    let result: any = {};

    try {
        const client = await getMongoClient();
        const db = client.db("financeApp");

        SystemLogger.info("admin/run-cron", `Manual trigger: ${cron}`);

        switch (cron) {

            case "autonomous-agent": {
                const { AutonomousAgentService } = await import("@/services/AutonomousAgentService");
                const { BehaviorPatternService } = await import("@/services/BehaviorPatternService");
                const BATCH = 3;
                const since = new Date(); since.setDate(since.getDate() - 30);
                const allIds = await db.collection("transactions").distinct("userId", { date: { $gte: since } });
                const offset = await getCronCursor(cron);
                const slice = allIds.slice(offset, offset + BATCH);
                let sent = 0, errors = 0;
                for (const uid of slice) {
                    if (Date.now() - start > TIMEOUT_MS) break;
                    try {
                        await BehaviorPatternService.analyzeForUser(uid.toString());
                        const r = await AutonomousAgentService.runForUser(uid.toString());
                        if (r.sent) sent++;
                    } catch (e: any) { errors++; SystemLogger.error("admin/run-cron", `autonomous user ${uid}: ${e.message}`); }
                }
                await setCronCursor(cron, slice.length === 0 ? 0 : offset + slice.length);
                result = { processed: slice.length, remaining: allIds.length - offset - slice.length, sent, errors };
                break;
            }

            case "goal-tracker": {
                const { GoalTrackingService } = await import("@/services/GoalTrackingService");
                const BATCH = 5;
                const allIds = await db.collection("goals").distinct("userId");
                const offset = await getCronCursor(cron);
                const slice = allIds.slice(offset, offset + BATCH);
                let updated = 0, completed = 0, errors = 0;
                for (const uid of slice) {
                    if (Date.now() - start > TIMEOUT_MS) break;
                    try {
                        const r = await GoalTrackingService.updateGoalProgress(uid.toString());
                        updated += r.updated; completed += r.completed;
                    } catch { errors++; }
                }
                await setCronCursor(cron, slice.length === 0 ? 0 : offset + slice.length);
                result = { processed: slice.length, remaining: allIds.length - offset - slice.length, updated, completed, errors };
                break;
            }

            case "finscore": {
                const { FinScoreService } = await import("@/services/FinScoreService");
                const BATCH = 5;
                const allUsers = await db.collection("users").find({ email: { $exists: true } }).project({ _id: 1 }).toArray();
                const offset = await getCronCursor(cron);
                const slice = allUsers.slice(offset, offset + BATCH);
                const scores: number[] = [];
                let errors = 0;
                for (const user of slice) {
                    if (Date.now() - start > TIMEOUT_MS) break;
                    try {
                        const { score } = await FinScoreService.calculateAndSave(user._id.toString());
                        scores.push(score);
                    } catch { errors++; }
                }
                await setCronCursor(cron, slice.length === 0 ? 0 : offset + slice.length);
                const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
                result = { processed: slice.length, remaining: allUsers.length - offset - slice.length, avgScore: avg, errors };
                break;
            }

            case "recurring-detector": {
                const { RecurringDetectionService } = await import("@/services/RecurringDetectionService");
                const BATCH = 5;
                const allIds = await db.collection("transactions").distinct("userId", { provider: "pluggy" });
                const offset = await getCronCursor(cron);
                const slice = allIds.slice(offset, offset + BATCH);
                let detected = 0, errors = 0;
                for (const uid of slice) {
                    if (Date.now() - start > TIMEOUT_MS) break;
                    try { const r = await RecurringDetectionService.detectForUser(uid.toString()); detected += r.detected; }
                    catch { errors++; }
                }
                await setCronCursor(cron, slice.length === 0 ? 0 : offset + slice.length);
                result = { processed: slice.length, remaining: allIds.length - offset - slice.length, detected, errors };
                break;
            }

            case "weekly-brief": {
                const { WeeklyBriefService } = await import("@/services/WeeklyBriefService");
                const BATCH = 2;
                const since = new Date(); since.setDate(since.getDate() - 14);
                const allIds = await db.collection("transactions").distinct("userId", { date: { $gte: since } });
                const offset = await getCronCursor(cron);
                const slice = allIds.slice(offset, offset + BATCH);
                let sent = 0, errors = 0;
                for (const uid of slice) {
                    if (Date.now() - start > TIMEOUT_MS) break;
                    try { const r = await WeeklyBriefService.generateForUser(uid.toString()); if (r.sent) sent++; }
                    catch (e: any) { errors++; SystemLogger.error("admin/run-cron", `weekly-brief user ${uid}: ${e.message}`); }
                }
                await setCronCursor(cron, slice.length === 0 ? 0 : offset + slice.length);
                result = { processed: slice.length, remaining: allIds.length - offset - slice.length, sent, errors };
                break;
            }

            case "daily-smart-digest": {
                const { NotificationService } = await import("@/services/NotificationService");
                const BATCH = 3;
                const today = new Date();
                const p1 = today.getDay(), p2 = (p1 + 3) % 7;
                const allUsers = await db.collection("users").find({ email: { $exists: true, $ne: null } }).project({ _id: 1, email: 1 }).toArray();
                const target = allUsers.filter(u => {
                    const s = u._id.toString(); let h = 0;
                    for (let i = 0; i < s.length; i++) h = (h + s.charCodeAt(i)) % 7;
                    return h === p1 || h === p2;
                });
                const offset = await getCronCursor(cron);
                const slice = target.slice(offset, offset + BATCH);
                const notifier = new NotificationService();
                let sent = 0, skipped = 0, errors = 0;
                for (const user of slice) {
                    if (Date.now() - start > TIMEOUT_MS) break;
                    try {
                        const lastTx = await db.collection("transactions").findOne({ userId: user._id }, { sort: { date: -1 }, projection: { date: 1 } });
                        const days = Math.floor((today.getTime() - (lastTx ? new Date(lastTx.date).getTime() : 0)) / 86400000);
                        const s = user._id.toString(); let h = 0;
                        for (let i = 0; i < s.length; i++) h = (h + s.charCodeAt(i)) % 7;
                        const isMain = h === p1;
                        if (days <= 3 && isMain) { await notifier.sendWeeklyDigest(user._id.toString()); sent++; }
                        else if (days > 3 && days <= 7) { await notifier.sendNudgeEmail(user._id.toString()); sent++; }
                        else if (days > 7 && days <= 30 && isMain) { await notifier.sendInactivityReminder(user._id.toString()); sent++; }
                        else if (days > 30 && isMain) { await notifier.sendComebackEmail(user._id.toString()); sent++; }
                        else skipped++;
                    } catch { errors++; }
                }
                await setCronCursor(cron, slice.length === 0 ? 0 : offset + slice.length);
                result = { processed: slice.length, remaining: target.length - offset - slice.length, sent, skipped, errors };
                break;
            }
        }

        SystemLogger.success("admin/run-cron", `${cron} done in ${Date.now() - start}ms`, result);

        return NextResponse.json({
            success: true,
            cron,
            result,
            elapsedMs: Date.now() - start,
            tip: result.remaining > 0 ? `${result.remaining} usuários restantes — clique novamente para continuar` : "Todos os usuários processados neste ciclo"
        });

    } catch (error: any) {
        SystemLogger.error("admin/run-cron", `Fatal in ${cron}: ${error.message}`);
        return NextResponse.json({ success: false, cron, error: error.message, elapsedMs: Date.now() - start }, { status: 500 });
    }
}
