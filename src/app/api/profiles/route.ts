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

// GET - Listar profiles do usuário
/**
 * @swagger
 * /api/profiles:
 *   get:
 *     tags:
 *       - Profiles
 *     summary: List profiles
 *     description: Retrieves all active profiles where the user is a member.
 *     responses:
 *       200:
 *         description: List of profiles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profiles:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Profile'
 *       500:
 *         description: Internal server error
 */
export async function GET() {
    try {
        const userId = await getUserIdFromToken()
        const client = await getMongoClient()
        const db = client.db("financeApp")

        const profiles = await db
            .collection("profiles")
            .find({
                "members.userId": userId,
                isActive: true,
            })
            .toArray()

        return NextResponse.json({ profiles })
    } catch (error) {
        console.error("Get profiles error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST - Criar novo profile
/**
 * @swagger
 * /api/profiles:
 *   post:
 *     tags:
 *       - Profiles
 *     summary: Create profile
 *     description: Creates a new collaborative profile.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [personal, business, family, other]
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Profile created
 *       400:
 *         description: Missing fields
 *       500:
 *         description: Internal server error
 */
export async function POST(request: Request) {
    try {
        const userId = await getUserIdFromToken()
        const { name, type, description } = await request.json()

        if (!name || !type) {
            return NextResponse.json({ error: "Name and type are required" }, { status: 400 })
        }

        const client = await getMongoClient()
        const db = client.db("financeApp")

        const newProfile = {
            name,
            type,
            description: description || "",
            members: [
                {
                    userId,
                    permission: "ADMIN",
                    joinedAt: new Date(),
                    status: "ACTIVE",
                },
            ],
            settings: {
                allowMemberInvites: true,
                requireApprovalForExpenses: false,
                categories: ["Alimentação", "Transporte", "Lazer", "Saúde", "Outros"],
            },
            createdBy: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
        }

        const result = await db.collection("profiles").insertOne(newProfile)

        return NextResponse.json(
            {
                message: "Profile created successfully",
                profileId: result.insertedId,
            },
            { status: 201 }
        )
    } catch (error) {
        console.error("Create profile error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
