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

