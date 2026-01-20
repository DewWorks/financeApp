import { NextRequest, NextResponse } from 'next/server'
import { getMongoClient } from '@/db/connectionDb'
import { ObjectId } from 'mongodb'
import { getUserIdFromToken } from "@/app/functions/getUserId";

/**
 * @swagger
 * /api/transactions/{id}:
 *   put:
 *     tags:
 *       - Transactions
 *     summary: Update transaction
 *     description: Updates an existing transaction.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *               date:
 *                 type: string
 *                 format: date-time
 *               tag:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transaction updated
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/transactions/{id}:
 *   delete:
 *     tags:
 *       - Transactions
 *     summary: Delete transaction
 *     description: Deletes a transaction by ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction deleted
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Internal server error
 */
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