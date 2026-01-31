import { NextResponse } from 'next/server';
import { getMongoClient } from '@/db/connectionDb';

export const dynamic = 'force-dynamic';

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        const envStatus = {
            CRON_SECRET_SET: !!process.env.CRON_SECRET,
            NODE_ENV: process.env.NODE_ENV,
        };

        if (!email) {
            return NextResponse.json({
                error: 'Email is required',
                envStatus
            }, { status: 400 });
        }

        const client = await getMongoClient();
        const db = client.db('financeApp');

        // Case-insensitive search
        const safeEmail = escapeRegExp(email);
        let user = await db.collection('users').findOne({
            email: { $regex: new RegExp(`^${safeEmail}$`, 'i') }
        });

        if (!user) {
            // Debugging: Fetch first 3 users to verify DB connection and content
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const sampleUsers = await db.collection('users').find({}, { projection: { email: 1, name: 1 } }).limit(3).toArray();

            return NextResponse.json({
                error: 'User not found',
                inputEmail: email,
                searchedWithRegex: true,
                databaseName: db.databaseName,
                sampleUsersFromDb: sampleUsers,
                envStatus
            }, { status: 404 });
        }

        // 1. Calculate Partition
        const idStr = user._id.toString();
        let hash = 0;
        for (let i = 0; i < idStr.length; i++) {
            hash = (hash + idStr.charCodeAt(i)) % 7;
        }

        const today = new Date();
        const currentPartitionDay = today.getDay();
        const secondaryPartitionDay = (currentPartitionDay + 3) % 7;

        const cronMain = currentPartitionDay;
        const cronSec = secondaryPartitionDay;

        const isMatch = hash === cronMain || hash === cronSec;
        const isMainMatch = hash === cronMain;

        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // 2. Check Activity (Last Transaction)
        const lastTx = await db.collection('transactions').findOne(
            { userId: user._id },
            { sort: { date: -1 }, projection: { date: 1 } }
        );
        const lastTxDate = lastTx ? new Date(lastTx.date) : new Date(0);
        const daysInactive = Math.floor((today.getTime() - lastTxDate.getTime()) / (1000 * 3600 * 24));


        // 3. Determine Result
        let sendStatus = "NO";
        let reason = "";
        let emailType = "NONE";

        if (!isMatch) {
            reason = `Not today. User partition is ${daysOfWeek[hash]} (${hash}). Cron checks ${daysOfWeek[cronMain]} & ${daysOfWeek[cronSec]}.`;
        } else {
            // It IS a match, check logic
            if (daysInactive <= 3) {
                if (isMainMatch) {
                    sendStatus = "YES";
                    emailType = "Weekly Digest";
                    reason = `Active recently (${daysInactive} days ago) & Main Partition Match.`;
                } else {
                    reason = `Active recently, but Secondary Partition (only send Digest on Main).`;
                }
            }
            else if (daysInactive > 3 && daysInactive <= 7) {
                sendStatus = "YES";
                emailType = "Nudge Email (3-Day)";
                reason = `Inactive for ${daysInactive} days. Nudge window active.`;
            }
            else if (daysInactive > 7 && daysInactive <= 30) {
                if (isMainMatch) {
                    sendStatus = "YES";
                    emailType = "Inactivity Reminder";
                    reason = `Inactive for ${daysInactive} days. Standard reminder (Main Partition).`;
                } else {
                    reason = `Inactive (${daysInactive}d), but Secondary Partition (wait for Main).`;
                }
            }
            else if (daysInactive > 30) {
                if (isMainMatch) {
                    sendStatus = "YES";
                    emailType = "Comeback Email";
                    reason = `Inactive for ${daysInactive} days. Comeback Campaign.`;
                } else {
                    reason = `Inactive (${daysInactive}d), wait for Main Partition.`;
                }
            }
        }

        return NextResponse.json({
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                partition: `${daysOfWeek[hash]} (${hash})`
            },
            diagnosis: {
                currentDate: today.toISOString(),
                cronPartitionsToCheck: `${daysOfWeek[cronMain]} & ${daysOfWeek[cronSec]}`,
                daysInactive: daysInactive,
                lastTransaction: lastTxDate.toISOString(),
                envStatus
            },
            prediction: {
                wouldSendEmail: sendStatus,
                emailType,
                reason
            }
        });

    } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return NextResponse.json({ error: 'Internal Error', details: (error as any).message }, { status: 500 });
    }
}
