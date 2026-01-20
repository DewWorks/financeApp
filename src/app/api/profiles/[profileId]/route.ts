import { NextResponse } from "next/server"
import { getMongoClient } from "@/db/connectionDb"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

async function getUserIdFromToken() {
    const token = (await cookies()).get("auth_token")?.value
    if (!token) {
        throw new Error("No token provided")
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    return new ObjectId(decoded.userId)
}

// PUT - Atualizar perfil
/**
 * @swagger
 * /api/profiles/{profileId}:
 *   put:
 *     tags:
 *       - Profiles
 *     summary: Update profile
 *     description: Updates a profile's details. Only admins can update.
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: Profile ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *       400:
 *         description: Missing fields
 *       403:
 *         description: Permission denied
 *       500:
 *         description: Internal server error
 */
export async function PUT(request: Request, { params }: { params: Promise<{ profileId: string }> }) {
    try {
        const userId = await getUserIdFromToken()
        const resolvedParams = await params;
        const profileId = new ObjectId(resolvedParams.profileId)
        const { name, description } = await request.json()

        if (!name?.trim()) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 })
        }

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

        // Atualizar perfil
        await db.collection("profiles").updateOne(
            { _id: profileId },
            {
                $set: {
                    name: name.trim(),
                    description: description?.trim() || "",
                    updatedAt: new Date(),
                },
            },
        )

        return NextResponse.json({ message: "Profile updated successfully" })
    } catch (error) {
        console.error("Update profile error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// DELETE - Excluir perfil
/**
 * @swagger
 * /api/profiles/{profileId}:
 *   delete:
 *     tags:
 *       - Profiles
 *     summary: Delete profile
 *     description: Soft deletes a profile. Only the creator can delete.
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: Profile ID
 *     responses:
 *       200:
 *         description: Profile deleted
 *       403:
 *         description: Permission denied
 *       500:
 *         description: Internal server error
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ profileId: string }> }) {
    try {
        const userId = await getUserIdFromToken()
        const resolvedParams = await params;
        const profileId = new ObjectId(resolvedParams.profileId)

        const client = await getMongoClient()
        const db = client.db("financeApp")

        // Verificar se o usuário é o criador do perfil
        const profile = await db.collection("profiles").findOne({
            _id: profileId,
            createdBy: userId,
        })

        if (!profile) {
            return NextResponse.json({ error: "Permission denied - only creator can delete profile" }, { status: 403 })
        }

        // Marcar como inativo ao invés de deletar
        await db.collection("profiles").updateOne(
            { _id: profileId },
            {
                $set: {
                    isActive: false,
                    deletedAt: new Date(),
                    updatedAt: new Date(),
                },
            },
        )

        return NextResponse.json({ message: "Profile deleted successfully" })
    } catch (error) {
        console.error("Delete profile error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
