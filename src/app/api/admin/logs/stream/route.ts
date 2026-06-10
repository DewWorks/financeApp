import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getMongoClient } from "@/db/connectionDb";
import { ObjectId } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

async function isAdmin(): Promise<boolean> {
    try {
        const token = (await cookies()).get("auth_token")?.value;
        if (!token) return false;
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        const client = await getMongoClient();
        const db = client.db("financeApp");
        const user = await db.collection("users").findOne(
            { _id: new ObjectId(decoded.userId) },
            { projection: { admin: 1 } }
        );
        return user?.admin === true;
    } catch {
        return false;
    }
}

/**
 * GET /api/admin/logs/stream
 * Server-Sent Events endpoint — streams the last 100 system logs and tails new ones.
 * Only accessible by admin users.
 */
export async function GET(request: Request) {
    if (!await isAdmin()) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const client = await getMongoClient();
    const db = client.db("financeApp");

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const send = (data: object) => {
                try {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                } catch {
                    // Controller closed
                }
            };

            // Send last 100 logs immediately
            try {
                const recentLogs = await db.collection("system_logs")
                    .find({})
                    .sort({ timestamp: -1 })
                    .limit(100)
                    .toArray();

                recentLogs.reverse().forEach(log => {
                    send({
                        id: log._id.toString(),
                        level: log.level,
                        message: log.message,
                        context: log.context,
                        timestamp: log.timestamp,
                        meta: log.meta
                    });
                });

                // Heartbeat every 15s to keep connection alive
                send({ type: "connected", timestamp: new Date().toISOString() });

                // Tail new logs via change stream
                const changeStream = db.collection("system_logs").watch([], { fullDocument: "updateLookup" });

                // Abort when client disconnects
                request.signal?.addEventListener("abort", () => {
                    changeStream.close();
                    try { controller.close(); } catch {}
                });

                for await (const change of changeStream) {
                    if (change.operationType === "insert" && change.fullDocument) {
                        const doc = change.fullDocument;
                        send({
                            id: doc._id.toString(),
                            level: doc.level,
                            message: doc.message,
                            context: doc.context,
                            timestamp: doc.timestamp,
                            meta: doc.meta
                        });
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
