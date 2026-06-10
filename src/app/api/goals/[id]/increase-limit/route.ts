import { NextRequest, NextResponse } from 'next/server';
import { getMongoClient } from '@/db/connectionDb';
import { ObjectId } from 'mongodb';
import { getUserIdFromToken } from '@/app/functions/getUserId';

/**
 * POST /api/goals/[id]/increase-limit
 * Quick action from push notification – increases a goal's targetAmount by `amount` (default R$100).
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const userId = await getUserIdFromToken();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const increase = Number(body.amount) || 100;

        const client = await getMongoClient();
        const db = client.db('financeApp');

        let goalId: ObjectId;
        try {
            goalId = new ObjectId(resolvedParams.id);
        } catch {
            return NextResponse.json({ error: 'Invalid goal ID' }, { status: 400 });
        }

        const result = await db.collection('goals').updateOne(
            { _id: goalId, userId },
            { $inc: { targetAmount: increase } }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'Goal not found or access denied' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: `Limite aumentado em R$ ${increase} com sucesso!`,
            increased: increase
        });
    } catch (error) {
        console.error('[increase-limit] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
