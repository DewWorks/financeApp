import { ITransaction } from "@/interfaces/ITransaction"
import { ArrowDownCircle, ArrowUpCircle, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/atoms/button"

interface TransactionListItemProps {
    transaction: ITransaction
    onEdit: () => void
    onDelete: () => void
}

export function TransactionListItem({ transaction, onEdit, onDelete }: TransactionListItemProps) {
    const isIncome = transaction.type === 'income'

    return (
        <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
            {/* Left: Icon & Date */}
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isIncome ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                    {isIncome ? (
                        <ArrowUpCircle className={`w-5 h-5 ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                    ) : (
                        <ArrowDownCircle className={`w-5 h-5 ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                    )}
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                        {transaction.description}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(transaction.date).toLocaleDateString()}
                    </span>
                </div>
            </div>

            {/* Right: Value & Actions */}
            <div className="flex items-center gap-3">
                <div className="text-right">
                    <span className={`block text-sm font-bold ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        R$ {transaction.amount.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-gray-400 px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        {transaction.tag}
                    </span>
                </div>

                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={onEdit}>
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={onDelete}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
