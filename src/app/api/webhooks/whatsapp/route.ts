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
        const body = (formData.get('Body') as string) || '';
        const numMedia = Number(formData.get('NumMedia') || '0');

        if (!from || (!body && numMedia === 0)) {
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

        let processedText = body;
        let isAudio = false;

        // Process audio attachment if present
        if (numMedia > 0) {
            const mediaUrl = formData.get('MediaUrl0') as string;
            const mimeType = formData.get('MediaContentType0') as string;

            if (mediaUrl && mimeType && mimeType.startsWith('audio/')) {
                console.log(`Downloading WhatsApp voice note from Twilio CDN: ${mediaUrl} (${mimeType})`);
                try {
                    const mediaResponse = await fetch(mediaUrl);
                    if (mediaResponse.ok) {
                        const audioBuffer = Buffer.from(await mediaResponse.arrayBuffer());
                        const base64Audio = audioBuffer.toString('base64');
                        
                        // Transcribe using Gemini 1.5 Flash
                        const transcription = await financeAgent.transcribeAudio(base64Audio, mimeType);
                        if (transcription) {
                            console.log(`Gemini Voice Ingestion Transcription: "${transcription}"`);
                            processedText = transcription;
                            isAudio = true;
                        }
                    } else {
                        console.error(`Failed to download audio from Twilio CDN: ${mediaResponse.statusText}`);
                    }
                } catch (e) {
                    console.error("Error downloading or transcribing Twilio audio:", e);
                }
            }
        }

        if (!processedText.trim()) {
            twiml.message('🎙️ Desculpe, não consegui entender o áudio enviado. Poderia repetir ou digitar? 😅');
            return new NextResponse(twiml.toString(), {
                headers: { 'Content-Type': 'text/xml' },
            });
        }

        // 3. Process with Finance Agent
        const agentResponseText = await financeAgent.processMessage(processedText, user._id.toString());

        let finalResponse = agentResponseText;
        if (isAudio) {
            finalResponse = `🎙️ *Fin ouviu:* "${processedText}"\n\n${agentResponseText}`;
        }

        twiml.message(finalResponse);

        return new NextResponse(twiml.toString(), {
            headers: { 'Content-Type': 'text/xml' },
        });

    } catch (error) {
        console.error('WhatsApp Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
