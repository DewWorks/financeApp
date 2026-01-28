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
    forceDesktopMode?: boolean
    viewMode?: string
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
    onPreviousPage,
    forceDesktopMode,
    viewMode = 'list'
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
        if (onEditTransaction) {
            onEditTransaction(transaction);
        }
    }

    const handleConfirmDelete = () => {
        if (transactionToDelete && transactionToDelete._id && onDeleteTransaction) {
            onDeleteTransaction(transactionToDelete._id.toString())
            setDeleteDialogOpen(false)
            setTransactionToDelete(null)
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
            {/* Desktop view (or forced) */}
            <div className={forceDesktopMode ? "block" : "hidden md:block"}>
                <PaginationControls />
                {transactions.length > 0 && (
                    <p className="text-center text-md text-muted-foreground font-semibold mt-2">
                        Total de transações: {transactions.length}
                    </p>
                )}
                <div className="w-full overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-muted/50">
                                <TableHead className="px-2 py-1 text-xs sm:text-sm">Data</TableHead>
                                <TableHead className="px-2 py-1 text-xs sm:text-sm">Descrição</TableHead>
                                <TableHead className="px-2 py-1 text-xs sm:text-sm">Valor</TableHead>
                                <TableHead className="hidden sm:table-cell px-2 py-1 text-xs sm:text-sm">Tipo</TableHead>
                                <TableHead className="hidden sm:table-cell px-2 py-1 text-xs sm:text-sm">Tag</TableHead>
                                <TableHead className="px-2 py-1 text-xs sm:text-sm">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map((transaction) => {
                                const tagColor = getRandomColor();
                                return (
                                    <TableRow key={transaction._id?.toString()} className={transaction.type === 'income' ? 'bg-green-50/50 dark:bg-green-900/10 hover:bg-green-100/50 dark:hover:bg-green-900/20' : 'bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100/50 dark:hover:bg-red-900/20'}>
                                        <TableCell className="px-2 py-1 text-xs sm:text-sm font-medium whitespace-nowrap">{new Date(transaction.date).toLocaleDateString()}</TableCell>
                                        <TableCell className="px-2 py-1">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-100 line-clamp-1 max-w-[100px] sm:max-w-none">
                                                    {transaction.merchantName || transaction.description}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className={`px-2 py-1 text-xs sm:text-sm ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            <div className="flex flex-col">
                                                <span className="font-semibold whitespace-nowrap">
                                                    R$ {transaction.amount !== undefined && transaction.amount !== null ? transaction.amount.toFixed(2) : 'N/A'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell px-2 py-1 text-center">
                                            {transaction.type === "income" ? (
                                                <ArrowUpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mx-auto" />
                                            ) : (
                                                <ArrowDownCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mx-auto" />
                                            )}</TableCell>
                                        <TableCell className="hidden sm:table-cell px-2 py-1">
                                            <span
                                                className="px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap"
                                                style={{
                                                    backgroundColor: `${tagColor}20`,
                                                    color: tagColor,
                                                    border: `1px solid ${tagColor}`
                                                }}
                                            >
                                                {transaction.tag}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-2 py-1">
                                            <div className="flex space-x-1 sm:space-x-2">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-8 sm:w-8" onClick={() => handleEditClick(transaction)}>
                                                    <Edit className="text-blue-600 h-3 w-3 sm:h-4 sm:w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-8 sm:w-8" onClick={() => handleDeleteClick(transaction)}>
                                                    <Trash2 className="text-red-500 h-3 w-3 sm:h-4 sm:w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table >
                </div>

                {/* Pagination Controls */}
                < PaginationControls />
            </div >

            {/* Mobile view */}
            <div className={forceDesktopMode ? "hidden" : "md:hidden space-y-4"}>
                {/* Pagination Top Mobile REMOVED to avoid duplication */}

                <TransactionListMobile
                    transactions={transactions}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                    viewMode={forceDesktopMode ? 'table' : (viewMode as 'list' | 'card' | 'table')} // Pass viewMode
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
        </>
    )
}