import { NextResponse } from 'next/server';
import { getMongoClient } from '@/db/connectionDb';
import twilio from 'twilio';
const { MessagingResponse } = twilio.twiml;

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const from = formData.get('From') as string;
        const body = formData.get('Body') as string;

        if (!from || !body) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        // 1. Clean Phone Number (Remove 'whatsapp:' prefix)
        const cleanPhone = from.replace('whatsapp:', '');

        // 2. Connect to DB and Find User
        const client = await getMongoClient();
        const db = client.db('financeApp');

        // Find user where 'cel' array contains the phone number
        const user = await db.collection('users').findOne({
            cel: cleanPhone
        });

        // TwiML Generator
        const twiml = new MessagingResponse();

        if (!user) {
            console.log(`User not found for phone: ${cleanPhone}`);
            twiml.message('❌ Usuário não encontrado. Verifique se seu número está cadastrado no perfil.');
            return new NextResponse(twiml.toString(), {
                headers: { 'Content-Type': 'text/xml' },
            });
        }

        // 3. Parse Message
        // Regex: Checks for optional '+' then a number, then the rest
        // Examples: "50 lunch", "+100 salary"
        const regex = /^(\+)?\s*(\d+([.,]\d+)?)\s*(.*)$/i;
        const match = body.match(regex);

        if (!match) {
            twiml.message('❌ Não entendi. Envie apenas o valor e descrição. Ex: "15 Padaria" ou "+50 Venda".');
            return new NextResponse(twiml.toString(), {
                headers: { 'Content-Type': 'text/xml' },
            });
        }

        const isIncome = !!match[1]; // Group 1 is '+'
        const amountStr = match[2].replace(',', '.'); // Handle comma decimal
        let amount = parseFloat(amountStr);
        let rawDescription = match[4].trim();

        // 4. Extract Tags (#tag)
        let tag = 'WhatsApp'; // Default tag
        const tagRegex = /#(\w+)/;
        const tagMatch = rawDescription.match(tagRegex);

        if (tagMatch) {
            tag = tagMatch[1]; // content of the tag without #
            // Remove tag from description
            rawDescription = rawDescription.replace(tagMatch[0], '').trim();
        }

        // Default description if empty
        const description = rawDescription || (isIncome ? 'Receita WhatsApp' : 'Despesa WhatsApp');

        // 5. Create Transaction
        const transaction = {
            userId: user._id,
            profileId: user._id, // Assuming same profile for main user
            type: isIncome ? 'income' : 'expense',
            description: description,
            amount: amount,
            date: new Date(),
            tag: tag,
            createdAt: new Date(), // Important for sorting
        };

        await db.collection('transactions').insertOne(transaction);

        // 6. Success Reply
        const icon = isIncome ? '💰' : '💸';
        twiml.message(`✅ Salvo: ${icon} ${isIncome ? 'Receita' : 'Despesa'} de R$ ${amount} \n📝 ${description} \n🏷️ ${tag}`);

        return new NextResponse(twiml.toString(), {
            headers: { 'Content-Type': 'text/xml' },
        });

    } catch (error) {
        console.error('WhatsApp Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
