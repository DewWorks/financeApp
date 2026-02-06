import { NextRequest, NextResponse } from "next/server";
import { getPluggyClient } from "@/lib/pluggy";
import { TransactionSyncService } from "@/services/TransactionSyncService";
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { PluggyItemStatus } from "@/interfaces/IBankConnection";

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
        console.log(`[ManualSync] Triggering updateItem for ${itemId}`);
        try {
            const item = await client.fetchItem(itemId);

            // If item is already updating, just wait
            // We cast status to string to avoid TS errors if the types don't overlap in the current SDK version (until SDK types are updated)
            const status = item.status as unknown as PluggyItemStatus;

            if (status === PluggyItemStatus.UPDATING) {
                console.log(`[ManualSync] Item is already UPDATING, skipping trigger.`);
            } else if (status === PluggyItemStatus.WAITING_USER_INPUT || status === PluggyItemStatus.LOGIN_ERROR) {
                // Return specialized status so frontend can open Widget
                return NextResponse.json({
                    success: false,
                    status: status,
                    error: "Ação do usuário necessária no banco."
                }, { status: 428 });
            } else {
                await client.updateItem(itemId);
            }

            // 2. Poll briefly for completion (or at least progress)
            let attempts = 0;
            while (attempts < 4) {
                await new Promise(r => setTimeout(r, 1000));
                const freshItem = await client.fetchItem(itemId);
                const freshStatus = freshItem.status as unknown as PluggyItemStatus;

                if (freshStatus === PluggyItemStatus.UPDATED) {
                    console.log(`[ManualSync] Item finished updating!`);
                    break;
                }
                if (freshStatus === PluggyItemStatus.WAITING_USER_INPUT || freshStatus === PluggyItemStatus.LOGIN_ERROR) {
                    return NextResponse.json({
                        success: false,
                        status: freshStatus,
                        error: "Credenciais inválidas ou expiradas."
                    }, { status: 428 });
                }
                attempts++;
            }

        } catch (pluggyError: any) {
            console.error(`[ManualSync] Pluggy Update Error: ${pluggyError.message}`);

            // Check for specific Pluggy errors
            const isLoginRequired = pluggyError.message?.includes("LOGIN_REQUIRED") || pluggyError.code === "LOGIN_REQUIRED";
            const isSandboxError = pluggyError.code === 400 && (
                pluggyError.message?.includes("Sandbox") ||
                pluggyError.codeDescription === 'SANDBOX_CLIENT_ITEM_UPDATE_NOT_ALLOWED'
            );

            if (isLoginRequired) {
                return NextResponse.json({ status: "LOGIN_REQUIRED", error: "Login Required" }, { status: 428 });
            }

            if (isSandboxError) {
                // Return 428 to force opening the widget, as API update is blocked
                return NextResponse.json({
                    success: false,
                    status: PluggyItemStatus.WAITING_USER_ACTION,
                    error: "Limite do plano Sandbox. Atualize pelo Widget."
                }, { status: 428 });
            }
        }

        // 3. Sync whatever we have
        // We sync accounts first to update status
        const accResult: any = await TransactionSyncService.syncAccountBalances(userId, itemId);

        // Check if sync failed due to login required
        // We check against the common error codes
        if (accResult?.code === 'LOGIN_REQUIRED' ||
            accResult?.itemStatus === PluggyItemStatus.WAITING_USER_INPUT ||
            accResult?.itemStatus === PluggyItemStatus.LOGIN_ERROR
        ) {
            return NextResponse.json({
                success: false,
                status: 'LOGIN_REQUIRED',
                error: "Login Required"
            }, { status: 428 });
        }

        const txResult = await TransactionSyncService.syncTransactions(userId, itemId);

        return NextResponse.json({ success: true, transactions: txResult, accounts: accResult });

    } catch (error: any) {
        console.error("Error in Manual Sync:", error);

        // Specialized handling
        if (error.message?.includes('LOGIN_REQUIRED') || error.code === 'LOGIN_REQUIRED') {
            return NextResponse.json({ status: "LOGIN_REQUIRED", error: "Login necessário" }, { status: 428 });
        }

        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
