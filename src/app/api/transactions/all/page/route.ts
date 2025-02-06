import { getUserIdFromToken } from "@/app/functions/getUserId";
import { getMongoClient } from "@/db/connectionDb";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const userId = await getUserIdFromToken();

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);
        const skip = (page - 1) * limit;

        const client = await getMongoClient();
        const db = client.db("financeApp");

        // Obtendo todas as transações paginadas, sem filtrar por mês
        const transactions = await db.collection('transactions')
            .find({ userId })
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        // Contando total de transações para paginação
        const totalTransactions = await db.collection('transactions').countDocuments({ userId });
        const totalPages = Math.ceil(totalTransactions / limit);

        return NextResponse.json({ transactions, totalPages });
    } catch (error) {
        console.error('Get all transactions error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
