import { getMongoClient } from "@/db/connectionDb";

export async function updateAllTransactionsWithCreatedAt() {
    try {
        // Conectar ao banco
        const client = await getMongoClient();
        const db = client.db("financeApp");

        // Buscar todas as transações que ainda não têm um campo createdAt
        const transactions = await db.collection("transactions").find({ createdAt: { $exists: false } }).toArray();

        let updateCount = 0;

        for (const transaction of transactions) {
            // Pegando o campo 'date' da transação
            const transactionDate = new Date(transaction.date);

            // Se a data for válida, ajusta o createdAt com base nela
            const createdAt = isNaN(transactionDate.getTime())
                ? new Date() // Se a data for inválida, usa a data atual
                : new Date(transactionDate.getFullYear(), transactionDate.getMonth(), 1); // Define o createdAt no primeiro dia do mês correspondente

            // Atualizar a transação no banco de dados
            await db.collection("transactions").updateOne(
                { _id: transaction._id },
                { $set: { createdAt } }
            );

            updateCount++;
        }

        console.log(`Transações atualizadas: ${updateCount}`);
        return { success: true, message: `${updateCount} transações atualizadas com createdAt!` };
    } catch (error) {
        console.error("Erro ao atualizar transações:", error);
        return { success: false, message: "Erro ao atualizar transações." };
    }
}
