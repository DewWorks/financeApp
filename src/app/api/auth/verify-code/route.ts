import { getMongoClient } from '@/db/connectionDb';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * @swagger
 * /api/auth/verify-code:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Verify reset code
 *     description: Verifies the code sent to email for password reset.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Code verified, returns temporary token for reset
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid or expired code
 *       500:
 *         description: Internal server error
 */
export async function POST(request: Request) {
    try {
        const { email, code } = await request.json();

        const client = await getMongoClient();
        const db = client.db("financeApp");

        const user = await db.collection('users').findOne({ email });

        if (!user || !user.verification) {
            return NextResponse.json({ error: 'Código inválido' }, { status: 400 });
        }

        const { verification } = user;

        if (
            verification.code !== code ||
            verification.type !== 'reset-password' ||
            verification.expiresAt < new Date()
        ) {
            return NextResponse.json({ error: 'Código inválido ou expirado' }, { status: 400 });
        }

        const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '15m' });

        return NextResponse.json({ message: 'Código verificado', token }, { status: 200 });
    } catch (err) {
        console.error("Erro em verify-code:", err);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
