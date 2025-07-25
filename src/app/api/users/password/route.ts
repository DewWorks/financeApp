import { NextResponse } from "next/server"
import { getMongoClient } from "@/db/connectionDb"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
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

export async function PUT(request: Request) {
    try {
        const userId = await getUserIdFromToken()

        const { currentPassword, newPassword } = await request.json()

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: "Current password and new password are required" }, { status: 400 })
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: "New password must be at least 6 characters long" }, { status: 400 })
        }

        const client = await getMongoClient()
        const db = client.db("financeApp")

        // Buscar usuário com senha
        const user = await db.collection("users").findOne({ _id: userId })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Verificar senha atual
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)

        if (!isCurrentPasswordValid) {
            return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
        }

        // Hash da nova senha
        const hashedNewPassword = await bcrypt.hash(newPassword, 10)

        // Atualizar senha
        await db.collection("users").updateOne(
            { _id: userId },
            {
                $set: {
                    password: hashedNewPassword,
                    passwordGenerated: false, // Marcar que não é mais senha gerada
                    updatedAt: new Date(),
                },
            },
        )

        return NextResponse.json({ message: "Password updated successfully" })
    } catch (error) {
        console.error("Update password error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
