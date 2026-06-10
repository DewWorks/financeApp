/**
 * CronCursor — persists pagination state for cron jobs.
 * Each cron invocation reads the cursor, processes a small batch, then advances the cursor.
 * This ensures every user is eventually processed without hitting Vercel's 10s timeout.
 */

import { getMongoClient } from "@/db/connectionDb";

export async function getCronCursor(cronName: string): Promise<number> {
    const client = await getMongoClient();
    const db = client.db("financeApp");
    const doc = await db.collection("cron_cursors").findOne({ cronName });
    return doc?.offset ?? 0;
}

export async function setCronCursor(cronName: string, offset: number): Promise<void> {
    const client = await getMongoClient();
    const db = client.db("financeApp");
    await db.collection("cron_cursors").updateOne(
        { cronName },
        { $set: { cronName, offset, updatedAt: new Date() } },
        { upsert: true }
    );
}

export async function resetCronCursor(cronName: string): Promise<void> {
    await setCronCursor(cronName, 0);
}
