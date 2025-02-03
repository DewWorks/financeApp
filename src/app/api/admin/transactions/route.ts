import { getUserIdFromToken } from "@/app/functions/getUserId";
import { getMongoClient } from "@/db/connectionDb";
import { NextResponse } from "next/server";

class AuthError extends Error {
    constructor(message: string, public status: number) {
        super(message);
        this.name = 'AuthError';
    }
}

export async function GET() {
    try {
        const userId = await getUserIdFromToken()
        console.log("UserId log: ", userId)
        const client = await getMongoClient();
        const db = client.db("financeApp");

        const transactions = await db.collection('transactions')
            .find({ userId })
            .sort({ date: -1 })
            .toArray()

        return NextResponse.json(transactions)
    } catch (error) {
        console.error('Get transactions error:', error)
        if (error instanceof AuthError) {
            return NextResponse.json({ error: error.message }, { status: error.status })
        }
        if (error instanceof Error && error.name === 'MongoNetworkError') {
            return NextResponse.json({ error: 'Database connection error' }, { status: 503 })
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}