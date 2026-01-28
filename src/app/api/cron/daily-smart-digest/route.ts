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

        // 2. Determine Day Partition (0-6)
        // We use current day of week. So Sunday=0, Monday=1...
        // This ensures everyone gets processed once a week on a specific day.
        const today = new Date();
        const partitionKey = today.getDay();

        console.log(`[SmartCron] Running for partition ${partitionKey} (Day ${today.toISOString()})`);

        // 3. Find Users in Partition
        // MongoDB doesn't have a simple "Mod(ObjectId)" query in standard find without aggregation.
        // For performance on large datasets, Aggregation is better.
        // Or fetch all and filter in code (simplest for < 10k users).
        // Let's use aggregation `expr` with `$mod` on a hash of the ID?
        // Simpler: Just rely on JavaScript filtering for now (Safe for up to ~5k users in memory).
        // For production scale > 10k, we would need a persistent 'cronDay' field on User.

        // Let's grab a batch of users to process.
        // Only users with email.
        const allUsers = await usersCol.find({ email: { $exists: true, $ne: null } }).project({ _id: 1, email: 1 }).toArray();

        // Filter by Partition
        const targetUsers = allUsers.filter(u => {
            // Simple hash from ObjectId string
            const idStr = u._id.toString();
            let hash = 0;
            for (let i = 0; i < idStr.length; i++) {
                hash = (hash + idStr.charCodeAt(i)) % 7;
            }
            return hash === partitionKey;
        });

        console.log(`[SmartCron] Found ${targetUsers.length} users for today.`);

        if (targetUsers.length === 0) {
            return NextResponse.json({ message: "No users for this partition today" });
        }

        const notificationService = new NotificationService();
        let sentCount = 0;
        let batchLimit = 50; // Safety limit for Vercel Function Timeout (10s default)

        // 4. Process Batch
        for (const user of targetUsers.slice(0, batchLimit)) {
            try {
                // Check Activity (Last 7 Days)
                const lastWeek = new Date();
                lastWeek.setDate(lastWeek.getDate() - 7);

                const recentTx = await transactionsCol.findOne({
                    userId: user._id,
                    date: { $gte: lastWeek }
                });

                if (recentTx) {
                    // Active -> Weekly Digest
                    await notificationService.sendWeeklyDigest(user._id.toString());
                } else {
                    // Inactive -> Reminder
                    await notificationService.sendInactivityReminder(user._id.toString());
                }
                sentCount++;
            } catch (err) {
                console.error(`[SmartCron] Error processing user ${user._id}:`, err);
            }
        }

        return NextResponse.json({
            success: true,
            partition: partitionKey,
            candidates: targetUsers.length,
            processed: sentCount
        });

    } catch (error) {
        console.error('[SmartCron] Error:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
