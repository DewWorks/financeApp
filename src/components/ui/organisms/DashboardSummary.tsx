import { SummaryCard } from "@/components/ui/molecules/SummaryCard"
import { FinancialInsight } from "@/components/ui/molecules/FinancialInsight"
import { motion } from "framer-motion"
import { ArrowDownIcon, ArrowUpIcon, DollarSign } from "lucide-react"

interface DashboardSummaryProps {
    balance: number
    totalIncome: number
    totalExpense: number
    userRequestName?: string
    profileId?: string
    loading: boolean
    isAllTransactions: boolean
    refreshTrigger: any // Used to trigger Insight refresh (dataToUse)
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 300, damping: 24 }
    }
}

export function DashboardSummary({
    balance,
    totalIncome,
    totalExpense,
    userRequestName,
    profileId,
    loading,
    isAllTransactions,
    refreshTrigger
}: DashboardSummaryProps) {
    return (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            {/* Insight Widget */}
            <div className="w-full">
                <FinancialInsight
                    userRequestName={userRequestName}
                    profileId={profileId}
                    loading={loading}
                    compact={false}
                    refreshTrigger={refreshTrigger}
                    scope={isAllTransactions ? 'all' : 'recent'}
                />
            </div>

            {/* Summary Values Section */}
            <motion.div
                id="transactions-values"
                variants={itemVariants}
                className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
                <SummaryCard
                    title="Saldo Atual"
                    value={balance}
                    icon={DollarSign}
                    description={balance >= 0 ? "Saldo Positivo" : "Saldo Negativo"}
                    variant={balance >= 0 ? "success" : "danger"}
                />
                <SummaryCard
                    title="Receitas"
                    value={totalIncome}
                    icon={ArrowUpIcon}
                    variant="success"
                    description={`+${totalIncome + totalExpense > 0 ? ((totalIncome / (totalIncome + totalExpense)) * 100).toFixed(1) : 0}% do total`}
                />
                <SummaryCard
                    title="Despesas"
                    value={totalExpense}
                    icon={ArrowDownIcon}
                    variant="danger"
                    description={`-${totalIncome + totalExpense > 0 ? ((totalExpense / (totalIncome + totalExpense)) * 100).toFixed(1) : 0}% do total`}
                />
            </motion.div>
        </div>
    )
}
