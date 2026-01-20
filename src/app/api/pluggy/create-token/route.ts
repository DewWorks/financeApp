import { NextRequest, NextResponse } from "next/server";
import { getPluggyClient } from "@/lib/pluggy";
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function getUserId() {
    const token = (await cookies()).get('auth_token')?.value
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
        return decoded.userId
    } catch (err) {
        return null; // Token inválido
    }
}

/**
 * @swagger
 * /api/pluggy/create-token:
 *   post:
 *     tags:
 *       - Integrations
 *     summary: Create Pluggy Token
 *     description: Generates a Pluggy Connect Token for bank aggregation widget.
 *     responses:
 *       200:
 *         description: Token generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function POST(req: NextRequest) {
    try {
        const client = getPluggyClient();

        const userId = await getUserId();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await client.createConnectToken(undefined, {
            webhookUrl: process.env.PLUGGY_WEBHOOK_URL,
            clientUserId: userId,
        });

        return NextResponse.json({ accessToken: data.accessToken });
    } catch (error: any) {
        console.error("Erro ao criar connect token:", error);
        return NextResponse.json(
            { error: "Erro ao criar token de conexão", details: error.message },
            { status: 500 }
        );
    }
}
