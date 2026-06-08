import { SummaryCard } from "@/components/ui/molecules/SummaryCard"
import { FinancialInsight } from "@/components/ui/molecules/FinancialInsight"
import { motion } from "framer-motion"
import { ArrowDownIcon, ArrowUpIcon, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/atoms/button"
import { AddIncomeDialog } from "@/components/ui/organisms/AddIncomeDialog"
import { AddExpenseDialog } from "@/components/ui/organisms/AddExpenseDialog"

interface DashboardSummaryProps {
    balance: number
    totalIncome: number
    totalExpense: number
    userRequestName?: string
    profileId?: string
    loading: boolean
    isAllTransactions: boolean
    refreshTrigger: any // Used to trigger Insight refresh (dataToUse)
    onAddIncome?: (desc: string, amount: number, tag: string, date: string, isRecurring: boolean, recurrenceCount: number) => void
    onAddExpense?: (desc: string, amount: number, tag: string, date: string, isRecurring: boolean, recurrenceCount: number) => void
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
    refreshTrigger,
    onAddIncome,
    onAddExpense
}: DashboardSummaryProps) {
    return (
        <div className="flex flex-col gap-6 mb-8">
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
                className="w-full flex flex-col gap-4"
            >
                {/* Desktop Top Action Buttons */}
                <div className="hidden md:flex justify-end gap-2">
                    {onAddIncome && (
                        <AddIncomeDialog
                            onAddIncome={onAddIncome}
                            trigger={
                                <Button className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md px-5 py-2.5 rounded-xl border-none text-sm transition-all duration-300 hover:scale-105">
                                    + Receita
                                </Button>
                            }
                        />
                    )}
                    {onAddExpense && (
                        <AddExpenseDialog
                            onAddExpense={onAddExpense}
                            trigger={
                                <Button className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md px-5 py-2.5 rounded-xl border-none text-sm transition-all duration-300 hover:scale-105">
                                    + Despesa
                                </Button>
                            }
                        />
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                </div>
            </motion.div>
        </div>
    )
}
