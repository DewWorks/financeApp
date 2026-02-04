import { NextResponse } from 'next/server';
import { MfaService } from '@/lib/MfaService';

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
        const { userId, channel } = await request.json();

        if (!userId || !['email', 'whatsapp'].includes(channel)) {
            return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
        }

        const success = await MfaService.sendOtp(userId, channel as 'email' | 'whatsapp');

        if (success) {
            return NextResponse.json({ message: 'Code sent successfully' }, { status: 200 });
        } else {
            return NextResponse.json({ error: 'Failed to send code. Check user contact info.' }, { status: 500 });
        }

    } catch (error) {
        console.error('Send MFA Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
