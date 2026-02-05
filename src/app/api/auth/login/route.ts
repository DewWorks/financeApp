import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getMongoClient } from '@/db/connectionDb'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
import { getPhoneQueryVariations } from '@/lib/phoneUtils'
import { loginLimiter, checkRateLimit } from '@/lib/rateLimit'
import { verifyMfaToken } from '@/lib/mfa'
import { MfaService } from '@/lib/MfaService'



export async function POST(request: Request) {
  try {
    console.log("DEBUG: Login POST hit");
    return NextResponse.json({ message: "Debug Login OK", token: "fake-token", userId: "debug-id" }, { status: 200 })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Erro interno debug' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: "Login endpoint is reachable via GET" });
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
