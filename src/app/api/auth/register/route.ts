import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getMongoClient } from '@/db/connectionDb';

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new user
 *     description: Creates a new user account.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - cel
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               cel:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: User already exists
 *       500:
 *         description: Internal server error
 */
export async function POST(request: Request) {
  try {
    const { name, email, cel, password, termsAccepted } = await request.json()
    const client = await getMongoClient();

    if (!termsAccepted) {
      return NextResponse.json({ error: 'Você deve aceitar os Termos de Uso.' }, { status: 400 })
    }

    const db = client.db("financeApp");

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: 'Este email já está cadastrado. Tente fazer login.' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Insert new user
    const result = await db.collection('users').insertOne({
      name,
      email,
      cel,
      password: hashedPassword,
      terms: {
        accepted: true,
        acceptedAt: new Date(),
        ip: ip,
        userAgent: userAgent
      },
      tutorialGuide: false,
      executeQuery: false
    })

    // Send Welcome Email (Async)
    import("@/services/NotificationService").then(({ NotificationService }) => {
      new NotificationService().sendWelcomeEmail({ name, email }).catch(console.error);
    });

    return NextResponse.json({ message: 'Usuário cadastrado com sucesso!' }, { status: 201 })
    // console.log(result);
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor. Tente novamente mais tarde.' }, { status: 500 })
  }
}