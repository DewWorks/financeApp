import { NextRequest, NextResponse } from "next/server";
import { getPluggyClient } from "@/lib/pluggy";
import { TransactionSyncService } from "@/services/TransactionSyncService";
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function getUserId() {
    const token = (await cookies()).get('auth_token')?.value
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
        return new ObjectId(decoded.userId)
    } catch (err) {
        return null;
    }
}

/**
 * Force manual sync for an item
 * POST /api/bank-connections/sync?itemId=...
 */
export async function POST(req: NextRequest) {
    try {
        const userId = await getUserId();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const itemId = searchParams.get('itemId');

        if (!itemId) {
            return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
        }

        const client = getPluggyClient();

        // 1. Trigger Pluggy Update
        // This forces Pluggy to go to the bank
        try {
            const item = await client.fetchItem(itemId);

            // If item is already updating, just wait
            if (item.status !== 'UPDATING') {
                console.log(`[ManualSync] Triggering updateItem for ${itemId}`);
                await client.updateItem(itemId);
            }
        } catch (pluggyError: any) {
            console.error(`[ManualSync] Pluggy Update Error: ${pluggyError.message}`);
            // If error is about credentials, frontend handles it via status check
        }

        // 2. Sync whatever we have
        // We sync accounts first to update status
        const accResult = await TransactionSyncService.syncAccountBalances(userId, itemId);
        if (!accResult?.success) {
            return NextResponse.json({
                error: accResult?.error || "Erro ao sincronizar contas",
                details: "Verifique se a conexão ainda é válida."
            }, { status: 400 });
        }

        const txResult = await TransactionSyncService.syncTransactions(userId, itemId);

        return NextResponse.json({ success: true, transactions: txResult, accounts: accResult });

    } catch (error: any) {
        console.error("Error in Manual Sync:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
