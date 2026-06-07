import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { FinanceAgentService } from "@/services/FinanceAgentService";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

async function getUserIdFromToken() {
    const token = (await cookies()).get("auth_token")?.value;
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        return decoded.userId;
    } catch {
        return null;
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getUserIdFromToken();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { message } = body;

        if (!message || typeof message !== "string") {
            return NextResponse.json({ error: "Message is required and must be a string." }, { status: 400 });
        }

        const agent = new FinanceAgentService();
        const reply = await agent.processMessage(message, userId);

        return NextResponse.json({ response: reply });
    } catch (error: any) {
        console.error("[Agent Chat API] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
