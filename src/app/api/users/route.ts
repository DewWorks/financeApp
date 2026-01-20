import { getMongoClient } from '@/db/connectionDb';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { sendEmail } from '@/app/functions/emails/sendEmail';
import { IUser } from '@/interfaces/IUser';

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

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get current user
 *     description: Retrieves the authenticated user's profile.
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/users:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Add phone number
 *     description: Adds a phone number to the user's profile.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cel:
 *                 type: string
 *     responses:
 *       200:
 *         description: Phone number updated
 *       400:
 *         description: Invalid phone number
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
export async function PATCH(request: Request) {
    const userId = await getUserIdFromToken();
    const { cel } = await request.json();

    let phoneToProcess = '';
    if (Array.isArray(cel) && cel.length > 0) {
        phoneToProcess = cel[0];
    } else if (typeof cel === 'string') {
        phoneToProcess = cel;
    }

    if (!phoneToProcess) {
        return NextResponse.json({ error: 'Número de celular inválido' }, { status: 400 });
    }

    // Normalização do telefone para formato +55
    const cleanNum = phoneToProcess.replace(/\D/g, '');
    const normalizedPhone = cleanNum.startsWith('55') && cleanNum.length > 11
        ? `+${cleanNum}`
        : `+55${cleanNum}`;

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
            { $push: { cel: { $each: [normalizedPhone] } } } as unknown as string[]
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
        if (user) {
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

/**
 * @swagger
 * /api/users:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update user profile
 *     description: Updates name, email, and phone numbers.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               cel:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: User updated
 *       400:
 *         description: Invalid data or email already in use
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
export async function PUT(request: Request) {
    try {
        const userId = await getUserIdFromToken();

        const { name, email, cel } = await request.json()

        if (!name?.trim() || !email?.trim()) {
            return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
        }

        const client = await getMongoClient()
        const db = client.db("financeApp")

        // Verificar se o email já está em uso por outro usuário
        const existingUser = await db.collection("users").findOne({
            email: email.trim(),
            _id: { $ne: userId },
        })

        if (existingUser) {
            return NextResponse.json({ error: "Email already in use" }, { status: 400 })
        }

        // Atualizar usuário
        const updateData: Partial<IUser> = {
            name: name.trim(),
            email: email.trim(),
            updatedAt: new Date(),
        }

        if (cel && Array.isArray(cel)) {
            updateData.cel = cel
                .filter((phone) => phone.trim())
                .map(phone => {
                    const cleanNum = phone.replace(/\D/g, '');
                    return cleanNum.startsWith('55') && cleanNum.length > 11
                        ? `+${cleanNum}`
                        : `+55${cleanNum}`;
                });
        }

        const result = await db.collection("users").updateOne({ _id: userId }, { $set: updateData })

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        return NextResponse.json({ message: "User updated successfully" })
    } catch (error) {
        console.error("Update user error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
