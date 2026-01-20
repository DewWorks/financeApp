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

/**
 * @swagger
 * /api/profiles/{profileId}/stats:
 *   get:
 *     tags:
 *       - Profiles
 *     summary: Get profile statistics
 *     description: Retrieves financial statistics for the profile including monthly/total stats and top categories.
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: Profile ID
 *     responses:
 *       200:
 *         description: Profile statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 monthly:
 *                   type: object
 *                   properties:
 *                     income: { type: number }
 *                     expense: { type: number }
 *                     balance: { type: number }
 *                     transactionCount: { type: number }
 *                 total:
 *                   type: object
 *                 recentTransactions:
 *                   type: array
 *                 topCategories:
 *                   type: array
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Internal server error
 */
export async function GET(request: Request, { params }: { params: Promise<{ profileId: string }> }) {
    try {
        const userId = await getUserIdFromToken()
        const resolvedParams = await params;
        const profileId = new ObjectId(resolvedParams.profileId)

        const client = await getMongoClient()
        const db = client.db("financeApp")

        // Verificar se o usuário tem acesso ao profile
        const profile = await db.collection("profiles").findOne({
            _id: profileId,
            "members.userId": userId,
            isActive: true,
        })

        if (!profile) {
            return NextResponse.json({ error: "Profile not found or access denied" }, { status: 404 })
        }

        // Buscar estatísticas de transações
        const currentMonth = new Date()
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59, 999)

        const [monthlyStats, totalStats, recentTransactions, topCategories] = await Promise.all([
            // Estatísticas do mês atual
            db
                .collection("transactions")
                .aggregate([
                    {
                        $match: {
                            profileId: profileId,
                            date: { $gte: startOfMonth, $lte: endOfMonth },
                        },
                    },
                    {
                        $group: {
                            _id: "$type",
                            total: { $sum: "$amount" },
                            count: { $sum: 1 },
                        },
                    },
                ])
                .toArray(),

            // Estatísticas totais
            db
                .collection("transactions")
                .aggregate([
                    {
                        $match: { profileId: profileId },
                    },
                    {
                        $group: {
                            _id: "$type",
                            total: { $sum: "$amount" },
                            count: { $sum: 1 },
                        },
                    },
                ])
                .toArray(),

            // Transações recentes
            db
                .collection("transactions")
                .find({ profileId: profileId }, { sort: { date: -1 }, limit: 5 })
                .toArray(),

            // Top categorias
            db
                .collection("transactions")
                .aggregate([
                    {
                        $match: {
                            profileId: profileId,
                            type: "expense",
                        },
                    },
                    {
                        $group: {
                            _id: "$tag",
                            total: { $sum: "$amount" },
                            count: { $sum: 1 },
                        },
                    },
                    {
                        $sort: { total: -1 },
                    },
                    {
                        $limit: 5,
                    },
                ])
                .toArray(),
        ])

        // Processar dados
        const monthlyIncome = monthlyStats.find((s) => s._id === "income")?.total || 0
        const monthlyExpense = monthlyStats.find((s) => s._id === "expense")?.total || 0
        const totalIncome = totalStats.find((s) => s._id === "income")?.total || 0
        const totalExpense = totalStats.find((s) => s._id === "expense")?.total || 0

        return NextResponse.json({
            monthly: {
                income: monthlyIncome,
                expense: monthlyExpense,
                balance: monthlyIncome - monthlyExpense,
                transactionCount: monthlyStats.reduce((acc, s) => acc + s.count, 0),
            },
            total: {
                income: totalIncome,
                expense: totalExpense,
                balance: totalIncome - totalExpense,
                transactionCount: totalStats.reduce((acc, s) => acc + s.count, 0),
            },
            recentTransactions,
            topCategories,
        })
    } catch (error) {
        console.error("Get profile stats error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
