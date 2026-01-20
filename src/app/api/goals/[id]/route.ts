import { NextRequest, NextResponse } from 'next/server';
import { getMongoClient } from '@/db/connectionDb';
import { ObjectId } from 'mongodb';
import { getUserIdFromToken } from "@/app/functions/getUserId";

/**
 * @swagger
 * /api/goals/{id}:
 *   put:
 *     tags:
 *       - Goals
 *     summary: Update goal
 *     description: Updates an existing goal.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Goal ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               targetAmount:
 *                 type: number
 *               currentAmount:
 *                 type: number
 *               date:
 *                 type: string
 *               tag:
 *                 type: string
 *     responses:
 *       200:
 *         description: Goal updated
 *       404:
 *         description: Goal not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/goals/{id}:
 *   delete:
 *     tags:
 *       - Goals
 *     summary: Delete goal
 *     description: Deletes a goal by ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Goal ID
 *     responses:
 *       200:
 *         description: Goal deleted
 *       404:
 *         description: Goal not found
 *       500:
 *         description: Internal server error
 */
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
