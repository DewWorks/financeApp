import { NextResponse } from 'next/server'
import { getMongoClient } from '@/db/connectionDb'
import { ObjectId } from 'mongodb'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

class AuthError extends Error {
    constructor(message: string, public status: number) {
        super(message);
        this.name = 'AuthError';
    }
}

async function getUserIdFromToken() {
    const token = (await cookies()).get('auth_token')?.value
    if (!token) {
        throw new AuthError('No token provided', 401)
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
        return new ObjectId(decoded.userId)
    } catch (error) {
        console.error('Invalid token:', error)
        throw new AuthError('Invalid token', 401)
    }
}

/**
 * @swagger
 * /api/goals:
 *   get:
 *     tags:
 *       - Goals
 *     summary: List goals
 *     description: Retrieves all financial goals for the authenticated user.
 *     responses:
 *       200:
 *         description: List of goals
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Goal'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET() {
    try {
        const userId = await getUserIdFromToken()
        console.log("UserId log: ", userId)
        const client = await getMongoClient();
        const db = client.db("financeApp");

        const goals = await db.collection('goals')
            .find({ userId })
            .sort({ date: -1 })
            .toArray()

        return NextResponse.json(goals)
    } catch (error) {
        console.error('Get goals error:', error)
        if (error instanceof AuthError) {
            return NextResponse.json({ error: error.message }, { status: error.status })
        }
        if (error instanceof Error && error.name === 'MongoNetworkError') {
            return NextResponse.json({ error: 'Database connection error' }, { status: 503 })
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * @swagger
 * /api/goals:
 *   post:
 *     tags:
 *       - Goals
 *     summary: Create goal
 *     description: Creates a new financial goal.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - targetAmount
 *             properties:
 *               name:
 *                 type: string
 *               targetAmount:
 *                 type: number
 *               date:
 *                 type: string
 *               tag:
 *                 type: string
 *     responses:
 *       201:
 *         description: Goal created
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function POST(request: Request) {
    try {
        const userId = await getUserIdFromToken()
        const client = await getMongoClient();
        const db = client.db("financeApp");
        const goal = await request.json()

        const result = await db.collection('goals').insertOne({
            ...goal,
            userId,
            createdAt: new Date(),
            currentAmount: 0,
        })

        return NextResponse.json({ message: 'Goal added successfully', id: result.insertedId }, { status: 201 })
    } catch (error) {
        console.error('Add goal error:', error)
        if (error instanceof AuthError) {
            return NextResponse.json({ error: error.message }, { status: error.status })
        }
        if (error instanceof Error) {
            if (error.name === 'MongoNetworkError') {
                return NextResponse.json({ error: 'Database connection error' }, { status: 503 })
            }
            if (error.name === 'ValidationError') {
                return NextResponse.json({ error: 'Invalid goal data' }, { status: 400 })
            }
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
