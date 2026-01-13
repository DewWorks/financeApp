import { NextResponse } from 'next/server'
import { getMongoClient } from '@/db/connectionDb'
import { ObjectId } from 'mongodb'
import { validateApiToken } from '@/lib/auth-api'

export async function POST(request: Request) {
    try {
        // 1. Validar Token de API (n8n)
        const isApiTokenValid = await validateApiToken(request)
        if (!isApiTokenValid) {
            return NextResponse.json({ error: 'Unauthorized: Invalid API Token' }, { status: 401 })
        }

        const payload = await request.json()

        // 2. Extrair e Validar User ID
        // O n8n deve mandar o userId corretamente no corpo da requisição
        let userId: ObjectId
        try {
            if (!payload.userId) {
                throw new Error('Missing userId')
            }
            userId = new ObjectId(payload.userId)
        } catch (e) {
            return NextResponse.json({ error: 'Invalid or missing userId' }, { status: 400 })
        }

        // 3. Conectar ao Banco
        const client = await getMongoClient()
        const db = client.db("financeApp")

        // 4. Preparar o Objeto de Transação
        // O n8n deve mandar: { description, amount, type, date, tag }
        const newTransaction = {
            description: payload.description || "Transação via WhatsApp",
            amount: Number(payload.amount),
            type: payload.type === 'expense' ? 'expense' : 'income', // default fallback? ou erro?
            tag: payload.tag || "Outros",
            date: payload.date ? new Date(payload.date) : new Date(),
            userId: userId,
            createdAt: new Date(),
            isRecurring: false, // Default para whats
            // profileId: opcional, se quisermos suportar shared accounts depois
        }

        if (isNaN(newTransaction.amount)) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
        }

        // 5. Inserir no Banco
        const result = await db.collection('transactions').insertOne(newTransaction)

        return NextResponse.json({
            message: 'Transaction created via WhatsApp API',
            id: result.insertedId
        }, { status: 201 })

    } catch (error) {
        console.error('WhatsApp API Transaction Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
