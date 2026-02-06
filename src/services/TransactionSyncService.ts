import { getPluggyClient } from "@/lib/pluggy";
import { getMongoClient } from "@/db/connectionDb";
import { Transaction } from "@/app/models/Transaction";
import { ITransaction, expenseTags, incomeTags } from "@/interfaces/ITransaction";
import { ObjectId } from "mongodb";
import { PluggyItemStatus } from "@/interfaces/IBankConnection";

export class TransactionSyncService {

    /**
     * Maps Pluggy Categories to our internal Tags
     * This is a "Best Effort" mapping.
     */
    private static mapCategoryToTag(pluggyCategory: string | undefined): string {
        if (!pluggyCategory) return "Outros";

        const lowerCat = pluggyCategory.toLowerCase();

        // 1. Alimentação
        if (lowerCat.includes("food") ||
            lowerCat.includes("alimentação") ||
            lowerCat.includes("restaurante") ||
            lowerCat.includes("groceries") ||
            lowerCat.includes("supermarket") ||
            lowerCat.includes("eating out") ||
            lowerCat.includes("bakery") ||
            lowerCat.includes("delivery")) return "Alimentação";

        // 2. Transporte
        if (lowerCat.includes("transport") ||
            lowerCat.includes("uber") ||
            lowerCat.includes("taxi") ||
            lowerCat.includes("ride-hailing") ||
            lowerCat.includes("parking") ||
            lowerCat.includes("fuel") ||
            lowerCat.includes("combustível") ||
            lowerCat.includes("posto")) return "Transporte";

        // 3. Saúde
        if (lowerCat.includes("health") ||
            lowerCat.includes("saúde") ||
            lowerCat.includes("farmácia") ||
            lowerCat.includes("drugstore") ||
            lowerCat.includes("doctor") ||
            lowerCat.includes("hospital") ||
            lowerCat.includes("dentist")) return "Saúde";

        // 4. Lazer
        if (lowerCat.includes("entertainment") ||
            lowerCat.includes("lazer") ||
            lowerCat.includes("cinema") ||
            lowerCat.includes("streaming") ||
            lowerCat.includes("video") ||
            lowerCat.includes("music") ||
            lowerCat.includes("games") ||
            lowerCat.includes("bar")) return "Lazer";

        // 5. Educação
        if (lowerCat.includes("education") ||
            lowerCat.includes("educação") ||
            lowerCat.includes("school") ||
            lowerCat.includes("college") ||
            lowerCat.includes("course") ||
            lowerCat.includes("book")) return "Educação";

        // 6. Aluguel/Moradia
        if (lowerCat.includes("rent") ||
            lowerCat.includes("aluguel") ||
            lowerCat.includes("condo") ||
            lowerCat.includes("condomínio")) return "Aluguel";

        // 7. Custos de Vida / Serviços / Outros
        if (lowerCat.includes("bill") ||
            lowerCat.includes("conta") ||
            lowerCat.includes("utilities") ||
            lowerCat.includes("electricity") ||
            lowerCat.includes("water") ||
            lowerCat.includes("internet") ||
            lowerCat.includes("telephone") ||
            lowerCat.includes("insurance") ||
            lowerCat.includes("seguro") ||
            lowerCat.includes("services")) return "Custos de Vida";

        // 8. Renda/Investimentos
        if (lowerCat.includes("salary") || lowerCat.includes("salário")) return "Salário";
        if (lowerCat.includes("investment") || lowerCat.includes("investimento")) return "Investimentos";
        if (lowerCat.includes("interest") || lowerCat.includes("rendimento")) return "Investimentos";

        return "Outros";
    }

    /**
     * Syncs transactions for a specific Item (Bank Connection)
     */
    /**
     * Syncs transactions for a specific Item (Bank Connection)
     */
    static async syncTransactions(userId: string | ObjectId, itemId: string) {
        console.log(`[SyncService] Starting sync for user ${userId} and item ${itemId}`);

        const client = getPluggyClient();
        const mongoClient = await getMongoClient();
        // Ensure connection
        await mongoClient.connect();

        try {
            // 1. Fetch transactions from Pluggy with Pagination
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - 60); // Look back 60 days to be safe

            // Fetch Accounts
            let accountsRes;
            try {
                accountsRes = await client.fetchAccounts(itemId);
            } catch (err: any) {
                console.warn(`[SyncService] Failed to fetch accounts for item ${itemId}: ${err.message}`);
                // If we can't fetch accounts, likely the item is broken or requires login
                throw err;
            }

            const accountTypeMap = new Map<string, string>(); // accountId -> type
            accountsRes.results.forEach(acc => accountTypeMap.set(acc.id, acc.type));

            let pluggyTransactions: any[] = [];

            // Helper to fetch all pages for a given resource (account or item)
            // Note: client.fetchTransactions(itemId) fetches for ALL accounts if they support it.
            // Some connectors require fetching per account.

            const fetchAllPages = async (resourceId: string, isAccount = false) => {
                let allTx: any[] = [];
                let page = 1;
                let totalPages = 1;

                while (page <= totalPages) {
                    try {
                        const response = await client.fetchTransactions(resourceId, {
                            from: fromDate.toISOString().split('T')[0],
                            pageSize: 500,
                            page: page
                        });

                        allTx = [...allTx, ...response.results];
                        totalPages = response.totalPages;
                        page++;

                        // Safety break to prevent infinite loops in case of API weirdness
                        if (page > 20) break;
                    } catch (e: any) {
                        console.warn(`[SyncService] Error fetching page ${page} for ${resourceId}: ${e.message}`);
                        // If one page fails, we might still want to process what we have, or stop.
                        // For now, if page 1 fails, it's critical.
                        if (page === 1) throw e;
                        break;
                    }
                }
                return allTx;
            };

            try {
                // Try Item-level fetch first
                pluggyTransactions = await fetchAllPages(itemId);
            } catch (e: any) {
                // If Item-level fetch is not supported or fails, fall back to Account-level
                console.warn(`[SyncService] Item-level fetch failed (${e.message}), trying per-account...`);

                // Check if error is actionable (e.g. LOGIN_REQUIRED)
                if (e.code === 'LOGIN_REQUIRED' || e.message?.includes('LOGIN_REQUIRED')) {
                    throw e; // Bubble up for manual sync handling
                }

                for (const account of accountsRes.results) {
                    try {
                        const accTx = await fetchAllPages(account.id, true);
                        pluggyTransactions = [...pluggyTransactions, ...accTx];
                    } catch (accErr: any) {
                        console.warn(`[SyncService] Failed to fetch for account ${account.id}: ${accErr.message}`);
                    }
                }
            }

            console.log(`[SyncService] Found ${pluggyTransactions.length} transactions in Pluggy.`);

            // =========================================================
            // OPTIMIZATION: DELTA SYNC & BULK WRITE
            // =========================================================

            const db = mongoClient.db("financeApp");
            const collection = db.collection("transactions");

            // A. Identify NEW vs EXISTING
            const pluggyIds = pluggyTransactions.map(t => t.id);
            if (pluggyIds.length === 0) return { success: true, new: 0, updated: 0 };

            const existingDocs = await collection.find(
                { pluggyTransactionId: { $in: pluggyIds } }
            ).project({ pluggyTransactionId: 1 }).toArray();

            const existingIds = new Set(existingDocs.map(d => d.pluggyTransactionId));
            const newTransactions = pluggyTransactions.filter(t => !existingIds.has(t.id));

            console.log(`[SyncService] Analysis: ${existingIds.size} existing, ${newTransactions.length} new.`);

            // B. Enrich ONLY New Transactions
            // Import AiService dynamically
            const { AiService } = await import("./AiService");
            let enrichedMap = new Map();

            if (newTransactions.length > 0) {
                console.log(`[SyncService] Enriching ${newTransactions.length} new transactions with AI...`);
                // Process in chunks if too many new ones (rare in incremental sync)
                const enrichedData = await AiService.enrichTransactions(newTransactions.slice(0, 50), userId.toString());
                enrichedMap = new Map(enrichedData.map(e => [e.pluggyTransactionId, e]));
            }

            // C. Build Bulk Operations
            const bulkOps = pluggyTransactions.map(pt => {
                const isNew = !existingIds.has(pt.id);
                const accountType = accountTypeMap.get(pt.accountId) || 'BANK';
                const isCreditCard = accountType === 'CREDIT' || accountType === 'CREDIT_CARD';

                // Basic Logic for type/amount
                let type: 'income' | 'expense' | 'transfer';
                let amount = Math.abs(pt.amount);
                const descriptionLower = pt.description ? pt.description.toLowerCase() : "";
                const categoryLower = pt.category ? pt.category.toLowerCase() : "";

                const isBillPayment = descriptionLower.includes("pagamento recebido") ||
                    descriptionLower.includes("pagamento de fatura") ||
                    descriptionLower.includes("valor adicionado na conta") ||
                    categoryLower.includes("transfer - internal");

                if (isBillPayment) {
                    type = 'transfer';
                } else if (isCreditCard) {
                    type = pt.amount > 0 ? 'expense' : 'income';
                } else {
                    type = pt.amount < 0 ? 'expense' : 'income';
                }

                const transactionDate = pt.date instanceof Date ? pt.date : new Date(pt.date);
                let status: 'PENDING' | 'POSTED' = pt.status === 'PENDING' ? 'PENDING' : 'POSTED';

                // Common fields update (Status, Amount sync)
                const commonUpdate = {
                    status: status,
                    paymentType: pt.paymentData?.paymentMethod || undefined,
                    merchantName: pt.merchant ? pt.merchant.name : undefined,
                    // Optionally update amount/date if bank changed it? usually safe.
                    amount: amount,
                    date: transactionDate,
                    updatedAt: new Date()
                };

                if (isNew) {
                    // NEW: Full Insert with AI Data
                    const enriched = enrichedMap.get(pt.id);
                    const finalDescription = enriched ? enriched.cleanDescription : pt.description;
                    const finalTag = enriched ? enriched.category : this.mapCategoryToTag(pt.category || undefined);

                    return {
                        updateOne: {
                            filter: { pluggyTransactionId: pt.id },
                            update: {
                                $set: {
                                    ...commonUpdate,
                                    userId: new ObjectId(userId),
                                    provider: 'pluggy',
                                    accountId: pt.accountId,
                                    description: finalDescription,
                                    tag: finalTag,
                                    category: pt.category || undefined,
                                    type: type,
                                    descriptionRaw: pt.description,
                                },
                                $setOnInsert: { createdAt: new Date() }
                            },
                            upsert: true
                        }
                    };
                } else {
                    // EXISTING: Update only Status/Metadata (Protect User Edits)
                    // We DO NOT overwrite description/tag if user might have edited it manually?
                    // Ideally we should have a flag 'userEdited'. For now, we trust the DB state for description/tag.
                    return {
                        updateOne: {
                            filter: { pluggyTransactionId: pt.id },
                            update: {
                                $set: commonUpdate
                            }
                        }
                    };
                }
            });

            // D. Execute Bulk
            if (bulkOps.length > 0) {
                const res = await collection.bulkWrite(bulkOps);
                console.log(`[SyncService] Bulk Write Result: ${res.upsertedCount} inserted, ${res.modifiedCount} updated.`);

                // NEW: Trigger Smart Alerts if we have new transactions
                if (res.upsertedCount > 0) {
                    import("./NotificationService").then(({ NotificationService }) => {
                        const notifier = new NotificationService();
                        notifier.checkAndSendAlerts(userId.toString()).catch(e => console.error("[SyncService] Alert Error:", e));
                    });
                }

                return { success: true, new: res.upsertedCount, updated: res.modifiedCount };
            }

            return { success: true, new: 0, updated: 0 };

        } catch (error: any) {
            console.error(`[SyncService] Error syncing transactions:`, error);
            // Re-throw to let the caller handle it (e.g. Manual Sync needs to know)
            throw error;
        }
    }

    /**
     * Syncs Account Balances and Status for an Item
     */
    static async syncAccountBalances(userId: string | ObjectId, itemId: string) {
        console.log(`[SyncService] Syncing Account Balances for item ${itemId}`);
        const client = getPluggyClient();
        const mongoClient = await getMongoClient();

        try {
            // 1. Fetch Latest Item Status First (Critical for error handling)
            const item = await client.fetchItem(itemId);

            // 2. Fetch Fresh Account Data
            const accountsResponse = await client.fetchAccounts(itemId);
            const accounts = accountsResponse.results;

            if (accounts.length === 0 &&
                item.status !== PluggyItemStatus.WAITING_USER_INPUT &&
                item.status !== PluggyItemStatus.LOGIN_ERROR
            ) return { success: true, itemStatus: item.status };

            // 3. Update BankConnection Document
            const updateData: any = {
                status: item.status as PluggyItemStatus, // Update status regardless
                lastSyncAt: new Date(),
                updatedAt: new Date()
            };

            if (accounts.length > 0) {
                updateData.accounts = accounts.map((acc: any) => ({
                    accountId: acc.id,
                    name: acc.name,
                    number: acc.number,
                    balance: acc.balance,
                    currency: acc.currencyCode,
                    type: acc.type,
                    subtype: acc.subtype
                }));
            }

            // Add execution status details if available (helpful for frontend)
            if (item.executionStatus) {
                (updateData as any).executionStatus = item.executionStatus;
            }

            const db = mongoClient.db("financeApp");
            await db.collection('bankConnections').updateOne(
                { itemId: itemId },
                { $set: updateData }
            );

            console.log(`[SyncService] Accounts updated for Item ${itemId}. Status: ${item.status}`);
            return { success: true, itemStatus: item.status };

        } catch (error: any) {
            console.error(`[SyncService] Error syncing accounts:`, error);

            // Handle Pluggy 400/404
            if (error.response?.status === 400 || error.code === 400) {
                console.warn(`[SyncService] Item ${itemId} seems invalid or deleted on Pluggy.`);
                return { success: false, error: "Item inválido ou removido na origem.", code: "ITEM_NOT_FOUND" };
            }
            // Pass identifying codes
            return { success: false, error: error.message, code: error.code || "UNKNOWN" };
        }
    }
}
