import { NextResponse } from 'next/server'
import { getMongoClient } from '@/db/connectionDb'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
    try {
        const envStatus = {
            NODE_ENV: process.env.NODE_ENV,
            HAS_MONGO: !!process.env.MONGODB_URI,
        };

        // Test 1: Import Cookies (Just checking if it crashes)
        console.log("DEBUG: Imports OK");

        // Test 2: Connect DB
        let dbStatus = "Not Connected";
        try {
            const client = await getMongoClient();
            await client.db("financeApp").command({ ping: 1 });
            dbStatus = "Connected";
        } catch (e: any) {
            dbStatus = "DB Error: " + e.message;
        }

        return NextResponse.json({
            message: "Debug Full Status",
            db: dbStatus,
            env: envStatus
        }, { status: 200 });

    } catch (error: any) {
        console.error("DEBUG CRASH:", error);
        return NextResponse.json({
            error: "Crash in Debug Full",
            details: error.message
        }, { status: 500 });
    }
}
