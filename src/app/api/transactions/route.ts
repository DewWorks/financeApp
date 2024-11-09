import { NextResponse } from 'next/server'
import { getMongoClient } from '@/db/connectionDb'
import { getUserIdFromToken } from '@/app/functions/getUserId';

export async function GET() {
  try {
    const userId = await getUserIdFromToken()
    console.log("UserId log: ", userId)
    const client = await getMongoClient();
    const db = client.db("financeApp");

    const transactions = await db.collection('transactions')
      .find({ userId })
      .sort({ date: -1 })
      .toArray()

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Get transactions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}