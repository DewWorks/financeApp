import { getPluggyClient } from "@/lib/pluggy";
import { getMongoClient } from "@/db/connectionDb";
import { Transaction } from "@/app/models/Transaction";
import { ITransaction, expenseTags, incomeTags } from "@/interfaces/ITransaction";
import { ObjectId } from "mongodb";

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
            // 1. Fetch transactions from Pluggy
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - 60);

            // Fetch Accounts
            const accountsRes = await client.fetchAccounts(itemId);
            const accountTypeMap = new Map<string, string>(); // accountId -> type
            accountsRes.results.forEach(acc => accountTypeMap.set(acc.id, acc.type));

            let pluggyTransactions: any[] = [];

            try {
                const response = await client.fetchTransactions(itemId, {
                    from: fromDate.toISOString().split('T')[0],
                    pageSize: 500
                });
                pluggyTransactions = response.results;
            } catch (e) {
                console.warn("[SyncService] Failed to fetch by ItemId, will try accounts.");
            }

            if (pluggyTransactions.length === 0) {
                console.log(`[SyncService] No transactions found for Item ${itemId}. Trying per-account fetch...`);
                for (const account of accountsRes.results) {
                    const accResponse = await client.fetchTransactions(account.id, {
                        from: fromDate.toISOString().split('T')[0],
                        pageSize: 500
                    });
                    if (accResponse.results.length > 0) {
                        pluggyTransactions = [...pluggyTransactions, ...accResponse.results];
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
                const enrichedData = await AiService.enrichTransactions(newTransactions.slice(0, 50));
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
                return { success: true, new: res.upsertedCount, updated: res.modifiedCount };
            }

            return { success: true, new: 0, updated: 0 };

        } catch (error) {
            console.error(`[SyncService] Error syncing transactions:`, error);
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
            // 1. Fetch Fresh Account Data
            const accountsResponse = await client.fetchAccounts(itemId);
            const accounts = accountsResponse.results;

            if (accounts.length === 0) return;

            // 2. Fetch Latest Item Status (to update 'lastUpdatedAt' etc)
            const item = await client.fetchItem(itemId);

            // 3. Update BankConnection Document
            const updateData = {
                status: item.status,
                lastSyncAt: new Date(), // Now
                accounts: accounts.map((acc: any) => ({
                    accountId: acc.id,
                    name: acc.name,
                    number: acc.number,
                    balance: acc.balance,
                    currency: acc.currencyCode,
                    type: acc.type,
                    subtype: acc.subtype
                })),
                updatedAt: new Date()
            };

            const db = mongoClient.db("financeApp");
            await db.collection('bankConnections').updateOne(
                { itemId: itemId },
                { $set: updateData }
            );

            console.log(`[SyncService] Accounts updated for Item ${itemId}`);

            console.log(`[SyncService] Accounts updated for Item ${itemId}`);
            return { success: true };

        } catch (error: any) {
            console.error(`[SyncService] Error syncing accounts:`, error);

            // Handle Pluggy 400/404
            if (error.response?.status === 400 || error.code === 400) {
                console.warn(`[SyncService] Item ${itemId} seems invalid or deleted on Pluggy.`);
                return { success: false, error: "Item inválido ou removido na origem." };
            }
            return { success: false, error: error.message };
        }
    }
}
