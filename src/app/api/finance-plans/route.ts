import { type NextRequest, NextResponse } from "next/server"
import { getMongoClient } from "@/db/connectionDb"
import { FinancePlanCalculator } from "@/app/functions/finance-plans/calculator"
import { ObjectId } from "mongodb"
import { cookies } from "next/headers";
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

class AuthError extends Error {
    constructor(message: string, public status: number) {
        super(message);
        this.name = 'AuthError';
    }
}

async function getUserIdFromToken() {
    const token = (await cookies()).get('auth_token')?.value
    if (!token) {
        throw new AuthError('No token provided', 401)
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
        return new ObjectId(decoded.userId)
    } catch (error) {
        console.error('Invalid token:', error)
        throw new AuthError('Invalid token', 401)
    }
}

// GET - Listar planos do usuário
export async function GET(request: NextRequest) {
    try {
        const userId = await getUserIdFromToken()
        const { searchParams } = new URL(request.url)
        const status = searchParams.get("status")

        const client = await getMongoClient()
        const db = client.db("financeApp")

        const filter: any = { userId: new ObjectId(userId) }
        if (status) {
            filter.status = status
        }

        const plans = await db.collection("financePlans").find(filter).sort({ createdAt: -1 }).toArray()

        return NextResponse.json({ plans })
    } catch (error) {
        console.error("Get finance plans error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST - Criar novo plano
export async function POST(request: NextRequest) {
    try {
        const userId = await getUserIdFromToken()
        const body = await request.json()

        const {
            name,
            description,
            category,
            targetAmount,
            currentAmount = 0,
            desiredDate,
            priority = "medium",
            spendIntent = "one_time",
            disbursements = [],
        } = body

        // Validações
        if (!name || !category || !targetAmount || !desiredDate) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        if (targetAmount <= 0) {
            return NextResponse.json({ error: "Target amount must be positive" }, { status: 400 })
        }

        if (new Date(desiredDate) <= new Date()) {
            return NextResponse.json({ error: "Desired date must be in the future" }, { status: 400 })
        }

        // Calcular plano
        const calculation = FinancePlanCalculator.calculatePlan(targetAmount, currentAmount, new Date(desiredDate))

        const client = await getMongoClient()
        const db = client.db("financeApp")

        const newPlan = {
            userId: new ObjectId(userId),
            name: name.trim(),
            description: description?.trim(),
            category,
            targetAmount,
            currentAmount,
            desiredDate: new Date(desiredDate),
            priority,
            spendIntent,
            disbursements,
            estimatedMonths: calculation.monthsRemaining,
            monthlySavingTarget: calculation.monthlySavingNeeded,
            weeklySavingTarget: calculation.weeklySavingNeeded,
            dailySavingTarget: calculation.dailySavingNeeded,
            difficulty: calculation.difficulty,
            suggestions: calculation.suggestions,
            progressPercentage: Math.min((currentAmount / targetAmount) * 100, 100),
            status: "active",
            createdAt: new Date(),
            updatedAt: new Date(),
        }

        const result = await db.collection("financePlans").insertOne(newPlan)

        return NextResponse.json({
            message: "Finance plan created successfully",
            planId: result.insertedId,
            calculation,
        })
    } catch (error) {
        console.error("Create finance plan error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
