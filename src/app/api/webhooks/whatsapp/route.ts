import { NextResponse } from 'next/server';
import { getMongoClient } from '@/db/connectionDb';
import twilio from 'twilio';
import { FinanceAgentService } from '@/services/FinanceAgentService';

const { MessagingResponse } = twilio.twiml;

// Initialize Agent
const financeAgent = new FinanceAgentService();

/**
 * @swagger
 * /api/webhooks/whatsapp:
 *   post:
 *     tags:
 *       - Webhooks
 *     summary: WhatsApp Webhook
 *     description: Receives messages from Twilio and processes them via Finance Agent.
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               From:
 *                 type: string
 *               Body:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message processed
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */
export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const from = formData.get('From') as string;
        const body = formData.get('Body') as string;

        if (!from || !body) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        // 1. Clean Phone Number
        const rawPhone = from.replace('whatsapp:', '').trim();
        const cleanPhone = rawPhone.replace(/\D/g, '');

        // 2. Connect to DB and Find User
        const client = await getMongoClient();
        const db = client.db('financeApp');

        // Find user where 'cel' array contains EITHER the raw format or the clean digits format
        const user = await db.collection('users').findOne({
            cel: { $in: [rawPhone, cleanPhone, `+${cleanPhone}`] }
        });

        // TwiML Generator
        const twiml = new MessagingResponse();

        if (!user) {
            console.log(`User not found for phone: ${cleanPhone}. From: ${from}`);
            twiml.message('❌ Usuário não encontrado. Verifique se seu número está cadastrado no perfil (com DDD e código do país).');
            return new NextResponse(twiml.toString(), {
                headers: { 'Content-Type': 'text/xml' },
            });
        }

        // 3. Process with Finance Agent
        // Pass userId as string
        const responseText = await financeAgent.processMessage(body, user._id.toString());

        twiml.message(responseText);

        return new NextResponse(twiml.toString(), {
            headers: { 'Content-Type': 'text/xml' },
        });

    } catch (error) {
        console.error('WhatsApp Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
