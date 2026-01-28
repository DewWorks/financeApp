import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { NotificationService } from "@/services/NotificationService";

export async function POST(req: NextRequest) {
    try {
        // 1. Auth Check (Manual JWT)
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        let userId: string;

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret") as { userId: string, sub?: string };
            userId = decoded.userId || decoded.sub || "";
        } catch (err) {
            console.error("Token verification failed:", err);
            return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
        }

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { plan } = body; // 'PRO' or 'MAX'

        if (!plan) return NextResponse.json({ error: "Missing plan" }, { status: 400 });

        const notifier = new NotificationService();

        // Fire and forget (don't await email sending to keep UI snappy)
        // Fire and forget (don't await email sending to keep UI snappy)
        notifier.sendUpsellEmail(userId, plan).catch(console.error);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Upsell Trigger Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
