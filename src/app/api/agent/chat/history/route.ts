import { NextResponse } from "next/server";
import { getUserIdFromToken } from "@/app/functions/getUserId";
import { ChatSessionService } from "@/services/ChatSessionService";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const userId = await getUserIdFromToken();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const history = await ChatSessionService.getHistoryForFrontend(userId.toString());
        return NextResponse.json({ history });
    } catch (error) {
        console.error("[Chat History API] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        const userId = await getUserIdFromToken();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await ChatSessionService.clearHistory(userId.toString());
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Chat History Delete API] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
