import { getUserIdFromToken } from "@/app/functions/getUserId";
import { getMongoClient } from "@/db/connectionDb";
import { NextResponse } from "next/server";

class AuthError extends Error {
    constructor(message: string, public status: number) {
        super(message);
        this.name = 'AuthError';
    }
}
/**
 * @swagger
 * /api/transactions/all:
 *   get:
 *     tags:
 *       - Transactions
 *     summary: Get all transactions
 *     description: Retrieves all transactions for the authenticated user, sorted by date.
 *     responses:
 *       200:
 *         description: List of all transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transaction'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET() {
    try {
        const userId = await getUserIdFromToken()

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