import { getMongoClient } from '@/db/connectionDb';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/app/functions/emails/sendEmail';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        const client = await getMongoClient();
        const db = client.db("financeApp");

        const user = await db.collection('users').findOne({ email });

        if (!user) {
            return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

        await db.collection('users').updateOne(
            { email },
            {
                $set: {
                    verification: {
                        code,
                        type: 'reset-password',
                        channels: ['email'],
                        expiresAt,
                        verified: false
                    }
                }
            }
        );

        await sendEmail({
            to: email,
            subject: 'Código de recuperação de senha',
            htmlContent: `
    <h2 style="color: #0085FF;">Seu código de verificação:</h2>
    <p style="font-size: 18px;"><strong>${code}</strong></p>
    <p>Este código é válido por 10 minutos.</p>
  `
        });

        return NextResponse.json({ message: 'Código enviado por e-mail.' }, { status: 200 });
    } catch (err) {
        console.error("Erro em forgot-password:", err);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
