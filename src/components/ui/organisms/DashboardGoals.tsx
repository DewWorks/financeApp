import { FinancialGoals } from "@/components/ui/organisms/FinancialGoals"
import { motion } from "framer-motion"
import { ITransaction } from "@/interfaces/ITransaction"

interface DashboardGoalsProps {
    transactions: ITransaction[]
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 300, damping: 24 }
    }
}

export function DashboardGoals({ transactions }: DashboardGoalsProps) {
    // Note: 'transactions' prop here should be the 'dataToUse' (Chart Data or All Data)
    // to ensure monthly goals are correct.
    return (
        <motion.div
            id="transactions-goals"
            variants={itemVariants}
            className="mb-6 sm:mb-8"
        >
            <FinancialGoals transactions={transactions} />
        </motion.div>
    )
}
