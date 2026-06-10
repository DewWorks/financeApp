import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getMongoClient } from "@/db/connectionDb";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/logs?since=<ISO>&limit=<n>
 * Returns logs from the MongoDB system_logs collection.
 * - since: ISO timestamp — return only logs newer than this (for polling)
 * - limit: max number of logs to return (default 200, max 500)
 *
 * Polling-based instead of SSE — works reliably on Vercel Hobby (no 10s SSE timeout).
 */
export async function GET(request: Request) {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since");
    const limit = Math.min(parseInt(searchParams.get("limit") || "200"), 500);

    try {
        const client = await getMongoClient();
        const db = client.db("financeApp");

        const query: any = {};
        if (since) {
            const sinceDate = new Date(since);
            if (!isNaN(sinceDate.getTime())) {
                query.timestamp = { $gt: sinceDate };
            }
        }

        const logs = await db.collection("system_logs")
            .find(query)
            .sort({ timestamp: since ? 1 : -1 }) // ascending for new entries, descending for initial load
            .limit(limit)
            .toArray();

        // If initial load (no since), reverse so oldest is first
        const ordered = since ? logs : [...logs].reverse();

        return NextResponse.json({
            logs: ordered.map(l => ({
                id: l._id.toString(),
                level: l.level,
                context: l.context,
                message: l.message,
                timestamp: l.timestamp,
                meta: l.meta ?? null,
            })),
            count: ordered.length,
            serverTime: new Date().toISOString(),
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
