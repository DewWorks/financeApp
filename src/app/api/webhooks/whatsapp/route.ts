import { NextResponse } from 'next/server';
import { getMongoClient } from '@/db/connectionDb';
import twilio from 'twilio';
import { GoogleGenerativeAI } from '@google/generative-ai';

const { MessagingResponse } = twilio.twiml;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const from = formData.get('From') as string;
        const body = formData.get('Body') as string;

        if (!from || !body) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        // 1. Clean Phone Number
        // Twilio sends "whatsapp:+55...", we want to be able to match "+55..." or "55..."
        const rawPhone = from.replace('whatsapp:', '').trim();
        const cleanPhone = rawPhone.replace(/\D/g, ''); // Only digits

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

        // 3. AI Parsing (Gemini)
        try {
            // "gemini-2.0-flash" gave a quota limit of 0.
            // "gemini-flash-latest" is the alias for the current stable flash model (usually 1.5) which has a free tier.
            const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

            const prompt = `
            Act as a financial parser. Analyze this WhatsApp message and extract transaction data.
            Message: "${body}"
            
            Return ONLY a raw JSON object (no markdown, no quotes around the block) with:
            - "amount": number (extract value).
            - "description": string (short summary, max 5 words).
            - "type": "income" or "expense" (default to "expense" unless key words like receives, salary, gain, +, etc are present).
            - "tag": string (suggest a category like 'Alimentação', 'Transporte', 'Lazer', 'Casa', 'Trabalho', 'Saúde').
            
            If you cannot extract a valid amount, return null.
            `;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            // Clean markdown if present (Gemini sometimes parses ```json ... ```)
            const cleanJson = responseText.replace(/```json|```/g, '').trim();
            const data = JSON.parse(cleanJson);

            if (!data || !data.amount) {
                throw new Error("Invalid structure");
            }

            // 4. Create Transaction
            const transaction = {
                userId: user._id,
                profileId: user._id, // Assuming same profile for main user
                type: data.type || 'expense',
                description: data.description || 'WhatsApp Transaction',
                amount: parseFloat(data.amount),
                date: new Date(),
                tag: data.tag || 'WhatsApp',
                createdAt: new Date(), // Important for sorting
            };

            await db.collection('transactions').insertOne(transaction);

            // 5. Success Reply
            const icon = transaction.type === 'income' ? '💰' : '💸';
            twiml.message(`✅ Salvo: ${icon} ${transaction.type === 'income' ? 'Receita' : 'Despesa'} de R$ ${transaction.amount} \n📝 ${transaction.description} \n🏷️ ${transaction.tag}`);

        } catch (aiError) {
            console.error("AI Parse Error:", aiError);
            twiml.message('❌ Não entendi o valor. Tente algo como: "Gastei 50 no almoço" ou "Recebi 100".');
        }

        return new NextResponse(twiml.toString(), {
            headers: { 'Content-Type': 'text/xml' },
        });

    } catch (error) {
        console.error('WhatsApp Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
