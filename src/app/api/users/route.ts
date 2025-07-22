import { getMongoClient } from '@/db/connectionDb';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { sendEmail } from '@/app/functions/emails/sendEmail';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

class AuthError extends Error {
    constructor(message: string, public status: number) {
        super(message);
        this.name = 'AuthError';
    }
}

async function getUserIdFromToken() {
    const token = (await cookies()).get('auth_token')?.value
    if (!token) {
        throw new AuthError('No token provided', 401)
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
        return new ObjectId(decoded.userId)
    } catch (error) {
        console.error('Invalid token:', error)
        throw new AuthError('Invalid token', 401)
    }
}

export async function GET() {
    try {
        const userId = await getUserIdFromToken();
        const client = await getMongoClient();
        const db = client.db('financeApp');

        const user = await db.collection('users').findOne(
            { _id: userId },
            { projection: { password: 0 } }
        );

        if (!user) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error('Erro ao buscar usuário:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const userId = await getUserIdFromToken();
    const { cel } = await request.json();

    if (!cel || typeof cel !== 'string') {
        return NextResponse.json({ error: 'Número de celular inválido' }, { status: 400 });
    }

    const normalizedPhone = cel.replace(/\D/g, ''); // remove não-números

    const client = await getMongoClient();
    const db = client.db('financeApp');

    const user = await db.collection('users').findOne({ _id: userId });

    try {
        if (!user) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        // Verifica se já existe esse número
        const currentPhones = user.cel || [];
        if (currentPhones.includes(normalizedPhone)) {
            return NextResponse.json({ message: 'Número já cadastrado' }, { status: 200 });
        }

        // Adiciona número ao array
        const updatedUser = await db.collection('users').updateOne(
            { _id: userId },
            {$push: {cel: {$each: [normalizedPhone]}}} as unknown as string[]
        )

        // Envia e-mail de confirmação
        await sendEmail({
            to: user.email,
            subject: '✅ Número de celular adicionado com sucesso!',
            htmlContent: `
        <h2 style="color: #0085FF;">✅ Tudo certo por aqui!</h2>
        <p style="font-size: 16px;">O número <strong>${normalizedPhone}</strong> foi adicionado com sucesso à sua conta do <strong>FinancePro</strong>.</p>
        <p style="font-size: 16px;">Agora você poderá <strong>EM BREVE</strong> organizar suas finanças, diretamente do whatsapp.</p>

        <br/>
        <a href="https://finance-pro-mu.vercel.app/" 
          style="display: inline-block; padding: 12px 24px; background-color: #0085FF; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Voltar para o FinancePro
        </a>

        <br/><br/>
        <p style="font-size: 14px; color: #888;">💙 Equipe FinancePro</p>
      `
        });

        return NextResponse.json({ message: 'Número de celular atualizado com sucesso', user: updatedUser }, { status: 200 });
    } catch (error) {
        console.error('Erro ao atualizar celular:', error);
        if(user) {
            await sendEmail({
                to: user.email,
                subject: '📱 Número já está cadastrado no FinancePro',
                htmlContent: `
  <h2 style="color: #0085FF;">Houve um erro ao processar sua solicitação</h2>

  <p style="font-size: 16px; color: #333;">
    Ocorreu um problema ao tentar cadastrar seu número de celular em sua conta do FinancePro.
  </p>

  <p style="font-size: 16px; color: #333;">
    Para cadastrar corretamente seu número, siga os passos abaixo:
  </p>

  <ol style="font-size: 16px; color: #333; padding-left: 20px;">
    <li>Acesse sua conta pelo link abaixo</li>
    <li>Clique no botão verde de <strong>"whatsapp + financePro"</strong></li>
    <li>Ao navegar, verá um campo para adicionar o número, digite seu número</li>
    <li>Confirme</li>
  </ol>

  <br/>

  <a href="https://finance-pro-mu.vercel.app/whatsapp-connect"
    style="display: inline-block; padding: 12px 24px; background-color: #0085FF; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
    Acessar Perfil
  </a>

  <br/><br/>

  <p style="font-size: 16px; color: #333;">
    Caso continue enfrentando dificuldades, você pode responder este e-mail informando:
  </p>

  <ul style="font-size: 16px; color: #333;">
    <li>O e-mail cadastrado em sua conta</li>
    <li>O número de celular que deseja adicionar (com DDD)</li>
  </ul>

  <p style="font-size: 16px; color: #333;">
    Assim, nossa equipe poderá ajudá-lo diretamente com o cadastro.
  </p>

  <br/>
  <p style="font-size: 14px; color: #888;">Equipe FinancePro</p>
`

            });
        }
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
