import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getMongoClient } from '@/db/connectionDb'

// Import everything that is in login/route.ts
import { getPhoneQueryVariations } from '@/lib/phoneUtils'
import { loginLimiter, checkRateLimit } from '@/lib/rateLimit'
import { verifyMfaToken } from '@/lib/mfa'
import { MfaService } from '@/lib/MfaService'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
    try {
        const envStatus = {
            NODE_ENV: process.env.NODE_ENV,
            HAS_MONGO: !!process.env.MONGODB_URI,
            HAS_TWILIO: !!process.env.TWILIO_ACCOUNT_SID,
            HAS_JWT: !!process.env.JWT_SECRET,
            RUNTIME: process.release?.name
        };

        console.log("DEBUG ENV:", envStatus);

        return NextResponse.json({
            message: "Status OK - Environment is Healthy",
            env: envStatus,
            imports: "All imports loaded successfully"
        }, { status: 200 });

    } catch (error: any) {
        console.error("DEBUG CRASH:", error);
        return NextResponse.json({
            error: "Crash in Debug Route",
            details: error.message
        }, { status: 500 });
    }
}
