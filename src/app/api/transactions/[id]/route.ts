import { NextResponse } from 'next/server'
import { getMongoClient } from '@/db/connectionDb'
import { ObjectId } from 'mongodb'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

async function getUserIdFromToken() {
  const token = (await cookies()).get('auth_token')?.value
  if (!token) {
    throw new Error('No token provided')
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    return new ObjectId(decoded.userId)
  } catch (error) {
    console.error('Invalid token:', error)
    throw new Error('Invalid token')
  }
}

// A função PUT agora usa o tipo NextRequest corretamente
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserIdFromToken()
    const client = await getMongoClient()
    const db = client.db("financeApp")

    const transactionId = new ObjectId(params.id) // Acesso ao parâmetro de rota `id` diretamente via `params`
    const updatedTransaction = await request.json()

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, userId: _, ...updateData } = updatedTransaction

    const result = await db.collection('transactions').updateOne(
      { _id: transactionId, userId },
      { 
        $set: {
          ...updateData,
          amount: parseFloat(updateData.amount),
          date: new Date(updateData.date)
        } 
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Transaction updated successfully' })
  } catch (error) {
    console.error('Update transaction error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserIdFromToken()
    const client = await getMongoClient()
    const db = client.db("financeApp")

    const transactionId = new ObjectId(params.id) // Acesso ao parâmetro de rota `id` diretamente via `params`

    const result = await db.collection('transactions').deleteOne({ _id: transactionId, userId })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Transaction deleted successfully' })
  } catch (error) {
    console.error('Delete transaction error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
