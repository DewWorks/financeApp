import { getMongoClient } from '@/db/connectionDb';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { User } from '@/app/models/User';

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

export async function GET() {
    try {
        const userId = await getUserIdFromToken();
        const client = await getMongoClient();
        const db = client.db('financeApp');

        const user = await db.collection('users').findOne(
            { _id: userId },
            { projection: { password: 0 } }
        );

        if (!user) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error('Erro ao buscar usuário:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const userId = await getUserIdFromToken();
        const { cel } = await request.json();

        console.log("UserId log: ", userId)
        console.log("Celular log: ", cel)
        if (!cel || typeof cel !== 'string') {
            return NextResponse.json({ error: 'Número de celular inválido' }, { status: 400 });
        }

        const normalizedPhone = cel.replace(/\D/g, ''); // remove não-números

        const client = await getMongoClient();
        const db = client.db('financeApp');

        const user = await db.collection('users').findOne({ _id: userId });

        if (!user) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        // Verifica se já existe esse número
        const currentPhones = user.cel || [];
        if (currentPhones.includes(normalizedPhone)) {
            return NextResponse.json({ message: 'Número já cadastrado' }, { status: 200 });
        }

        // Adiciona número ao array
        const updatedUser = await db.collection('users').updateOne(
            { _id: userId },
            { $push: { cel: { $each: [normalizedPhone] } } } as any
        )

        return NextResponse.json({ message: 'Número de celular atualizado com sucesso', user: updatedUser }, { status: 200 });
    } catch (error) {
        console.error('Erro ao atualizar celular:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
