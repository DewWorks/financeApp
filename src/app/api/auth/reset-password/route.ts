import { getMongoClient } from '@/db/connectionDb';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Reset password
 *     description: Resets the user's password using a verification token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: JWT token received from verify-code endpoint
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid token or expired
 */
export async function POST(request: Request) {
    try {
        const { token, newPassword } = await request.json();

        const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
        const client = await getMongoClient();
        const db = client.db("financeApp");

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.collection('users').updateOne(
            { email: decoded.email },
            {
                $set: { password: hashedPassword },
                $unset: { verification: "" }
            }
        );

        return NextResponse.json({ message: 'Senha redefinida com sucesso' }, { status: 200 });
    } catch (err) {
        console.error("Erro em reset-password:", err);
        return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 400 });
    }
}
