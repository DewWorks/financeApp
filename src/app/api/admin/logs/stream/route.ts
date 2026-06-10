import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getMongoClient } from "@/db/connectionDb";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/logs/stream
 * Server-Sent Events — streams last 100 logs then tails new ones via MongoDB Change Stream.
 * Secured with requireAdmin (JWT + DB admin flag).
 */
export async function GET(request: Request) {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const client = await getMongoClient();
    const db = client.db("financeApp");
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const send = (data: object) => {
                try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); } catch {}
            };

            try {
                // Send last 100 logs immediately on connect
                const recentLogs = await db.collection("system_logs")
                    .find({})
                    .sort({ timestamp: -1 })
                    .limit(100)
                    .toArray();

                recentLogs.reverse().forEach(log => {
                    send({ id: log._id.toString(), level: log.level, message: log.message, context: log.context, timestamp: log.timestamp, meta: log.meta });
                });

                send({ type: "connected", timestamp: new Date().toISOString() });

                // Tail new inserts via change stream
                const changeStream = db.collection("system_logs").watch([], { fullDocument: "updateLookup" });

                request.signal?.addEventListener("abort", () => {
                    changeStream.close();
                    try { controller.close(); } catch {}
                });

                for await (const change of changeStream) {
                    if (change.operationType === "insert" && change.fullDocument) {
                        const doc = change.fullDocument;
                        send({ id: doc._id.toString(), level: doc.level, message: doc.message, context: doc.context, timestamp: doc.timestamp, meta: doc.meta });
                    }
                }
            } catch (err: any) {
                send({ type: "error", message: err.message });
                try { controller.close(); } catch {}
            }
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    });
}
