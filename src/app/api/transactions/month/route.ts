import { getUserIdFromToken } from "@/app/functions/getUserId";
import { getMongoClient } from "@/db/connectionDb";
import { NextResponse } from "next/server";
import { ObjectId } from 'mongodb';

export async function GET(req: Request) {
    try {
        const userId = await getUserIdFromToken();

        const { searchParams } = new URL(req.url);
        let month = parseInt(searchParams.get("month") || `${new Date().getMonth() + 1}`, 10);
        const year = new Date().getFullYear();

        // ✅ Garantir que `month` está correto
        if (isNaN(month) || month < 1 || month > 12) {
            month = new Date().getMonth() + 1;
        }

        // ✅ Definir corretamente o primeiro e último dia do mês
        const startDate = new Date(year, month - 1, 1); // Primeiro dia do mês
        const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Último dia do mês

        console.log("🔍 Buscando transações entre:", { startDate, endDate });

        const client = await getMongoClient();
        const db = client.db("financeApp");

        // ✅ Converter `userId` para `ObjectId`
        const transactions = await db.collection('transactions')
            .find({
                userId: new ObjectId(userId), // 🔹 Garantia de que userId será tratado corretamente
                date: { $gte: startDate, $lt: endDate }
            })
            .sort({ date: -1 })
            .toArray();

        console.log("📌 Total de transações encontradas:", transactions.length);

        return NextResponse.json({ transactions });
    } catch (error) {
        console.error('Get monthly transactions error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
