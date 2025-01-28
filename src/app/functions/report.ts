import type { ITransaction, ReportFrequency } from "@/interfaces/ITransaction"

export const calculateTotals = (transactions: ITransaction[] | undefined) => {
    if (!transactions || transactions.length === 0) {
        return { totalIncome: 0, totalExpenses: 0 }
    }

    return transactions.reduce(
        (acc, t) => {
            if (t.type === "income") {
                acc.totalIncome += t.amount
            } else {
                acc.totalExpenses += t.amount
            }
            return acc
        },
        { totalIncome: 0, totalExpenses: 0 },
    )
}

export const getCategoryTotals = (transactions: ITransaction[] | undefined) => {
    if (!transactions || transactions.length === 0) {
        return {}
    }

    return transactions.reduce(
        (acc, t) => {
            if (!acc[t.tag]) {
                acc[t.tag] = 0
            }
            acc[t.tag] += t.amount
            return acc
        },
        {} as Record<string, number>,
    )
}

export const filterTransactionsByFrequency = (
    transactions: ITransaction[],
    frequency: ReportFrequency,
): ITransaction[] => {
    const now = new Date()
    const startDate = new Date()

    switch (frequency) {
        case "weekly":
            startDate.setDate(now.getDate() - 7)
            break
        case "biweekly":
            startDate.setDate(now.getDate() - 14)
            break
        case "monthly":
            startDate.setMonth(now.getMonth() - 1)
            break
    }

    return transactions.filter((t) => new Date(t.date) >= startDate)
}
