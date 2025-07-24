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
export async function PUT(request: Request, { params }: { params: { profileId: string } }) {
    try {
        const userId = await getUserIdFromToken()
        const profileId = new ObjectId(params.profileId)
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
export async function DELETE(request: Request, { params }: { params: { profileId: string } }) {
    try {
        const userId = await getUserIdFromToken()
        const profileId = new ObjectId(params.profileId)

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
