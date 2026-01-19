import { NextResponse } from "next/server"
import { getMongoClient } from "@/db/connectionDb"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import { sendEmail } from "@/app/functions/emails/sendEmail"
import { IMember, IProfile } from "@/interfaces/IProfile"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

async function getUserIdFromToken() {
    const token = (await cookies()).get("auth_token")?.value
    if (!token) {
        throw new Error("No token provided")
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    return new ObjectId(decoded.userId)
}

/**
 * @swagger
 * /api/profiles/{profileId}/members/{memberId}:
 *   put:
 *     summary: Update member permissions
 *     description: Updates the permission level of a collaborative profile member.
 *     tags:
 *       - Members
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permission:
 *                 type: string
 *                 enum: [ADMIN, COLABORATOR, VIEWER]
 *     responses:
 *       200:
 *         description: Member updated successfully
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Member or User not found
 */
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ profileId: string; memberId: string }> }
) {
    try {
        const userId = await getUserIdFromToken()
        const { permission } = await request.json()
        const resolvedParams = await params
        const { profileId, memberId } = resolvedParams

        const profileObjectId = new ObjectId(profileId)
        const memberObjectId = new ObjectId(memberId)
        const userObjectId = new ObjectId(String(userId))

        console.log("PUT Request - Profile ID:", profileId)
        console.log("PUT Request - Member ID:", memberId)
        console.log("PUT Request - New Permission:", permission)

        const client = await getMongoClient()
        const db = client.db("financeApp")

        // Verificar se o usuário tem permissão de ADMIN
        const profile = await db.collection("profiles").findOne({
            _id: profileObjectId,
            "members.userId": userObjectId,
            "members.permission": "ADMIN",
        })

        console.log("Profile found:", profile)

        if (!profile) {
            return NextResponse.json({ error: "Permission denied" }, { status: 403 })
        }

        // Buscar dados do membro que está sendo atualizado
        const memberToUpdate: IMember = profile.members.find((member: IMember) => member.userId.toString() === memberId.toString())

        if (!memberToUpdate) {
            return NextResponse.json({ error: "Member not found" }, { status: 404 })
        }

        // Buscar dados do usuário que está sendo atualizado
        const targetUser = await db.collection("users").findOne({ _id: memberObjectId })

        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Buscar dados do usuário que está fazendo a alteração
        const adminUser = await db.collection("users").findOne({ _id: userId })

        // Atualizar permissão do membro
        const updateResult = await db.collection("profiles").updateOne(
            { _id: profileObjectId, "members.userId": memberObjectId },
            {
                $set: {
                    "members.$.permission": permission,
                    updatedAt: new Date(),
                },
            },
        )

        if (updateResult.matchedCount === 0) {
            return NextResponse.json({ error: "Member not found in profile" }, { status: 404 })
        }

        // Preparar dados para o email de notificação
        const permissionLabels = {
            ADMIN: "Administrador",
            COLABORATOR: "Colaborador",
            VIEWER: "Visualizador",
        }

        const permissionDescriptions = {
            ADMIN: "Você agora tem controle total sobre esta conta, incluindo gerenciar membros e configurações.",
            COLABORATOR: "Você pode adicionar, editar e visualizar transações desta conta.",
            VIEWER: "Você pode apenas visualizar as transações e relatórios desta conta.",
        }

        // Enviar email de notificação sobre mudança de permissão
        const emailHtml = `
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #0085FF; margin-bottom: 10px;">🔄 Permissão Atualizada</h1>
        <h2 style="color: #333; font-weight: normal;">Sua permissão foi alterada na conta colaborativa</h2>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">📋 Detalhes da Alteração</h3>
        <p><strong>Conta:</strong> ${profile.name}</p>
        <p><strong>Alterado por:</strong> ${adminUser?.name || "Administrador"}</p>
        <p><strong>Nova Permissão:</strong> <span style="color: #0085FF; font-weight: bold;">${permissionLabels[permission as keyof typeof permissionLabels]}</span></p>
        <p><strong>Data:</strong> ${new Date().toLocaleDateString("pt-BR")}</p>
      </div>

      <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1976d2; margin-top: 0;">🔐 O que você pode fazer agora</h3>
        <p style="margin-bottom: 0;">${permissionDescriptions[permission as keyof typeof permissionDescriptions]}</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXTAUTH_URL || "https://finance-pro-mu.vercel.app"}" 
           style="background-color: #0085FF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Acessar FinancePro
        </a>
      </div>

      <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #e65100; margin-top: 0;">💡 Informações Importantes</h3>
        <ul style="margin: 0; padding-left: 20px; color: #666;">
          <li style="margin-bottom: 8px;">Esta alteração é efetiva imediatamente</li>
          <li style="margin-bottom: 8px;">Você pode acessar a conta através do seletor de contas no dashboard</li>
          <li style="margin-bottom: 8px;">Se tiver dúvidas, entre em contato com o administrador da conta</li>
        </ul>
      </div>
    `

        try {
            await sendEmail({
                to: targetUser.email,
                subject: `🔄 Sua permissão foi alterada na conta "${profile.name}"`,
                htmlContent: emailHtml,
            })
        } catch (emailError) {
            console.error("Error sending permission change email:", emailError)
            // Não falhar a operação se o email não for enviado
        }

        return NextResponse.json({
            message: "Member updated successfully",
            updatedMember: {
                name: targetUser.name,
                email: targetUser.email,
                oldPermission: memberToUpdate.permission,
                newPermission: permission,
            },
        })
    } catch (error) {
        console.error("Update member error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}


/**
 * @swagger
 * /api/profiles/{profileId}/members/{memberId}:
 *   delete:
 *     summary: Remove a member from the profile
 *     description: Removes a member from the collaborative profile. Only admins can perform this action.
 *     tags:
 *       - Members
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: The profile ID
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *         description: The member ID to remove
 *     responses:
 *       200:
 *         description: Member removed successfully
 *       403:
 *         description: Permission denied
 *       400:
 *         description: Cannot remove profile creator
 *       500:
 *         description: Internal server error
 */
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ profileId: string; memberId: string }> }
) {
    try {
        const userId = await getUserIdFromToken()
        const resolvedParams = await params
        const profileId = new ObjectId(resolvedParams.profileId)
        const memberId = new ObjectId(resolvedParams.memberId)

        const client = await getMongoClient()
        const db = client.db("financeApp")

        // Verificar se o usuário tem permissão de ADMIN
        const profile = await db.collection("profiles").findOne({
            _id: profileId,
            "members.userId": userId,
            "members.permission": "ADMIN",
        })

        if (!profile) {
            return NextResponse.json({ error: "Permission denied" }, { status: 403 })
        }

        // Não permitir remover o criador do profile
        if (profile.createdBy.toString() === memberId.toString()) {
            return NextResponse.json({ error: "Cannot remove profile creator" }, { status: 400 })
        }

        // Buscar usuário para notificar
        const memberToRemove = profile.members.find((m: IMember) => m.userId.toString() === memberId.toString())
        const userToRemove = await db.collection("users").findOne({ _id: memberId })

        // Remover membro
        const profiles = db.collection<IProfile>("profiles")
        await profiles.updateOne(
            { _id: profileId },
            {
                $pull: { members: { userId: memberId } },
                $set: { updatedAt: new Date() },
            },
        )

        // Enviar email de notificação (opcional, mas boa prática)
        if (userToRemove && memberToRemove) {
            const emailHtml = `
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #e53935; margin-bottom: 10px;">🚫 Acesso Removido</h1>
                    <h2 style="color: #333; font-weight: normal;">Você foi removido da conta colaborativa</h2>
                </div>
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Conta:</strong> ${profile.name}</p>
                    <p><strong>Data:</strong> ${new Date().toLocaleDateString("pt-BR")}</p>
                </div>
            `;

            try {
                await sendEmail({
                    to: userToRemove.email,
                    subject: `🚫 Removido da conta "${profile.name}"`,
                    htmlContent: emailHtml
                })
            } catch (e) {
                console.error("Failed to send removal email", e)
            }
        }

        return NextResponse.json({ message: "Member removed successfully" })
    } catch (error) {
        console.error("Remove member error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
