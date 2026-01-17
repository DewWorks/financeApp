import { NextResponse } from 'next/server'
import { getMongoClient } from '@/db/connectionDb'
import { ObjectId } from 'mongodb'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

async function getUserIdFromToken() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
        throw new Error('No token provided')
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
        return new ObjectId(decoded.userId)
    } catch (error) {
        throw new Error('Invalid token')
    }
}

export async function GET(req: Request) {
    try {
        const userId = await getUserIdFromToken();
        const { searchParams } = new URL(req.url);

        // Optional filters
        const month = searchParams.get("month");
        const year = searchParams.get("year");

        const client = await getMongoClient();
        const db = client.db("financeApp");

        const matchStage: any = { userId };

        // Apply Date Filter if provided
        if (month && year) {
            const m = parseInt(month, 10);
            const y = parseInt(year, 10);
            const startDate = new Date(y, m - 1, 1);
            const endDate = new Date(y, m, 0, 23, 59, 59, 999);
            matchStage.date = { $gte: startDate, $lt: endDate };
        }

        // Aggregation Pipeline
        const pipeline = [
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalIncome: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "income"] }, "$amount", 0]
                        }
                    },
                    totalExpense: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0]
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    income: "$totalIncome",
                    expense: "$totalExpense",
                    balance: { $subtract: ["$totalIncome", "$totalExpense"] }
                }
            }
        ];

        const result = await db.collection('transactions').aggregate(pipeline).toArray();

        const summary = result[0] || { income: 0, expense: 0, balance: 0 };

        return NextResponse.json(summary);

    } catch (error) {
        console.error('Summary API Error:', error);
        return NextResponse.json({ error: 'Unauthorized or Internal Error' }, { status: 500 });
    }
}
