import { NextResponse } from "next/server"
import { getMongoClient } from "@/db/connectionDb"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

class AuthError extends Error {
    constructor(
        message: string,
        public status: number,
    ) {
        super(message)
        this.name = "AuthError"
    }
}

// Função para gerar senha de 6 dígitos
function generateRandomPassword(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

async function findOrCreateUser(phoneNumber: string) {
    const client = await getMongoClient()
    const db = client.db("financeApp")

    // Limpar número de telefone (remover caracteres especiais)
    const cleanPhone = phoneNumber.replace(/\D/g, "")

    // Buscar usuário pelo número de telefone
    let user = await db.collection("users").findOne({
        $or: [
            { cel: { $in: [phoneNumber] } },
            { cel: { $in: [cleanPhone] } },
            { cel: { $in: [`+55${cleanPhone}`] } },
            { cel: { $in: [`55${cleanPhone}`] } },
        ],
    })

    let isNewUser = false
    let temporaryPassword = null
    let verificationCode = null;

    // Se usuário não existe, criar um novo
    if (!user) {
        // Gerar senha temporária
        temporaryPassword = generateRandomPassword()
        const hashedPassword = await bcrypt.hash(temporaryPassword, 10)

        verificationCode = generateRandomPassword();

        const newUser = {
            name: `Usuário ${cleanPhone.slice(-4)}`, // Nome temporário baseado nos últimos 4 dígitos
            email: `${cleanPhone}@whatsapp.temp`, // Email temporário
            password: hashedPassword, // Senha hasheada
            cel: [cleanPhone],
            createdAt: new Date(),
            source: "whatsapp",
            tutorialGuide: false,
            executeQuery: true,
            verification: {
                code: verificationCode,
                type: 'verify-number',
                channels: ['whatsapp'],
                expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutos
                verified: false,
            },
        }

        const result = await db.collection("users").insertOne(newUser)
        user = { ...newUser, _id: result.insertedId }
        isNewUser = true
    }

    return {
        user,
        isNewUser,
        userId: new ObjectId(user._id),
        temporaryPassword,
        verificationCode,
    }
}

export async function POST(request: Request) {
    try {
        const { phoneNumber, transaction } = await request.json()

        // Validar dados obrigatórios
        if (!phoneNumber || !transaction) {
            return NextResponse.json(
                {
                    error: "Missing required fields: phoneNumber, transaction",
                },
                { status: 400 },
            )
        }

        // Validar dados da transação
        if (!transaction.type || !transaction.amount || !transaction.description) {
            return NextResponse.json(
                {
                    error: "Missing transaction fields: type, amount, description",
                },
                { status: 400 },
            )
        }

        // Buscar ou criar usuário
        const { user, isNewUser, userId, temporaryPassword, verificationCode } = await findOrCreateUser(phoneNumber)

        const client = await getMongoClient()
        const db = client.db("financeApp")

        // Preparar dados da transação
        const transactionData = {
            ...transaction,
            userId,
            date: new Date(transaction.date || new Date()),
            source: "whatsapp",
            createdAt: new Date(),
            // Adicionar tag padrão se não fornecida
            tag: transaction.tag || "Outros",
        }

        // Inserir transação
        const result = await db.collection("transactions").insertOne(transactionData)

        // Preparar resposta baseada se é usuário novo ou existente
        if (isNewUser) {
            return NextResponse.json(
                {
                    message: "New user created and transaction added successfully via WhatsApp",
                    newUser: true,
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        cel: user.cel,
                        createdAt: user.createdAt,
                    },
                    transaction: {
                        id: result.insertedId,
                        ...transactionData,
                        userId: userId.toString(),
                    },
                    // Dados para envio via WhatsApp
                    whatsappMessage: {
                        phoneNumber: phoneNumber,
                        message: `🎉 Bem-vindo ao FinancePro!\n\n✅ Sua transação foi registrada:\n💰 ${transaction.type === "income" ? "Receita" : "Despesa"}: R$ ${transaction.amount.toFixed(2)}\n📝 ${transaction.description}\n\n🔐`,
                    },
                    temporaryPassword,
                    verificationCode // Para logs/debug (remover em produção)

                },
                { status: 201 },
            )
        } else {
            return NextResponse.json(
                {
                    message: "Transaction added successfully via WhatsApp",
                    newUser: false,
                    transaction: {
                        id: result.insertedId,
                        ...transactionData,
                        userId: userId.toString(),
                    },
                    user: {
                        name: user.name,
                    },
                    // Mensagem de confirmação para usuário existente
                    whatsappMessage: {
                        phoneNumber: phoneNumber,
                        message: `✅ Transação registrada com sucesso!\n\n💰 ${transaction.type === "income" ? "Receita" : "Despesa"}: R$ ${transaction.amount.toFixed(2)}\n📝 ${transaction.description}\n🏷️ Categoria: ${transaction.tag || "Outros"}\n\n📊 Acesse seu dashboard: ${process.env.NEXTAUTH_URL}`,
                    },
                },
                { status: 201 },
            )
        }
    } catch (error) {
        console.error("WhatsApp transaction error:", error)

        if (error instanceof AuthError) {
            return NextResponse.json({ error: error.message }, { status: error.status })
        }

        if (error instanceof Error) {
            if (error.name === "MongoNetworkError") {
                return NextResponse.json({ error: "Database connection error" }, { status: 503 })
            }
            if (error.name === "ValidationError") {
                return NextResponse.json({ error: "Invalid transaction data" }, { status: 400 })
            }
        }

        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// Rota para atualizar dados do usuário temporário
export async function PATCH(request: Request) {
    try {
        const { phoneNumber, userData } = await request.json()

        if (!phoneNumber || !userData) {
            return NextResponse.json(
                {
                    error: "Missing required fields: phoneNumber, userData",
                },
                { status: 400 },
            )
        }

        const client = await getMongoClient()
        const db = client.db("financeApp")

        const cleanPhone = phoneNumber.replace(/\D/g, "")

        // Se está atualizando a senha, fazer hash
        if (userData.password) {
            userData.password = await bcrypt.hash(userData.password, 10)
            userData.passwordGenerated = false // Marcar que não é mais senha gerada
        }

        // Atualizar dados do usuário
        const result = await db.collection("users").updateOne(
            {
                $or: [
                    { cel: { $in: [phoneNumber] } },
                    { cel: { $in: [cleanPhone] } },
                    { cel: { $in: [`+55${cleanPhone}`] } },
                    { cel: { $in: [`55${cleanPhone}`] } },
                ],
            },
            {
                $set: {
                    ...userData,
                    isTemporary: false, // Remover flag de temporário
                    updatedAt: new Date(),
                },
            },
        )

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        return NextResponse.json(
            {
                message: "User updated successfully",
                updated: true,
            },
            { status: 200 },
        )
    } catch (error) {
        console.error("Update user error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// Nova rota para reenviar credenciais
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const phoneNumber = searchParams.get("phoneNumber")

        if (!phoneNumber) {
            return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
        }

        const client = await getMongoClient()
        const db = client.db("financeApp")

        const cleanPhone = phoneNumber.replace(/\D/g, "")

        // Buscar usuário
        const user = await db.collection("users").findOne({
            $or: [
                { cel: { $in: [phoneNumber] } },
                { cel: { $in: [cleanPhone] } },
                { cel: { $in: [`+55${cleanPhone}`] } },
                { cel: { $in: [`55${cleanPhone}`] } },
            ],
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Se é usuário temporário com senha gerada, gerar nova senha
        if (user.isTemporary && user.passwordGenerated) {
            const newPassword = generateRandomPassword()
            const hashedPassword = await bcrypt.hash(newPassword, 10)

            await db.collection("users").updateOne({ _id: user._id }, { $set: { password: hashedPassword } })

            return NextResponse.json({
                message: "New password generated",
                whatsappMessage: {
                    phoneNumber: phoneNumber,
                    message: `🔐 Nova senha gerada para o FinancePro!\n\n📧 Email: ${user.email}\n🔑 Nova senha: ${newPassword}\n\n📱 Acesse: ${process.env.NEXTAUTH_URL}/auth/login\n\n💡 Altere sua senha após o login!`,
                },
            })
        }

        return NextResponse.json({
            message: "User credentials",
            whatsappMessage: {
                phoneNumber: phoneNumber,
                message: `📱 Seus dados de acesso ao FinancePro:\n\n📧 Email: ${user.email}\n\n🔗 Acesse: ${process.env.NEXTAUTH_URL}/auth/login\n\n❓ Esqueceu a senha? Use a opção "Esqueci minha senha" no site.`,
            },
        })
    } catch (error) {
        console.error("Get user credentials error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
