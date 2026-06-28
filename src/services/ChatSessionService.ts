import { getMongoClient } from "@/db/connectionDb";
import { ObjectId } from "mongodb";

const MAX_HISTORY = 20; // Keep last 20 exchanges (10 user + 10 model)

interface ChatMessage {
    role: "user" | "model";
    parts: [{ text: string }];
}

export class ChatSessionService {
    /**
     * Append a new message to the user's chat session history.
     */
    static async saveMessage(userId: string, role: "user" | "model", text: string): Promise<void> {
        try {
            const client = await getMongoClient();
            const db = client.db("financeApp");

            const newMessage: ChatMessage = {
                role,
                parts: [{ text }]
            };

            await db.collection("chat_sessions").updateOne(
                { userId: new ObjectId(userId) },
                {
                    $push: {
                        messages: {
                            $each: [newMessage],
                            $slice: -MAX_HISTORY // Keep only last N messages
                        } as any
                    },
                    $set: { updatedAt: new Date() }
                },
                { upsert: true }
            );
        } catch (error) {
            // Non-critical – don't let this break the chat flow
            console.error("[ChatSessionService] Failed to save message:", error);
        }
    }

    /**
     * Get the full chat history for a user (for Gemini startChat history).
     * Gemini strictly requires:
     * 1. The first message must have role "user".
     * 2. Roles must strictly alternate (user -> model -> user -> model).
     * 3. The history must end with a "model" message before calling sendMessage (which sends a user message).
     */
    static async getHistory(userId: string): Promise<ChatMessage[]> {
        try {
            const client = await getMongoClient();
            const db = client.db("financeApp");

            const session = await db.collection("chat_sessions").findOne(
                { userId: new ObjectId(userId) },
                { projection: { messages: 1 } }
            );

            const rawHistory = (session?.messages as ChatMessage[]) || [];
            
            // Normalize history for Gemini
            const validHistory: ChatMessage[] = [];
            let expectedRole: "user" | "model" = "user";

            for (const msg of rawHistory) {
                if (msg.role === expectedRole) {
                    validHistory.push(msg);
                    expectedRole = expectedRole === "user" ? "model" : "user";
                }
            }
            
            // The history passed to startChat MUST end with 'model' so the next sendMessage ('user') maintains alternating pattern.
            if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === "user") {
                validHistory.pop();
            }

            return validHistory;
        } catch (error) {
            console.error("[ChatSessionService] Failed to get history:", error);
            return [];
        }
    }

    /**
     * Clear the chat history for a user (e.g., "new conversation").
     */
    static async clearHistory(userId: string): Promise<void> {
        try {
            const client = await getMongoClient();
            const db = client.db("financeApp");
            await db.collection("chat_sessions").updateOne(
                { userId: new ObjectId(userId) },
                { $set: { messages: [], updatedAt: new Date() } }
            );
        } catch (error) {
            console.error("[ChatSessionService] Failed to clear history:", error);
        }
    }

    /**
     * Get history formatted for the frontend (simpler format).
     */
    static async getHistoryForFrontend(userId: string): Promise<{ role: string; text: string; timestamp: Date }[]> {
        try {
            const client = await getMongoClient();
            const db = client.db("financeApp");

            const session = await db.collection("chat_sessions").findOne(
                { userId: new ObjectId(userId) },
                { projection: { messages: 1, updatedAt: 1 } }
            );

            if (!session?.messages) return [];

            return (session.messages as ChatMessage[]).map((m, i) => ({
                role: m.role,
                text: m.parts[0]?.text || "",
                timestamp: session.updatedAt || new Date()
            }));
        } catch {
            return [];
        }
    }
}
