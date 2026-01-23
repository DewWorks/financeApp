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

        // Mapping Logic
        if (lowerCat.includes("food") || lowerCat.includes("alimentação") || lowerCat.includes("restaurante")) return "Alimentação";
        if (lowerCat.includes("transport") || lowerCat.includes("uber") || lowerCat.includes("combustível")) return "Transporte";
        if (lowerCat.includes("health") || lowerCat.includes("saúde") || lowerCat.includes("farmácia")) return "Saúde";
        if (lowerCat.includes("shop") || lowerCat.includes("compra") || lowerCat.includes("varejo")) return "Outros";
        if (lowerCat.includes("entertainment") || lowerCat.includes("lazer") || lowerCat.includes("cinema")) return "Lazer";
        if (lowerCat.includes("education") || lowerCat.includes("educação")) return "Educação";
        if (lowerCat.includes("bill") || lowerCat.includes("conta") || lowerCat.includes("luz") || lowerCat.includes("água")) return "Custos de Vida";
        if (lowerCat.includes("rent") || lowerCat.includes("aluguel")) return "Aluguel";
        if (lowerCat.includes("salary") || lowerCat.includes("salário")) return "Salário";
        if (lowerCat.includes("transfer")) return "Outros";

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

            const response = await client.fetchTransactions(itemId, {
                from: fromDate.toISOString().split('T')[0], // YYYY-MM-DD
                pageSize: 500 // Reasonable batch size
            });

            const pluggyTransactions = response.results;
            console.log(`[SyncService] Found ${pluggyTransactions.length} transactions in Pluggy.`);

            let newCount = 0;
            let updatedCount = 0;

            // 2. Process and Upsert into MongoDB
            for (const pt of pluggyTransactions) {
                // Determine Type (Pluggy: negative = expense, positive = income)
                // BUT Pluggy sometimes returns positive for credit card expenses. 
                // We typically check the account type. 
                // For safety: if amount < 0 it is expense. if amount > 0 it is income.
                // However, credit card expenses appear as positive in some views, but usually negative in API.
                // Let's assume standard signed values: -100 = Expense, +100 = Income.

                const amount = Math.abs(pt.amount);
                const type = pt.amount < 0 ? 'expense' : 'income';

                // Map Tag
                const tag = this.mapCategoryToTag(pt.category || undefined);

                const transactionDate = pt.date instanceof Date ? pt.date.toISOString().split('T')[0] : (pt.date as string).split('T')[0];

                const transactionData = {
                    userId: new ObjectId(userId),
                    provider: 'pluggy',
                    pluggyTransactionId: pt.id,
                    accountId: pt.accountId,
                    description: pt.description,
                    amount: amount,
                    type: type,
                    date: transactionDate,
                    tag: tag,
                    category: pt.category || undefined,
                    status: pt.status,
                    // We don't overwrite createdAt on update
                };

                // Native Driver Upsert
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
