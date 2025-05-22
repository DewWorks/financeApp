import { getMongoClient } from "@/db/connectionDb"
import { NextResponse } from "next/server"

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
