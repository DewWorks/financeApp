import { NextRequest, NextResponse } from "next/server";
import { getMongoClient } from "@/db/connectionDb";
import { TransactionSyncService } from "@/services/TransactionSyncService";
import { BankConnection } from "@/app/models/BankConnection";

/**
 * Handles Webhook events from Pluggy.
 * URL: /api/webhooks/pluggy
 */
export async function POST(req: NextRequest) {
    try {
        const event = await req.json();
        console.log(`[Webhook] Received Pluggy Event: ${event.event} for Item: ${event.itemId}`);

        // We only care about transaction updates
        // TRANSACTIONS_NEW: New transactions found
        // ITEM_UPDATED: Item reached "UPDATED" status (often means sync complete)
        // SYNC_COMPLETED: (Deprecated in some versions but useful if available)
        const relevantEvents = ['TRANSACTIONS_NEW', 'ITEM_UPDATED'];

        if (!relevantEvents.includes(event.event)) {
            // Acknowledge unrelated events to stop retries
            return NextResponse.json({ message: "Ignored event type" });
        }

        const itemId = event.itemId;

        // 1. Find User associated with this Item
        const client = await getMongoClient();
        await client.connect(); // Ensure connection for Mongoose model usage if using raw, but here we use Mongoose model

        // Mongoose might not be connected if this is a cold start lambda, ensure DB connect
        // Note: In NextJS app router, usually connection is handled globally or per-request utils. 
        // We use BankConnection model.

        const connection = await BankConnection.findOne({ itemId: itemId });

        if (!connection) {
            console.error(`[Webhook] No BankConnection found for itemId: ${itemId}`);
            // Return 200 to stop Pluggy from retrying a dead item
            return NextResponse.json({ message: "Connection not found" });
        }

        const userId = connection.userId;

        // 2. Trigger Sync
        // We do not await this heavily if we want to return quick response,
        // but Vercel functions might kill the process if we return too early.
        // Best to await since it's a critical sync.

        console.log(`[Webhook] Triggering Sync & Balance Update for ${itemId}`);
        const syncResult = await TransactionSyncService.syncTransactions(userId, itemId);
        await TransactionSyncService.syncAccountBalances(userId, itemId);

        return NextResponse.json({
            success: true,
            synced: syncResult
        });
    } catch (error: any) {
        console.error("[Webhook] Error processing event:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
