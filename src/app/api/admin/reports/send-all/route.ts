import { getMongoClient } from "@/db/connectionDb"
import { NextResponse } from "next/server"
import type { IUser } from "@/interfaces/IUser"
import type { ITransaction } from "@/interfaces/ITransaction"
import nodemailer from "nodemailer"
import type { ObjectId } from "mongodb"

// Function to get all users from the database
async function getAllUsers() {
    const client = await getMongoClient()
    const db = client.db("financeApp")

    const users = await db.collection("users").find({}).toArray()
    return users as IUser[]
}

// Function to get transactions for a specific user
async function getUserTransactions(userId: ObjectId) {
    const client = await getMongoClient()
    const db = client.db("financeApp")

    const transactions = await db.collection("transactions").find({ userId }).sort({ date: -1 }).toArray()

    return transactions as ITransaction[]
}

// Function to analyze transactions and get insights
function analyzeTransactions(transactions: ITransaction[]) {
    // Filter transactions from the current month
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const monthlyTransactions = transactions.filter((t) => {
        const transactionDate = new Date(t.date)
        return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear
    })

    // Separate incomes and expenses
    const incomes = monthlyTransactions.filter((t) => t.type === "income")
    const expenses = monthlyTransactions.filter((t) => t.type === "expense")

    // Calculate totals
    const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0)
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0)
    const balance = totalIncome - totalExpense

    // Get top 3 incomes
    const topIncomes = [...incomes].sort((a, b) => b.amount - a.amount).slice(0, 3)

    // Get top 3 expenses
    const topExpenses = [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 3)

    // Group expenses by tag
    const expensesByTag: Record<string, number> = {}
    expenses.forEach((expense) => {
        if (!expensesByTag[expense.tag]) {
            expensesByTag[expense.tag] = 0
        }
        expensesByTag[expense.tag] += expense.amount
    })

    // Sort tags by total amount
    const topExpenseTags = Object.entries(expensesByTag)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)

    return {
        totalIncome,
        totalExpense,
        balance,
        topIncomes,
        topExpenses,
        topExpenseTags,
        monthName: new Date().toLocaleString("pt-BR", { month: "long" }),
    }
}

// Function to generate markdown email content
function generateEmailContent(user: IUser, analysis: ReturnType<typeof analyzeTransactions>) {
    const { totalIncome, totalExpense, balance, topIncomes, topExpenses, topExpenseTags, monthName } = analysis

    // Format currency
    const formatCurrency = (value: number) => {
        return value.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        })
    }

    return `
# Relatório Financeiro - ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}

Olá ${user.name},

Aqui está seu relatório financeiro mensal do FinancePro. Veja abaixo um resumo das suas finanças deste mês:

## Resumo do Mês

- **Total de Receitas**: ${formatCurrency(totalIncome)}
- **Total de Despesas**: ${formatCurrency(totalExpense)}
- **Saldo**: ${formatCurrency(balance)}

## Principais Receitas

${topIncomes.map((income, index) => `${index + 1}. **${income.description}**: ${formatCurrency(income.amount)} (${income.tag})`).join("\n")}

## Principais Despesas

${topExpenses.map((expense, index) => `${index + 1}. **${expense.description}**: ${formatCurrency(expense.amount)} (${expense.tag})`).join("\n")}

## Categorias com Maiores Gastos

${topExpenseTags.map((tag, index) => `${index + 1}. **${tag[0]}**: ${formatCurrency(tag[1])}`).join("\n")}

## Dicas Personalizadas

${balance < 0
            ? "⚠️ Suas despesas superaram suas receitas este mês. Considere revisar seus gastos nas categorias de maior impacto."
            : "✅ Parabéns! Você manteve um saldo positivo este mês. Continue com o bom trabalho!"
        }

${topExpenseTags[0] && topExpenseTags[0][1] > totalIncome * 0.4
            ? `⚠️ A categoria **${topExpenseTags[0][0]}** representa mais de 40% dos seus gastos. Considere analisar se há oportunidades de redução.`
            : ""
        }

Acesse o [FinancePro](https://financepro.vercel.app) para mais detalhes e dicas personalizadas para melhorar sua saúde financeira.

Atenciosamente,
Equipe FinancePro
`
}

// Configure nodemailer transporter
function createTransporter() {
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    })
}

/**
 * @swagger
 * /api/admin/reports/send-all:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Send monthly reports
 *     description: Triggers sending monthly financial reports to all users via email.
 *     responses:
 *       200:
 *         description: Reports sent
 *       500:
 *         description: Internal server error
 */
export async function GET() {
    try {
        // Get all users
        const users = await getAllUsers()

        if (!users.length) {
            return NextResponse.json({ message: "No users found" }, { status: 404 })
        }

        const transporter = createTransporter()
        const results = []

        // Process each user
        for (const user of users) {
            try {
                // Skip users without email
                if (!user.email) {
                    results.push({ userId: user._id.toString(), status: "skipped", reason: "No email address" })
                    continue
                }

                // Get user transactions
                const transactions = await getUserTransactions(user._id)

                // Skip users with no transactions
                if (!transactions.length) {
                    results.push({ userId: user._id.toString(), status: "skipped", reason: "No transactions" })
                    continue
                }

                // Analyze transactions
                const analysis = analyzeTransactions(transactions)

                // Generate email content
                const emailContent = generateEmailContent(user, analysis)

                // Send email
                await transporter.sendMail({
                    from: `"FinancePro" <${process.env.EMAIL_USER}>`,
                    to: user.email,
                    subject: `Seu Relatório Financeiro Mensal - ${analysis.monthName.charAt(0).toUpperCase() + analysis.monthName.slice(1)}`,
                    text: emailContent,
                    // You could also add HTML version with markdown converted to HTML
                })

                results.push({ userId: user._id.toString(), status: "success", email: user.email })
            } catch (error) {
                console.error(`Error processing user ${user._id}:`, error)
                results.push({
                    userId: user._id.toString(),
                    status: "error",
                    reason: error instanceof Error ? error.message : "Unknown error",
                })
            }
        }

        return NextResponse.json({
            message: `Processed ${users.length} users`,
            results,
        })
    } catch (error) {
        console.error("Send reports error:", error)

        if (error instanceof Error && error.name === "MongoNetworkError") {
            return NextResponse.json({ error: "Database connection error" }, { status: 503 })
        }

        return NextResponse.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        )
    }
}
