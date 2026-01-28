import { useState } from "react"
import { ITransaction } from "@/interfaces/ITransaction"

interface UseTransactionActionsProps {
    setTransactions: React.Dispatch<React.SetStateAction<ITransaction[]>>
    setAllTransactions?: React.Dispatch<React.SetStateAction<ITransaction[]>>
    editTransaction: (updatedTransaction: Partial<ITransaction>) => Promise<void>
    deleteTransaction: (transactionId: string) => Promise<void>
    getChartData?: () => Promise<void>
    getSummary?: () => Promise<void>
}

export function useTransactionActions({
    setTransactions,
    setAllTransactions,
    editTransaction,
    deleteTransaction,
    getChartData,
    getSummary
}: UseTransactionActionsProps) {
    const [editingTransaction, setEditingTransaction] = useState<ITransaction | null>(null)

    const handleSaveEdit = async (
        description: string,
        amount: number,
        tag: string,
        date: string,
        isRecurring: boolean,
        recurrenceCount: number
    ) => {
        if (!editingTransaction) return

        const updatedTransaction: Partial<ITransaction> = {
            _id: editingTransaction._id,
            type: editingTransaction.type,
            description,
            amount,
            tag,
            date,
            isRecurring,
            recurrenceCount,
            profileId: editingTransaction.profileId
        }

        await editTransaction(updatedTransaction)

        // Optimistic Update
        if (setTransactions) {
            setTransactions(prev => prev.map(t => t._id.toString() === editingTransaction._id.toString() ? { ...t, ...updatedTransaction } : t));
        }
        if (setAllTransactions) {
            setAllTransactions(prev => prev.map(t => t._id.toString() === editingTransaction._id.toString() ? { ...t, ...updatedTransaction } : t));
        }

        setEditingTransaction(null)

        // Background Sync
        Promise.all([
            getChartData && getChartData(),
            getSummary && getSummary(),
        ]).catch(err => console.error("Background sync failed", err));
    }

    const handleDeleteTransaction = async (transactionId: string) => {
        await deleteTransaction(transactionId)

        // Optimistic Update
        if (setTransactions) {
            setTransactions(prev => prev.filter(t => t._id.toString() !== transactionId))
        }
        if (setAllTransactions) {
            setAllTransactions(prev => prev.filter(t => t._id.toString() !== transactionId))
        }

        // Background Sync
        Promise.all([
            getChartData && getChartData(),
            getSummary && getSummary()
        ]).catch(err => console.error("Background sync failed", err));
    }

    return {
        editingTransaction,
        setEditingTransaction,
        handleSaveEdit,
        handleDeleteTransaction
    }
}
