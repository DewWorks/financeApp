import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getMongoClient } from '@/db/connectionDb'
import { cookies } from 'next/headers'
import { MfaService } from '@/lib/MfaService'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
import { getPhoneQueryVariations } from '@/lib/phoneUtils'
import { loginLimiter, checkRateLimit } from '@/lib/rateLimit'

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
 *       500:
 *         description: Internal server error
 */
import { AuditService } from '@/services/AuditService';

export async function POST(request: Request) {
  try {
    const { email, cel, password, mfaCode } = await request.json()

    // 1. Rate Limiting Check (Security: Brute Force Protection)
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const isAllowed = await checkRateLimit(loginLimiter, ip);
    if (!isAllowed) {
      // Audit blocked attempt? Maybe too noisy.
      return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 15 minutos.' }, { status: 429 });
    }

    if (!password || (!email && !cel)) {
      return NextResponse.json({ error: 'Preencha todos os campos obrigatórios.' }, { status: 400 });
    }
    const client = await getMongoClient();

    const db = client.db("financeApp");

    // Find user
    // Busca usuário por email ou número de celular
    let query = {};
    if (email) {
      query = { email };
    } else if (cel) {
      const phoneVariations = getPhoneQueryVariations(cel);
      query = { cel: { $in: phoneVariations } };
    }

    const user = await db.collection('users').findOne(query);

    if (!user) {
      AuditService.log('LOGIN_FAILURE', undefined, { reason: 'User not found', email, cel }, request).catch(console.error);
      return NextResponse.json({ error: 'Usuário não encontrado. Verifique se o email ou telefone estão corretos.' }, { status: 400 })
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      AuditService.log('LOGIN_FAILURE', user._id.toString(), { reason: 'Invalid password' }, request).catch(console.error);
      return NextResponse.json({ error: 'Senha incorreta. Tente novamente.' }, { status: 400 })
    }

    // [New] MFA Logic (Mesclado como solicitado)
    if (user.mfaEnabled) {
      if (!mfaCode) {
        return NextResponse.json({ mfaRequired: true, userId: user._id }, { status: 200 });
      }
      const isValid = await MfaService.verifyLoginCode(user._id.toString(), mfaCode);
      if (!isValid) {
        // Fire-and-forget log
        AuditService.log('LOGIN_FAILURE_MFA', user._id.toString(), { reason: 'Invalid code' }, request).catch(console.error);
        return NextResponse.json({ error: 'Código de autenticação inválido.' }, { status: 400 });
      }
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1d' })
      ; (await
        // Set the token in a secure HTTP-only cookie
        cookies()).set({
          name: 'auth_token',
          value: token,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24, // 1 day
          path: '/',
        })

    // Fire-and-forget log
    AuditService.log('LOGIN_SUCCESS', user._id.toString(), { method: email ? 'email' : 'phone' }, request).catch(console.error);
    return NextResponse.json({ message: 'Login successful', token: token, userId: user._id, tutorialGuide: user.tutorialGuide, executeQuery: user.executeQuery }, { status: 200 })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor. Tente novamente mais tarde.' }, { status: 500 })
  }
}