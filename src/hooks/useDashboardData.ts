import { ITransaction } from "@/interfaces/ITransaction"

export function useDashboardData(
    chartData: ITransaction[],
    transactions: ITransaction[]
) {
    // Prioritize allTransactions (chartData represents 'all monthly' usually) for goals/analytics
    // If chartData is empty (no data), use transactions (page 1) as fallback.
    const dataToUse = chartData.length > 0 ? chartData : transactions;

    const uniqueTags = Array.from(new Set(transactions.map(t => t.tag))).sort()

    return {
        dataToUse,
        uniqueTags
    }
}
