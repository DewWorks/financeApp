import type { ObjectId } from "mongodb"

export interface IDisbursement {
    date: string | Date
    amount: number
    note?: string
    status: "pending" | "completed"
}

export interface IFinancePlan {
    _id?: ObjectId
    userId: ObjectId

    // Definição do plano pelo usuário
    name: string // ex: "Viagem Europa"
    description?: string // descrição detalhada
    category: "travel" | "house" | "car" | "education" | "emergency" | "investment" | "other"
    targetAmount: number // quanto precisa no total
    currentAmount: number // quanto já tem
    desiredDate: string | Date // até quando quer ter o valor
    priority: "low" | "medium" | "high"

    // Como pretende usar o dinheiro
    spendIntent: "one_time" | "staggered"
    disbursements?: IDisbursement[] // quando/quanto pretende gastar (se parcelado)

    // Resultados calculados pelo sistema
    estimatedMonths: number
    monthlySavingTarget: number
    weeklySavingTarget: number
    dailySavingTarget: number
    difficulty: "easy" | "medium" | "hard" | "impossible"
    suggestions: string[]
    progressPercentage: number

    // Status e controle
    status: "active" | "completed" | "paused" | "cancelled"
    createdAt: string | Date
    updatedAt: string | Date
    completedAt?: string | Date
}

export interface IFinancePlanCalculation {
    monthsRemaining: number
    monthlySavingNeeded: number
    weeklySavingNeeded: number
    dailySavingNeeded: number
    difficulty: "easy" | "medium" | "hard" | "impossible"
    suggestions: string[]
    isAchievable: boolean
}
