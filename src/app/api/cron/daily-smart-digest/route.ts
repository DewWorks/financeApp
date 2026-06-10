import { NextResponse } from 'next/server';
import { getMongoClient } from '@/db/connectionDb';
import { NotificationService } from '@/services/NotificationService';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Extend to 60s on Vercel Pro

/**
 * Smart Daily Cron — Fixed 504: processes users in parallel batches
 */
export async function GET(request: Request) {
    const startTime = Date.now();

    // Security check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        if (process.env.NODE_ENV === 'production') {
            return new NextResponse('Unauthorized', { status: 401 });
        }
    }

    const results = { sent: 0, errors: 0, skipped: 0 };

    try {
        const client = await getMongoClient();
        const db = client.db('financeApp');

        const today = new Date();
        const mainPartition = today.getDay();
        const secondaryPartition = (mainPartition + 3) % 7;

        console.log(`[SmartCron] Running partitions ${mainPartition} & ${secondaryPartition}`);

        const allUsers = await db.collection('users')
            .find({ email: { $exists: true, $ne: null } })
            .project({ _id: 1, email: 1 })
            .toArray();

        const targetUsers = allUsers.filter(u => {
            const idStr = u._id.toString();
            let hash = 0;
            for (let i = 0; i < idStr.length; i++) hash = (hash + idStr.charCodeAt(i)) % 7;
            return hash === mainPartition || hash === secondaryPartition;
        });

        console.log(`[SmartCron] ${targetUsers.length} users in partition`);

        if (targetUsers.length === 0) {
            return NextResponse.json({ message: "No users for these partitions", ...results });
        }

        const notificationService = new NotificationService();

        // Process in parallel batches of 10 to avoid timeout while keeping concurrency
        const CONCURRENT = 10;
        const batch = targetUsers.slice(0, 80); // Cap at 80 per run

        for (let i = 0; i < batch.length; i += CONCURRENT) {
            const chunk = batch.slice(i, i + CONCURRENT);

            // Early exit if running out of time (55s limit)
            if (Date.now() - startTime > 55000) {
                console.warn(`[SmartCron] Approaching timeout, stopping at ${i}/${batch.length}`);
                break;
            }

            await Promise.allSettled(chunk.map(async (user) => {
                try {
                    const lastTx = await db.collection('transactions').findOne(
                        { userId: user._id },
                        { sort: { date: -1 }, projection: { date: 1 } }
                    );

                    const lastTxDate = lastTx ? new Date(lastTx.date) : new Date(0);
                    const daysInactive = Math.floor((today.getTime() - lastTxDate.getTime()) / (1000 * 3600 * 24));

                    const idStr = user._id.toString();
                    let hash = 0;
                    for (let j = 0; j < idStr.length; j++) hash = (hash + idStr.charCodeAt(j)) % 7;
                    const isMainPartition = hash === mainPartition;

                    if (daysInactive <= 3 && isMainPartition) {
                        await notificationService.sendWeeklyDigest(user._id.toString());
                        results.sent++;
                    } else if (daysInactive > 3 && daysInactive <= 7) {
                        await notificationService.sendNudgeEmail(user._id.toString());
                        results.sent++;
                    } else if (daysInactive > 7 && daysInactive <= 30 && isMainPartition) {
                        await notificationService.sendInactivityReminder(user._id.toString());
                        results.sent++;
                    } else if (daysInactive > 30 && isMainPartition) {
                        await notificationService.sendComebackEmail(user._id.toString());
                        results.sent++;
                    } else {
                        results.skipped++;
                    }
                } catch (err: any) {
                    results.errors++;
                    console.error(`[SmartCron] Error user ${user._id}: ${err.message}`);
                    // Continue — don't let one failure block others
                }
            }));
        }

    } catch (error: any) {
        console.error('[SmartCron] Fatal error:', error.message);
        // Return partial success instead of 500
        return NextResponse.json({ success: false, error: error.message, partial: results });
    }

    console.log(`[SmartCron] Done in ${Date.now() - startTime}ms`, results);
    return NextResponse.json({ success: true, ...results, elapsedMs: Date.now() - startTime });
}
