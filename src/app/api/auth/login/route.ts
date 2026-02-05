import { NextResponse } from 'next/server'

// Required to prevent 405 Method Not Allowed in production (Vercel)
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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
