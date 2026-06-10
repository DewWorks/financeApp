/**
 * SystemLogger — persists structured logs to MongoDB system_logs collection.
 * Used by cron jobs and services for real-time monitoring in the admin panel.
 */

export type LogLevel = "INFO" | "WARN" | "ERROR" | "SUCCESS";

interface LogEntry {
    level: LogLevel;
    context: string;
    message: string;
    meta?: object;
    timestamp: Date;
}

async function persistLog(entry: LogEntry) {
    try {
        // Dynamic import to avoid circular deps and to make this non-blocking
        const { getMongoClient } = await import("@/db/connectionDb");
        const client = await getMongoClient();
        const db = client.db("financeApp");
        await db.collection("system_logs").insertOne(entry);

        // Auto-prune: keep only last 2000 logs
        const count = await db.collection("system_logs").countDocuments();
        if (count > 2000) {
            const oldest = await db.collection("system_logs")
                .find({})
                .sort({ timestamp: 1 })
                .limit(count - 2000)
                .project({ _id: 1 })
                .toArray();
            if (oldest.length > 0) {
                await db.collection("system_logs").deleteMany({
                    _id: { $in: oldest.map(o => o._id) }
                });
            }
        }
    } catch {
        // Never throw from logger
    }
}

export const SystemLogger = {
    info: (context: string, message: string, meta?: object) => {
        console.log(`[${context}] ${message}`, meta || "");
        persistLog({ level: "INFO", context, message, meta, timestamp: new Date() });
    },
    warn: (context: string, message: string, meta?: object) => {
        console.warn(`[${context}] WARN: ${message}`, meta || "");
        persistLog({ level: "WARN", context, message, meta, timestamp: new Date() });
    },
    error: (context: string, message: string, meta?: object) => {
        console.error(`[${context}] ERROR: ${message}`, meta || "");
        persistLog({ level: "ERROR", context, message, meta, timestamp: new Date() });
    },
    success: (context: string, message: string, meta?: object) => {
        console.log(`[${context}] ✓ ${message}`, meta || "");
        persistLog({ level: "SUCCESS", context, message, meta, timestamp: new Date() });
    }
};
