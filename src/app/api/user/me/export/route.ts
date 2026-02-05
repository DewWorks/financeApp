import { NextResponse } from 'next/server';
import { getMongoClient } from '@/db/connectionDb';
import { AuditService } from '@/services/AuditService';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { CryptoService } from '@/lib/crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
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

        // 2. Fetch All Data
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Decrypt PII for export (Transparency)
        if (user.cpf) user.cpf = CryptoService.decrypt(user.cpf);
        if (user.address) user.address = CryptoService.decrypt(user.address);

        const transactions = await db.collection('transactions').find({ userId: userId }).toArray();
        const auditLogs = await db.collection('auditlogs').find({ userId: userId }).toArray();

        // Exclude sensitive internal fields
        delete user.password;

        const exportData = {
            metadata: {
                exportedAt: new Date(),
                version: "1.0"
            },
            personalData: user,
            financialData: transactions,
            activityLogs: auditLogs
        };

        // 3. Log the Export Action
        await AuditService.log('DATA_EXPORT', userId, { ip: request.headers.get("x-forwarded-for") }, request);

        return NextResponse.json(exportData);

    } catch (error) {
        console.error("Export Error:", error);
        return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
    }
}
