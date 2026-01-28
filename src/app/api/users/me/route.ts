import { NextResponse } from 'next/server';
import { getMongoClient } from '@/db/connectionDb';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';

export async function GET() {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('auth_token')?.value

        if (!token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string }

        const client = await getMongoClient();
        const db = client.db('financeApp');

        const user = await db.collection('users').findOne(
            { _id: new ObjectId(decoded.userId) },
            { projection: { password: 0 } }
        );

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json(user, { status: 200 })

    } catch (error) {
        console.error('Error fetching current user:', error);
        return NextResponse.json({ error: 'Internal User Error' }, { status: 500 })
    }
}
