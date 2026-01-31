import { NextResponse } from 'next/server';
import { getMongoClient } from '@/db/connectionDb';
import { NotificationService } from '@/services/NotificationService';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic'; // Prevent static caching

/**
 * Smart Daily Cron
 * Runs daily at 20:00.
 * Processes ~1/7th of users based on their ID hash.
 * Logic:
 * - Active in last 7 days? -> Weekly Digest.
 * - Inactive? -> Miss You Reminder.
 */
// ... imports ...

export async function GET(request: Request) {
    try {
        // 1. Security Check (Vercel Cron Secret)
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            // Allow local testing if secret not set, but warn
            if (process.env.NODE_ENV === 'production') {
                return new NextResponse('Unauthorized', { status: 401 });
            }
        }

        const client = await getMongoClient();
        const db = client.db('financeApp');
        const usersCol = db.collection('users');
        const transactionsCol = db.collection('transactions');

        // 2. Determine Day Partitions (Bi-Weekly Coverage)
        // To achieve a ~3.5 day check frequency, we check user's partition AND (partition + 3) % 7
        // Mon (1): Check Part 1 & Part 4
        // Tue (2): Check Part 2 & Part 5
        // ...
        const today = new Date();
        const mainPartition = today.getDay();
        const secondaryPartition = (mainPartition + 3) % 7;

        console.log(`[SmartCron] Running for partitions ${mainPartition} & ${secondaryPartition} (Day ${today.toISOString()})`);

        // 3. Find Users in Partition
        const allUsers = await usersCol.find({ email: { $exists: true, $ne: null } }).project({ _id: 1, email: 1 }).toArray();

        // Filter by Partition
        const targetUsers = allUsers.filter(u => {
            const idStr = u._id.toString();
            let hash = 0;
            for (let i = 0; i < idStr.length; i++) {
                hash = (hash + idStr.charCodeAt(i)) % 7;
            }
            return hash === mainPartition || hash === secondaryPartition;
        });

        console.log(`[SmartCron] Found ${targetUsers.length} users for today.`);

        if (targetUsers.length === 0) {
            return NextResponse.json({ message: "No users for these partitions today" });
        }

        const notificationService = new NotificationService();
        let sentCount = 0;
        let batchLimit = 150; // Increased limit for bi-weekly check

        // 4. Process Batch (Smart Drip)
        for (const user of targetUsers.slice(0, batchLimit)) {
            try {
                // Get Last Transaction Date
                const lastTx = await transactionsCol.findOne(
                    { userId: user._id },
                    { sort: { date: -1 }, projection: { date: 1 } }
                );

                const lastTxDate = lastTx ? new Date(lastTx.date) : new Date(0); // Epoch if no tx
                const daysInactive = Math.floor((today.getTime() - lastTxDate.getTime()) / (1000 * 3600 * 24));

                console.log(`[SmartCron] User ${user._id} inactive for ${daysInactive} days.`);

                if (daysInactive <= 3) {
                    // Active (Last 3 days) -> Weekly Digest
                    // Only send if it's their MAIN partition day (to avoid sending 2x week)
                    const idStr = user._id.toString();
                    let hash = 0;
                    for (let i = 0; i < idStr.length; i++) { hash = (hash + idStr.charCodeAt(i)) % 7; }

                    if (hash === mainPartition) {
                        await notificationService.sendWeeklyDigest(user._id.toString());
                        sentCount++;
                    }
                }
                else if (daysInactive > 3 && daysInactive <= 7) {
                    // Nudge Window (4-7 days)
                    // We catch them here because we run twice a week.
                    await notificationService.sendNudgeEmail(user._id.toString());
                    sentCount++;
                }
                else if (daysInactive > 7 && daysInactive <= 30) {
                    // Standard Inactivity (8-30 days)
                    // Throttle: Only send if Main Partition (Once a week)
                    const idStr = user._id.toString();
                    let hash = 0;
                    for (let i = 0; i < idStr.length; i++) { hash = (hash + idStr.charCodeAt(i)) % 7; }

                    if (hash === mainPartition) {
                        await notificationService.sendInactivityReminder(user._id.toString());
                        sentCount++;
                    }
                }
                else if (daysInactive > 30) {
                    // Comeback (30+ days)
                    // Throttle: Only send once a month? 
                    // NotificationService.sendComebackEmail should handle internal throttling if possible, 
                    // or we rely on 'Main Partition' check to limit to 1x week attempts.
                    const idStr = user._id.toString();
                    let hash = 0;
                    for (let i = 0; i < idStr.length; i++) { hash = (hash + idStr.charCodeAt(i)) % 7; }

                    if (hash === mainPartition) {
                        // We rely on service to not spam (e.g. throttle to 30 days)
                        // But for now, let's just send it.
                        await notificationService.sendComebackEmail(user._id.toString());
                        sentCount++;
                    }
                }

            } catch (err) {
                console.error(`[SmartCron] Error processing user ${user._id}:`, err);
            }
        }

        return NextResponse.json({
            success: true,
            partitions: [mainPartition, secondaryPartition],
            candidates: targetUsers.length,
            processed: sentCount
        });

    } catch (error) {
        console.error('[SmartCron] Error:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
