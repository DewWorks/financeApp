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

// Required for Vercel/Next.js to support the imported libraries correctly
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login user
 *     description: Authenticates a user using email or phone number and password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               cel:
 *                 type: string
 *               password:
 *                 type: string
 *               mfaCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful or MFA required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 mfaRequired:
 *                   type: boolean
 *                 userId:
 *                   type: string
 *                 tutorialGuide:
 *                   type: boolean
 *                 executeQuery:
 *                   type: boolean
 *       400:
 *         description: Missing fields or invalid credentials
 *       429:
 *         description: Too many attempts
 *       500:
 *         description: Internal server error
 */
export async function POST(request: Request) {
  let step = "Start";
  try {
    step = "Parse Body";
    const { email, cel, password, mfaCode } = await request.json();

    step = "Rate Limit Header";
    const ip = request.headers.get("x-forwarded-for") || "unknown";

    step = "Rate Limit Check";
    try {
      const isAllowed = await checkRateLimit(loginLimiter, ip);
      if (!isAllowed) {
        return NextResponse.json({ error: 'Muitas tentativas. Aguarde.' }, { status: 429 });
      }
    } catch (e) {
      console.error("Rate Limit Error (Ignoring):", e);
    }

    if (!password || (!email && !cel)) {
      return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400 });
    }

    step = "DB Connect";
    const client = await getMongoClient();
    const db = client.db("financeApp");

    step = "User Query";
    let query = {};
    if (email) {
      query = { email };
    } else if (cel) {
      const phoneVariations = getPhoneQueryVariations(cel);
      query = { cel: { $in: phoneVariations } };
    }

    const user = await db.collection('users').findOne(query);

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 400 })
    }

    step = "Password Check";
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Senha incorreta.' }, { status: 400 })
    }

    step = "MFA Check";
    if (user.mfaEnabled) {
      if (!mfaCode) {
        return NextResponse.json({ mfaRequired: true, userId: user._id }, { status: 200 });
      }
      const isValid = await MfaService.verifyLoginCode(user._id.toString(), mfaCode);
      if (!isValid) {
        return NextResponse.json({ error: 'Código inválido.' }, { status: 400 });
      }
    }

    step = "JWT Generation";
    const token = jwt.sign({ userId: user._id, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '1d' });

    step = "Cookie Set";
    (await cookies()).set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return NextResponse.json({
      message: 'Login successful',
      token: token,
      userId: user._id,
      tutorialGuide: user.tutorialGuide,
      executeQuery: user.executeQuery
    }, { status: 200 })

  } catch (error: any) {
    console.error(`Login Crash at [${step}]:`, error);
    // Return 200 with error details to bypass Vercel 500/405 masking
    return NextResponse.json({
      error: "Critical Crash",
      step: step,
      details: error.message || String(error)
    }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ message: "Login endpoint is reachable via GET" });
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}