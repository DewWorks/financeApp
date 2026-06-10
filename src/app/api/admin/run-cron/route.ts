import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getMongoClient } from "@/db/connectionDb";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/run-cron
 * Calls each cron service DIRECTLY — no HTTP round-trip, no timeout from Vercel limits.
 */
export async function POST(request: Request) {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { cron } = await request.json().catch(() => ({}));

    const ALLOWED = [
        "autonomous-agent",
        "goal-tracker",
        "finscore",
        "recurring-detector",
        "weekly-brief",
        "daily-smart-digest",
    ];

    if (!cron || !ALLOWED.includes(cron)) {
        return NextResponse.json({ error: `Cron inválido. Opções: ${ALLOWED.join(", ")}` }, { status: 400 });
    }

    const start = Date.now();
    let result: any;

    try {
        switch (cron) {
            case "autonomous-agent": {
                const { AutonomousAgentService } = await import("@/services/AutonomousAgentService");
                const { BehaviorPatternService } = await import("@/services/BehaviorPatternService");
                const client = await getMongoClient();
                const db = client.db("financeApp");
                const since = new Date();
                since.setDate(since.getDate() - 30);
                const userIds = await db.collection("transactions").distinct("userId", { date: { $gte: since } });
                let sent = 0, errors = 0;
                for (const userId of userIds.slice(0, 50)) {
                    try {
                        await BehaviorPatternService.analyzeForUser(userId.toString());
                        const r = await AutonomousAgentService.runForUser(userId.toString());
                        if (r.sent) sent++;
                    } catch (e: any) { errors++; }
                }
                result = { analyzed: userIds.length, sent, errors };
                break;
            }
            case "goal-tracker": {
                const { GoalTrackingService } = await import("@/services/GoalTrackingService");
                const client = await getMongoClient();
                const db = client.db("financeApp");
                const userIds = await db.collection("goals").distinct("userId");
                let updated = 0, completed = 0, errors = 0;
                for (const userId of userIds) {
                    try {
                        const r = await GoalTrackingService.updateGoalProgress(userId.toString());
                        updated += r.updated; completed += r.completed;
                    } catch { errors++; }
                }
                result = { usersProcessed: userIds.length, updated, completed, errors };
                break;
            }
            case "finscore": {
                const { FinScoreService } = await import("@/services/FinScoreService");
                const client = await getMongoClient();
                const db = client.db("financeApp");
                const users = await db.collection("users").find({ email: { $exists: true } }).project({ _id: 1 }).toArray();
                let processed = 0; const scores: number[] = [];
                for (const user of users) {
                    try {
                        const { score } = await FinScoreService.calculateAndSave(user._id.toString());
                        scores.push(score); processed++;
                    } catch { /* continue */ }
                }
                const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
                result = { processed, avgScore: avg };
                break;
            }
            case "recurring-detector": {
                const { RecurringDetectionService } = await import("@/services/RecurringDetectionService");
                const client = await getMongoClient();
                const db = client.db("financeApp");
                const userIds = await db.collection("transactions").distinct("userId", { provider: "pluggy" });
                let detected = 0, errors = 0;
                for (const userId of userIds) {
                    try {
                        const r = await RecurringDetectionService.detectForUser(userId.toString());
                        detected += r.detected;
                    } catch { errors++; }
                }
                result = { usersProcessed: userIds.length, detected, errors };
                break;
            }
            case "weekly-brief": {
                const { WeeklyBriefService } = await import("@/services/WeeklyBriefService");
                const client = await getMongoClient();
                const db = client.db("financeApp");
                const since = new Date();
                since.setDate(since.getDate() - 14);
                const userIds = await db.collection("transactions").distinct("userId", { date: { $gte: since } });
                let sent = 0, errors = 0;
                for (const userId of userIds.slice(0, 100)) {
                    try {
                        const r = await WeeklyBriefService.generateForUser(userId.toString());
                        if (r.sent) sent++;
                    } catch { errors++; }
                }
                result = { candidates: userIds.length, sent, errors };
                break;
            }
            case "daily-smart-digest": {
                const { NotificationService } = await import("@/services/NotificationService");
                const client = await getMongoClient();
                const db = client.db("financeApp");
                const today = new Date();
                const mainPartition = today.getDay();
                const secondaryPartition = (mainPartition + 3) % 7;
                const allUsers = await db.collection("users")
                    .find({ email: { $exists: true, $ne: null } })
                    .project({ _id: 1, email: 1 })
                    .toArray();
                const targetUsers = allUsers.filter(u => {
                    const idStr = u._id.toString();
                    let hash = 0;
                    for (let i = 0; i < idStr.length; i++) hash = (hash + idStr.charCodeAt(i)) % 7;
                    return hash === mainPartition || hash === secondaryPartition;
                });
                const notifier = new NotificationService();
                let sent = 0, errors = 0, skipped = 0;
                const CHUNK = 5;
                for (let i = 0; i < Math.min(targetUsers.length, 50); i += CHUNK) {
                    await Promise.allSettled(targetUsers.slice(i, i + CHUNK).map(async (user) => {
                        try {
                            const lastTx = await db.collection("transactions").findOne(
                                { userId: user._id },
                                { sort: { date: -1 }, projection: { date: 1 } }
                            );
                            const daysInactive = Math.floor((today.getTime() - (lastTx ? new Date(lastTx.date).getTime() : 0)) / (1000 * 3600 * 24));
                            const idStr = user._id.toString();
                            let hash = 0;
                            for (let j = 0; j < idStr.length; j++) hash = (hash + idStr.charCodeAt(j)) % 7;
                            const isMain = hash === mainPartition;
                            if (daysInactive <= 3 && isMain) { await notifier.sendWeeklyDigest(user._id.toString()); sent++; }
                            else if (daysInactive > 3 && daysInactive <= 7) { await notifier.sendNudgeEmail(user._id.toString()); sent++; }
                            else if (daysInactive > 7 && daysInactive <= 30 && isMain) { await notifier.sendInactivityReminder(user._id.toString()); sent++; }
                            else if (daysInactive > 30 && isMain) { await notifier.sendComebackEmail(user._id.toString()); sent++; }
                            else { skipped++; }
                        } catch { errors++; }
                    }));
                }
                result = { candidates: targetUsers.length, sent, skipped, errors };
                break;
            }
        }

        return NextResponse.json({ success: true, cron, result, elapsedMs: Date.now() - start });

    } catch (error: any) {
        return NextResponse.json({ success: false, cron, error: error.message, partial: result, elapsedMs: Date.now() - start }, { status: 500 });
    }
}
