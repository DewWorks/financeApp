import { NextRequest, NextResponse } from 'next/server'
import { getMongoClient } from '@/db/connectionDb'
import { ObjectId } from 'mongodb'
import {getUserIdFromToken} from "@/app/functions/getUserId";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        const userId = await getUserIdFromToken();
        const client = await getMongoClient();
        const db = client.db('financeApp');

        const transactionId = new ObjectId(resolvedParams.id);
        const updatedTransaction = await request.json();

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _id, userId: _, ...updateData } = updatedTransaction;

        const result = await db.collection('transactions').updateOne(
            { _id: transactionId, userId },
            {
                $set: {
                    ...updateData,
                    amount: parseFloat(updateData.amount),
                    date: new Date(updateData.date),
                },
            }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Transaction updated successfully' });
    } catch (error) {
        console.error('Update transaction error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params; // Resolva a Promise
        const userId = await getUserIdFromToken();
        const client = await getMongoClient();
        const db = client.db('financeApp');

        const transactionId = new ObjectId(resolvedParams.id);
        console.log("transactionId", transactionId)

        const result = await db.collection('transactions').deleteOne({ _id: transactionId, userId });
        console.log("result delete: ", result)

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Delete transaction error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}