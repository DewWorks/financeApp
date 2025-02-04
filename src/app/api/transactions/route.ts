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

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromToken()
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

