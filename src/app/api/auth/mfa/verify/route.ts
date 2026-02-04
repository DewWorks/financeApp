import { NextResponse } from 'next/server';
import { getMongoClient } from '@/db/connectionDb';
import { ObjectId } from 'mongodb';
import { verifyMfaToken } from '@/lib/mfa';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { secret, code } = await request.json();

        if (!secret || !code) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        const userId = decoded.userId;

        // Verify key
        const isValid = verifyMfaToken(code, secret);
        if (!isValid) {
            return NextResponse.json({ error: 'Código inválido. Tente novamente.' }, { status: 400 });
        }

        const client = await getMongoClient();
        const db = client.db('financeApp');

        // Save Secret and Enable MFA
        // TODO: Encrypt secret before saving (Phase 2)
        await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    mfaSecret: secret,
                    mfaEnabled: true
                }
            }
        );

        return NextResponse.json({ message: 'MFA Ativado com sucesso!' });

    } catch (error) {
        console.error('MFA Verify Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
