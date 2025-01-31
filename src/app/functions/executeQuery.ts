import { getMongoClient } from "@/db/connectionDb";

export async function updateAllUsersFields() {
    try {
        // Conectar ao banco
        const client = await getMongoClient();
        const db = client.db("financeApp");

        // Atualizar todos os usuários
        const result = await db.collection("users").updateMany({}, {
            $set: { tutorialGuide: false, executeQuery: false }
        });
        console.log(`Usuários atualizados: ${result.modifiedCount}`);
        return { success: true, message: `${result.modifiedCount} usuários atualizados!` };
    } catch (error) {
        console.error("Erro ao atualizar usuários:", error);
        return { success: false, message: "Erro ao atualizar usuários." };
    }
}
