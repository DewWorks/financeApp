import { NextRequest, NextResponse } from "next/server";
import { getMongoClient } from "@/db/connectionDb";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { insightId, feedback, contextType } = body;

        // Idealmente, extrairíamos o userId do token de autenticação (NextAuth)
        // const session = await getServerSession(authOptions);
        // const userId = session?.user?.id;

        if (!insightId || !feedback) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const client = await getMongoClient();
        const db = client.db("financeApp");

        const feedbackDocument = {
            insightId,
            feedback, // 'up' or 'down'
            contextType,
            // userId: userId ? new ObjectId(userId) : null,
            createdAt: new Date()
        };

        await db.collection("ai_feedback").insertOne(feedbackDocument);

        return NextResponse.json({ success: true, message: "Feedback saved" });

    } catch (error) {
        console.error("Error saving insight feedback:", error);
        return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
    }
}
