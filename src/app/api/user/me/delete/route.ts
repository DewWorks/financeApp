import { NextResponse } from 'next/server';
import { getMongoClient } from '@/db/connectionDb';
import { AuditService } from '@/services/AuditService';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function DELETE(request: Request) {
    try {
        // 1. Authentication Check
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let userId: string;
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
            userId = decoded.userId;
        } catch (e) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const client = await getMongoClient();
        const db = client.db("financeApp");

        // 2. Log Action BEFORE deletion (To have proof of request)
        // We log it now because after deletion, we might lose the link, though AuditLog stores userId string.
        await AuditService.log('ACCOUNT_DELETED', userId, { reason: 'User requested deletion (LGPD)' }, request);

        // 3. Delete Data
        const tResult = await db.collection('transactions').deleteMany({ userId: userId });
        const uResult = await db.collection('users').deleteOne({ _id: new ObjectId(userId) });
        // We do NOT delete AuditLogs automatically, to preserve proof of deletion request. 
        // LGPD Art 16 allow keeping data for "cumprimento de obrigação legal".

        // 4. Logout (Clear Cookie)
        cookieStore.delete('auth_token');

        return NextResponse.json({
            message: 'Conta excluída permanentemente.',
            details: {
                usersDeleted: uResult.deletedCount,
                transactionsDeleted: tResult.deletedCount
            }
        });

    } catch (error) {
        console.error("Deletion Error:", error);
        return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }
}
