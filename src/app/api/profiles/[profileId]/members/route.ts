import { NextResponse } from "next/server"
import { getMongoClient } from "@/db/connectionDb"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import { sendEmail } from "@/app/functions/emails/sendEmail"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

async function getUserIdFromToken() {
    const token = (await cookies()).get("auth_token")?.value
    if (!token) {
        throw new Error("No token provided")
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    return new ObjectId(decoded.userId)
}

// POST - Adicionar membro ao profile
export async function POST(request: Request, { params }: { params: { profileId: string } }) {
    try {
        const userId = await getUserIdFromToken()
        const { email, phone, permission = "COLABORATOR" } = await request.json()
        const profileId = new ObjectId(params.profileId)

        const client = await getMongoClient()
        const db = client.db("financeApp")

        // Verificar se o usuário tem permissão de ADMIN no profile
        const profile = await db.collection("profiles").findOne({
            _id: profileId,
            "members.userId": userId,
            "members.permission": "ADMIN",
        })

        if (!profile) {
            return NextResponse.json({ error: "Permission denied" }, { status: 403 })
        }

        // Buscar usuário pelo email
        const targetUser = await db.collection("users").findOne({ email })
        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Verificar se já é membro
        const isAlreadyMember = profile.members.some(
            (member: any) => member.userId.toString() === targetUser._id.toString(),
        )

        if (isAlreadyMember) {
            return NextResponse.json({ error: "User is already a member" }, { status: 400 })
        }

        // Buscar dados do usuário que está adicionando
        const inviterUser = await db.collection("users").findOne({ _id: userId })

        // Criar objeto do novo membro com tipos corretos
        const newMember = {
            userId: new ObjectId(targetUser._id),
            permission: permission as "ADMIN" | "COLABORATOR" | "VIEWER",
            joinedAt: new Date(),
            invitedBy: new ObjectId(userId),
            status: "ACTIVE" as "ACTIVE" | "PENDING" | "SUSPENDED",
        }

        // Adicionar membro usando $push com tipo correto
        await db.collection("profiles").updateOne(
            { _id: profileId },
            {
                $push: {
                    members: newMember,
                } as any, // Usar any para contornar o erro de tipo do MongoDB
                $set: { updatedAt: new Date() },
            },
        )
        // Enviar email de notificação
        const emailHtml = `
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #0085FF; margin-bottom: 10px;">🎉 Bem-vindo ao FinancePro!</h1>
        <h2 style="color: #333; font-weight: normal;">Você foi adicionado a uma conta colaborativa</h2>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">📋 Detalhes da Conta</h3>
        <p><strong>Nome da Conta:</strong> ${profile.name}</p>
        ${profile.description ? `<p><strong>Descrição:</strong> ${profile.description}</p>` : ""}
        <p><strong>Adicionado por:</strong> ${inviterUser?.name || "Administrador"}</p>
      </div>

      <div style="background-color: #f1f8e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #388e3c; margin-top: 0;">🚀 Próximos Passos</h3>
        <ol style="margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Acesse sua conta no FinancePro</li>
          <li style="margin-bottom: 8px;">Use o seletor de contas no canto superior para trocar para "${profile.name}"</li>
          <li style="margin-bottom: 8px;">Comece a colaborar com sua equipe nas finanças!</li>
        </ol>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXTAUTH_URL || "https://finance-pro-mu.vercel.app"}" 
           style="background-color: #0085FF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Acessar FinancePro
        </a>
      </div>

      <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
        <h3 style="color: #333; margin-top: 0;">💡 Dicas Importantes</h3>
        <ul style="margin: 0; padding-left: 20px; color: #666;">
          <li style="margin-bottom: 8px;">Todas as transações desta conta são compartilhadas com todos os membros</li>
          <li style="margin-bottom: 8px;">Você pode trocar entre sua conta pessoal e contas colaborativas a qualquer momento</li>
          <li style="margin-bottom: 8px;">Use categorias consistentes para melhores relatórios</li>
          ${permission === "ADMIN" ? '<li style="margin-bottom: 8px; color: #f57c00;"><strong>Como administrador, você pode gerenciar outros membros e configurações da conta</strong></li>' : ""}
        </ul>
      </div>
    `

        try {
            await sendEmail({
                to: email,
                subject: `🎉 Você foi adicionado à conta "${profile.name}" no FinancePro`,
                htmlContent: emailHtml,
            })
        } catch (emailError) {
            console.error("Error sending email:", emailError)
            // Não falhar a operação se o email não for enviado
        }

        return NextResponse.json({
            message: "Member added successfully",
            memberAdded: {
                name: targetUser.name,
                email: targetUser.email,
                permission: permission,
            },
        })
    } catch (error) {
        console.error("Add member error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
