import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/atoms/table"
import { Button } from "@/components/ui/atoms/button"
import { AlertTriangle, Edit, Edit2, Trash2, Repeat, ArrowUpCircle, ArrowDownCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { ITransaction } from "@/interfaces/ITransaction"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/atoms/dialog"
import { AddExpenseDialog } from "../organisms/AddExpenseDialog"
import { AddIncomeDialog } from "../organisms/AddIncomeDialog"
import { TransactionListMobile } from "../organisms/TransactionListMobile"
import { EmptyStateAction } from "../molecules/EmptyStateAction"

interface TransactionsTableProps {
    transactions: ITransaction[]
    onEditTransaction?: (transaction: ITransaction) => void
    onDeleteTransaction?: (transactionId: string) => void
    currentPage: number
    totalPages: number
    onNextPage: () => void
    onPreviousPage: () => void
}

function getRandomColor() {
    return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
}

export function TransactionsTable({
    transactions,
    onEditTransaction,
    onDeleteTransaction,
    currentPage,
    totalPages,
    onNextPage,
    onPreviousPage
}: TransactionsTableProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [transactionToDelete, setTransactionToDelete] = useState<ITransaction | null>(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [transactionToEdit, setTransactionToEdit] = useState<ITransaction | null>(null)

    const handleDeleteClick = (transaction: ITransaction) => {
        setTransactionToDelete(transaction)
        setDeleteDialogOpen(true)
    }

    const handleEditClick = (transaction: ITransaction) => {
        setTransactionToEdit(transaction)
        setEditDialogOpen(true)
    }

    const handleConfirmDelete = () => {
        if (transactionToDelete && transactionToDelete._id && onDeleteTransaction) {
            onDeleteTransaction(transactionToDelete._id.toString())
            setDeleteDialogOpen(false)
            setTransactionToDelete(null)
        }
    }

    const handleEditTransaction = async (description: string, amount: number, tag: string, date: string, isRecurring?: boolean, recurrenceCount?: number) => {
        if (transactionToEdit && transactionToEdit._id && onEditTransaction) {
            const updatedTransaction = { ...transactionToEdit, description, amount, tag, date, isRecurring, recurrenceCount }
            try {
                onEditTransaction(updatedTransaction)
                setEditDialogOpen(false)
                setTransactionToEdit(null)
            } catch (error) {
                console.error('Failed to edit transaction:', error)
            }
        }
    }

    if (transactions.length === 0) {
        return <EmptyStateAction />
    }

    const PaginationControls = () => (
        <div className="flex justify-center items-center py-2 space-x-2">
            <Button
                onClick={onPreviousPage}
                size="sm"
                disabled={currentPage <= 1}
                className="p-1 sm:p-2 rounded-lg border dark:border-gray-600 bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold dark:text-gray-200 px-2 min-w-[60px] text-center">
                Pág {currentPage} de {totalPages}
            </span>
            <Button
                onClick={onNextPage}
                size="sm"
                disabled={currentPage >= totalPages}
                className="p-1 sm:p-2 rounded-lg border dark:border-gray-600 bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );

    return (
        <>
            {/* Desktop view */}
            <div className="hidden md:block">
                <PaginationControls />
                {transactions.length > 0 && (
                    <p className="text-center text-md text-muted-foreground font-semibold mt-2">
                        Total de transações: {transactions.length}
                    </p>
                )}
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-muted/50">
                            <TableHead>Data</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Tag</TableHead>
                            <TableHead>Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map((transaction) => {
                            const tagColor = getRandomColor();
                            return (
                                <TableRow key={transaction._id?.toString()} className={transaction.type === 'income' ? 'bg-green-50/50 dark:bg-green-900/10 hover:bg-green-100/50 dark:hover:bg-green-900/20' : 'bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100/50 dark:hover:bg-red-900/20'}>
                                    <TableCell className="font-medium">{new Date(transaction.date).toLocaleDateString()}</TableCell>
                                    <TableCell>{transaction.description}</TableCell>
                                    <TableCell className={transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                        R$ {transaction.amount !== undefined && transaction.amount !== null ? transaction.amount.toFixed(2) : 'N/A'}
                                        {transaction.isRecurring && transaction.recurrenceCount && (
                                            <span className={`ml-1 text-xs flex items-center ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                <Repeat className="h-3 w-3 mr-1" />
                                                {transaction.recurrenceCount}x
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className={transaction.type === 'income' ? 'text-green-600 font-bold dark:text-green-400' : 'text-red-600 font-bold dark:text-red-400'}>{transaction.type === "income" ? (
                                        <ArrowUpCircle className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <ArrowDownCircle className="w-4 h-4 text-red-500" />
                                    )}</TableCell>
                                    <TableCell>
                                        <span
                                            className="px-2 py-1 rounded-full text-xs font-semibold"
                                            style={{
                                                backgroundColor: `${tagColor}20`,
                                                color: tagColor,
                                                border: `1px solid ${tagColor}`
                                            }}
                                        >
                                            {transaction.tag}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex space-x-2">
                                            <Button variant="outline" size="sm" onClick={() => handleEditClick(transaction)}>
                                                <Edit className="text-blue-600 h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => handleDeleteClick(transaction)}>
                                                <Trash2 className="text-red-500 h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>

                {/* Pagination Controls */}
                <PaginationControls />
            </div>

            {/* Mobile view */}
            <div className="md:hidden space-y-4">
                {/* Pagination Top Mobile */}
                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm">
                    <PaginationControls />
                </div>

                <TransactionListMobile
                    transactions={transactions}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                />
                {/* Pagination Bottom Mobile */}
                <div className="pb-4">
                    <PaginationControls />
                </div>
            </div>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Confirmar exclusão
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="mb-4 text-muted-foreground">Tem certeza que deseja excluir esta transação?</p>
                        {transactionToDelete && (
                            <div className="space-y-2 rounded-md bg-muted p-4 text-sm">
                                <p><strong>Descrição:</strong> {transactionToDelete.description}</p>
                                <p><strong>Valor:</strong> R$ {transactionToDelete.amount.toFixed(2)}</p>
                                <p><strong>Data:</strong> {new Date(transactionToDelete.date).toLocaleDateString()}</p>
                                <p><strong>Tipo:</strong> {transactionToDelete.type === 'income' ? 'Receita' : 'Despesa'}</p>
                                <p><strong>Tag:</strong> {transactionToDelete.tag}</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="sm:justify-start">
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button className={`bg-red-600 text-white`} variant="destructive" onClick={handleConfirmDelete}>
                            Excluir
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-primary">
                            <Edit2 className="h-5 w-5" />
                            Editar Transação
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        {transactionToEdit && (
                            transactionToEdit.type === 'income' ? (
                                <AddIncomeDialog
                                    onAddIncome={handleEditTransaction}
                                    initialData={transactionToEdit}
                                />
                            ) : (
                                <AddExpenseDialog
                                    onAddExpense={handleEditTransaction}
                                    initialData={transactionToEdit}
                                />
                            )
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}