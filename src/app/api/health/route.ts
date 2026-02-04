import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        env: process.env.NODE_ENV,
        hasMongo: !!process.env.MONGODB_URI
    }, { status: 200 });
}
