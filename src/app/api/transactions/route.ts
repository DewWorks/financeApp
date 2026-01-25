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
 * /api/transactions:
 *   get:
 *     tags:
 *       - Transactions
 *     summary: List transactions
 *     description: Retrieves a paginated list of transactions for the authenticated user, filtered by month.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: Month number (1-12)
 *     responses:
 *       200:
 *         description: List of transactions and pagination info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *                 totalPages:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET(req: Request) {
  try {
    const userId = await getUserIdFromToken();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    let month = parseInt(searchParams.get("month") || `${new Date().getMonth() + 1}`, 10);
    if (isNaN(month) || month < 1 || month > 12) {
      month = new Date().getMonth() + 1;
    }

    const year = new Date().getFullYear();
    const skip = (page - 1) * limit;

    const startDate = new Date(year, month - 1, 1); // Primeiro dia do mês
    const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Último dia do mês

    const client = await getMongoClient();
    const db = client.db("financeApp");

    // Obtendo transações paginadas do mês selecionado
    const transactions = await db.collection('transactions')
      .find({
        userId,
        date: {
          $gte: new Date(startDate),
          $lt: new Date(endDate)
        }
      })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Contando total de transações no mês para paginação
    const totalTransactions = await db.collection('transactions').countDocuments({
      userId,
      date: { $gte: startDate, $lt: endDate }
    });

    const totalPages = Math.ceil(totalTransactions / limit);

    return NextResponse.json({ transactions, totalPages });
  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     tags:
 *       - Transactions
 *     summary: Create transaction
 *     description: Adds a new transaction for the authenticated user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - amount
 *               - type
 *               - date
 *             properties:
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               date:
 *                 type: string
 *                 format: date-time
 *               tag:
 *                 type: string
 *               isRecurring:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Transaction created
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// ... imports
import { PlanService } from '@/services/PlanService';

// ... existing code

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromToken()

    // Check SaaS Limits
    const withinLimit = await PlanService.checkTransactionLimit(userId);
    if (!withinLimit) {
      return NextResponse.json(
        { error: "Limite do plano FREE atingido (200 transações/mês). Faça upgrade para continuar." },
        { status: 403 }
      );
    }

    const client = await getMongoClient();
    const db = client.db("financeApp");
    const transaction = await request.json()

    const result = await db.collection('transactions').insertOne({
      ...transaction,
      userId,
      date: new Date(transaction.date),
    })

    return NextResponse.json({ message: 'Transaction added successfully', id: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error('Add transaction error:', error)
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof Error) {
      if (error.name === 'MongoNetworkError') {
        return NextResponse.json({ error: 'Database connection error' }, { status: 503 })
      }
      if (error.name === 'ValidationError') {
        return NextResponse.json({ error: 'Invalid transaction data' }, { status: 400 })
      }
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

