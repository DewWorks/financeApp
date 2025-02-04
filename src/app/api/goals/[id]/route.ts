import { NextRequest, NextResponse } from 'next/server';
import { getMongoClient } from '@/db/connectionDb';
import { ObjectId } from 'mongodb';
import { getUserIdFromToken } from "@/app/functions/getUserId";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        const userId = await getUserIdFromToken();
        const client = await getMongoClient();
        const db = client.db('financeApp');

        const goalId = new ObjectId(resolvedParams.id);
        const updatedGoal = await request.json();

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _id, userId: _, ...updateData } = updatedGoal;

        const result = await db.collection('goals').updateOne(
            { _id: goalId, userId },
            {
                $set: {
                    ...updateData,
                    targetAmount: parseFloat(updateData.targetAmount),
                    currentAmount: parseFloat(updateData.currentAmount),
                },
            }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Goal updated successfully' });
    } catch (error) {
        console.error('Update goal error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params; // Resolva a Promise
        const userId = await getUserIdFromToken();
        const client = await getMongoClient();
        const db = client.db('financeApp');

        const goalId = new ObjectId(resolvedParams.id);

        console.log("goalId: ", goalId)
        const result = await db.collection('goals').deleteOne({ _id: goalId, userId });

        console.log('Delete Result:', result);

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Goal deleted successfully' });
    } catch (error) {
        console.error('Delete goal error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
