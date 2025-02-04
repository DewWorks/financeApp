import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/atoms/table"
import { Button } from "@/components/ui/atoms/button"
import { AlertTriangle, Edit, Edit2, Trash2, Repeat, ArrowUpCircle, ArrowDownCircle, Tag, RepeatIcon, Calendar } from 'lucide-react'
import { ITransaction } from "@/interfaces/ITransaction"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/atoms/dialog"
import { AddExpenseDialog } from "../organisms/AddExpenseDialog"
import { AddIncomeDialog } from "../organisms/AddIncomeDialog"
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Pagination } from 'swiper/modules';
import {Card, CardContent } from "../atoms/card"

interface TransactionsTableProps {
    transactions: ITransaction[]
    onEditTransaction?: (transaction: ITransaction) => void
    onDeleteTransaction?: (transactionId: string) => void
}

function getRandomColor() {
    return `#${Math.floor(Math.random()*16777215).toString(16)}`;
}

export function TransactionsTable({ transactions, onEditTransaction, onDeleteTransaction }: TransactionsTableProps) {
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

    return (
        <>
            {/* Desktop view */}
            <div className="hidden md:block dark:bg-gray-800 ">
                {/* Se houver transações, exibir a quantidade total */}
                {transactions.length > 0 && (
                    <p className="text-center text-md text-gray-500 font-semibold dark:text-white mt-2">
                        Total de transações: {transactions.length}
                    </p>
                )}

                {/* Se não houver transações, exibir a mensagem de aviso */}
                {transactions.length === 0 && (
                    <p className="text-center text-md text-red-500 font-semibold mt-2">
                        Não há transações!
                    </p>
                )}
                <Table>
                    <TableHeader>
                        <TableRow className="text-black dark:text-white">
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
                                <TableRow key={transaction._id?.toString()} className={ transaction.type === 'income' ? 'bg-green-50' : 'bg-red-50'}>
                                    <TableCell className="text-black dark:text-white dark:bg-gray-800">{new Date(transaction.date).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-black dark:text-white dark:bg-gray-800">{transaction.description}</TableCell>
                                    <TableCell className={transaction.type === 'income' ? 'text-green-600 dark:bg-gray-800' : 'text-red-600 dark:bg-gray-800'}>
                                        R$ {transaction.amount !== undefined && transaction.amount !== null ? transaction.amount.toFixed(2) : 'N/A'}
                                        {transaction.isRecurring && transaction.recurrenceCount && (
                                            <span className={`ml-1 text-xs text-gray-500 dark:text-gray-400 flex items-center ${transaction.type === 'income' ? 'text-green-600 dark:bg-gray-800' : 'text-red-600 dark:bg-gray-800'}`}>
            <Repeat className="h-3 w-3 mr-1" />
                                                {transaction.recurrenceCount}x
        </span>
                                        )}
                                    </TableCell>
                                    <TableCell className={transaction.type === 'income' ? 'text-green-600 font-bold dark:bg-gray-800' : 'text-red-600 font-bold dark:bg-gray-800'}>{transaction.type === "income" ? (
                                        <ArrowUpCircle className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <ArrowDownCircle className="w-4 h-4 text-red-500" />
                                    )}</TableCell>
                                    <TableCell className="dark:bg-gray-800">
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
                                    <TableCell className="dark:bg-gray-800">
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
            </div>

            {/* Mobile view */}
            <div className="md:hidden space-y-4 dark:bg-gray-800">
                <Swiper
                    spaceBetween={10}
                    slidesPerView={1}
                    pagination={{ clickable: true }}
                    modules={[Pagination]}
                    className="pb-6"
                >
                    {transactions.map((transaction) => {
                        const tagColor = getRandomColor();
                        return (
                            <SwiperSlide key={transaction._id?.toString()}>
                                <Card className={`p-2 rounded-lg shadow dark:bg-gray-800 
            ${transaction.type === 'income' ? 'bg-green-50 border border-green-500' : 'bg-red-50 border border-red-500'}`}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center space-x-2">
                                                {transaction.type === "income" ? (
                                                    <ArrowUpCircle className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <ArrowDownCircle className="w-4 h-4 text-red-500" />
                                                )}
                                                <span className={`font-semibold text-sm ${transaction.type === "income" ? "text-green-500" : "text-red-500"}`}>
              {transaction.type === "income" ? "Receita" : "Despesa"}
            </span>
                                            </div>
                                            <div className="flex space-x-2">
                                                <Button variant="outline" size="sm" onClick={() => handleEditClick(transaction)}>
                                                    <Edit className="text-blue-600 h-4 w-4" />
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => handleDeleteClick(transaction)}>
                                                    <Trash2 className="text-red-500 h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>{new Date(transaction.date).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-2 dark:text-white">{transaction.description}</h3>
                                        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                                            <Tag className="w-4 h-4" />
                                            <span
                                                className="px-2 py-1 rounded-full text-xs font-semibold"
                                                style={{
                                                    backgroundColor: `${tagColor}20`,
                                                    color: tagColor,
                                                    border: `1px solid ${tagColor}`
                                                }}
                                            >{transaction.tag}</span>
                                        </div>

                                        {transaction.isRecurring && (
                                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                <RepeatIcon className="w-4 h-4" />
                                                <span>Recorrente {transaction.recurrenceCount && `(${transaction.recurrenceCount}x)`}</span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </SwiperSlide>
                        );
                    })}
                </Swiper>

                {/* Se houver transações, exibir a quantidade total */}
                {transactions.length > 0 && (
                    <p className="text-center text-md text-gray-500 font-semibold dark:text-white mt-2">
                        Total de transações: {transactions.length}
                    </p>
                )}

                {/* Se não houver transações, exibir a mensagem de aviso */}
                {transactions.length === 0 && (
                    <p className="text-center text-md text-red-500 font-semibold mt-2">
                        Não há transações!
                    </p>
                )}
            </div>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-900 dark:text-white">
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
                <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-900 dark:text-white">
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