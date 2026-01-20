import { getMongoClient } from "@/db/connectionDb"
import { NextResponse } from "next/server"

/**
 * @swagger
 * /api/admin/users/all:
 *   get:
 *     tags:
 *       - Admin
 *     summary: List all users
 *     description: Retrieves all users in the system (Admin only).
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET() {
    try {

        const client = await getMongoClient()
        const db = client.db("financeApp")

        // Fetch all users but exclude sensitive information like passwords
        const users = await db.collection("users").find({}).project({ password: 0 }).toArray()

        return NextResponse.json(users)
    } catch (error) {
        console.error("Get users error:", error)

        if (error instanceof Error && error.name === "AuthError") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (error instanceof Error && error.name === "MongoNetworkError") {
            return NextResponse.json({ error: "Database connection error" }, { status: 503 })
        }

        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
