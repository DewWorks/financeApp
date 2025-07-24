import { NextResponse } from "next/server"
import { getMongoClient } from "../../../../../db/connectionDb"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import { IMember } from "@/interfaces/IProfile"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

async function getUserIdFromToken() {
    const token = (await cookies()).get("auth_token")?.value
    if (!token) {
        throw new Error("No token provided")
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    return new ObjectId(decoded.userId)
}

export async function GET() {
    try {
        const userId = await getUserIdFromToken()

        const client = await getMongoClient()
        const db = client.db("financeApp")

        // Buscar o perfil
        const profile = await db.collection("profiles").findOne({
            "members.userId": userId,
            isActive: true,
        })

        if (!profile) {
            return NextResponse.json({ error: "Profile not found or access denied" }, { status: 404 })
        }

        // Verificar se o usuário é admin
        const userMember: IMember = profile.members.find((m: IMember) => m.userId.toString() === userId.toString())
        const isUserAdmin = userMember?.permission === "ADMIN" || profile.createdBy.toString() === userId.toString()

        // Extrair os userIds dos membros
        const userIds = profile.members.map((member: any) => new ObjectId(member.userId))

        // Buscar usuários correspondentes
        const users = await db
            .collection("users")
            .find({ _id: { $in: userIds } })
            .toArray()

        // Criar um mapa para acesso rápido
        const userMap = new Map(users.map((u) => [u._id.toString(), u]))

        // Montar membros com dados adicionais
        const membersWithDetails = profile.members.map((member: any) => {
            const user = userMap.get(member.userId.toString())
            return {
                ...member,
                userName: user?.name || "",
                userEmail: user?.email || "",
                userPhone: user?.cel?.[0] || "",
            }
        })

        // Retornar o perfil com os membros enriquecidos
        return NextResponse.json({
            ...profile,
            members: membersWithDetails,
            isUserAdmin,
        })
    } catch (error) {
        console.error("Get profile details error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

