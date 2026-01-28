import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NotificationService } from "@/services/NotificationService";

export async function POST(req: NextRequest) {
    try {
        // 1. Auth Check
        //        const token = await getToken({ req });
        //        if (!token || !token.sub) {
        // Allow loose auth for now or handle strict session?
        // Usually UpgradeModal is shown to logged users, but let's be safe.
        //            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        //        }
        //        const userId = token.sub;

        // Note: getToken might require secret/env setup properly. 
        // For simplicity/speed in this context, assuming standard NextAuth session cookie is present.
        // If getToken fails, we might need another way to get UserID.
        // Let's assume passed in body for now OR use a robust session getter.

        // Simpler way if Client sends userId? No, insecure.
        // Let's rely on token. If it fails, we skip sending (fail safe).

        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!token?.sub) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { plan } = body; // 'PRO' or 'MAX'

        if (!plan) return NextResponse.json({ error: "Missing plan" }, { status: 400 });

        const notifier = new NotificationService();

        // Fire and forget (don't await email sending to keep UI snappy)
        notifier.sendUpsellEmail(token.sub, plan).catch(console.error);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Upsell Trigger Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
