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
    static async syncTransactions(userId: string | ObjectId, itemId: string) {
        console.log(`[SyncService] Starting sync for user ${userId} and item ${itemId}`);

        const client = getPluggyClient();
        const mongoClient = await getMongoClient();
        // Ensure connection
        await mongoClient.connect();

        try {
            // 1. Fetch transactions from Pluggy
            // Fetching last 60 days by default to capture any updates
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - 60);

            // 1. Fetch Accounts to determine types (Credit Card vs Checking)
            const accountsRes = await client.fetchAccounts(itemId);
            const accountTypeMap = new Map<string, string>(); // accountId -> type
            accountsRes.results.forEach(acc => accountTypeMap.set(acc.id, acc.type));

            let pluggyTransactions: any[] = [];

            // Try fetching by item first to be safe, or just skip if we know it fails. 
            // Better to keep the attempt but handle the variable scope.
            let response;
            try {
                response = await client.fetchTransactions(itemId, {
                    from: fromDate.toISOString().split('T')[0],
                    pageSize: 500
                });
                pluggyTransactions = response.results;
            } catch (e) {
                console.warn("[SyncService] Failed to fetch by ItemId, will try accounts.");
            }

            // Fallback: If 0 transactions found by ItemId, try fetching by AccountId
            if (pluggyTransactions.length === 0) {
                console.log(`[SyncService] No transactions found for Item ${itemId}. Trying per-account fetch...`);
                for (const account of accountsRes.results) {
                    console.log(`[SyncService] Fetching tx for Account ${account.id}`);
                    const accResponse = await client.fetchTransactions(account.id, {
                        from: fromDate.toISOString().split('T')[0],
                        pageSize: 500
                    });
                    if (accResponse.results.length > 0) {
                        pluggyTransactions = [...pluggyTransactions, ...accResponse.results];
                    }
                }
            }

            console.log(`[SyncService] Found ${pluggyTransactions.length} transactions in Pluggy (Total).`);

            let newCount = 0;
            let updatedCount = 0;

            // 2. Process transactions for AI Enrichment (Batch)
            // Increased limit to 300 to cover the typical 60-day volume (~250 txs)
            const transactionsToEnrich = pluggyTransactions.slice(0, 300);
            console.log(`[SyncService] Enriching ${transactionsToEnrich.length} transactions with AI...`);

            // Import AiService dynamically or expected to be at top
            const { AiService } = await import("./AiService");
            const enrichedData = await AiService.enrichTransactions(transactionsToEnrich);
            const enrichedMap = new Map(enrichedData.map(e => [e.pluggyTransactionId, e]));

            // 3. Upsert into MongoDB
            for (const pt of pluggyTransactions) {
                const accountType = accountTypeMap.get(pt.accountId) || 'BANK';
                const isCreditCard = accountType === 'CREDIT' || accountType === 'CREDIT_CARD';

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

                // AI Enrichment Data
                const enriched = enrichedMap.get(pt.id);
                const finalDescription = enriched ? enriched.cleanDescription : pt.description;
                const finalTag = enriched ? enriched.category : this.mapCategoryToTag(pt.category || undefined);

                const transactionDate = pt.date instanceof Date ? pt.date : new Date(pt.date);

                let status: 'PENDING' | 'POSTED' = 'POSTED';
                if (pt.status === 'PENDING') status = 'PENDING';

                const transactionData = {
                    userId: new ObjectId(userId),
                    provider: 'pluggy',
                    pluggyTransactionId: pt.id,
                    accountId: pt.accountId,
                    description: finalDescription, // AI Cleaned Description
                    amount: amount,
                    type: type,
                    date: transactionDate,
                    tag: finalTag, // AI Categorized Tag
                    category: pt.category || undefined,
                    status: status,
                    paymentType: pt.paymentData?.paymentMethod || undefined,
                    merchantName: pt.merchant ? pt.merchant.name : undefined,
                    descriptionRaw: pt.description, // Keep original in raw
                };

                const db = mongoClient.db("financeApp");
                const result = await db.collection("transactions").updateOne(
                    { pluggyTransactionId: pt.id },
                    { $set: transactionData, $setOnInsert: { createdAt: new Date() } },
                    { upsert: true }
                );

                if (result.upsertedCount > 0) newCount++;
                if (result.modifiedCount > 0) updatedCount++;
            }

            console.log(`[SyncService] Sync Complete. New: ${newCount}, Updated: ${updatedCount}`);
            return { success: true, new: newCount, updated: updatedCount };

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
