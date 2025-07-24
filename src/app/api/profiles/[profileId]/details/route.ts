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

        return NextResponse.json({
            ...profile,
            isUserAdmin,
        })
    } catch (error) {
        console.error("Get profile details error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
