import { NextResponse } from 'next/server'
import { getMongoClient } from '@/db/connectionDb'
import { MfaService } from '@/lib/MfaService'
import { mfaRequestLimiter, checkRateLimit } from '@/lib/rateLimit'
import { ObjectId } from 'mongodb'

/**
 * @swagger
 * /api/auth/mfa/send:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Send MFA OTP
 *     description: Sends a One-Time Password via Email or WhatsApp for login verification.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - channel
 *             properties:
 *               userId:
 *                 type: string
 *               channel:
 *                 type: string
 *                 enum: [email, whatsapp]
 *     responses:
 *       200:
 *         description: Code sent successfully
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Internal error
 */
export async function POST(request: Request) {
    try {
        const { userId, channel } = await request.json()

        if (!userId || !channel) {
            return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })
        }

        // 1. Rate Limit (Prevent spamming codes)
        const ip = request.headers.get("x-forwarded-for") || "unknown";
        const isAllowed = await checkRateLimit(mfaRequestLimiter, ip);
        if (!isAllowed) {
            return NextResponse.json({ error: 'Muitos códigos solicitados. Aguarde 1 minuto.' }, { status: 429 });
        }

        const client = await getMongoClient()
        const db = client.db("financeApp")
        const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })

        if (!user) {
            return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })
        }

        // 2. Generate and Send OTP
        const success = await MfaService.sendOtp(userId, channel)

        if (success) {
            return NextResponse.json({ message: `Código enviado via ${channel}.` }, { status: 200 })
        } else {
            return NextResponse.json({ error: 'Falha ao enviar código.' }, { status: 500 })
        }

    } catch (error) {
        console.error("MFA Send Error:", error)
        return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
    }
}
