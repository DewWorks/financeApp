import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { getMongoClient } from '@/db/connectionDb';

export async function GET() {
    try {
        const client = await getMongoClient();
        const db = client.db('financeApp');
        return NextResponse.json({
            status: 'ok',
            env: process.env.NODE_ENV,
            hasMongo: true,
            dbName: db.databaseName,
            host: client.options.srvHost || 'direct'
        }, { status: 200 });
    } catch (e: any) {
        return NextResponse.json({
            status: 'error',
            error: e.message,
            hasMongo: !!process.env.MONGODB_URI
        }, { status: 500 });
    }
}
