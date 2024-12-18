import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/atoms/table"
import { Button } from "@/components/ui/atoms/button"
import {AlertTriangle, Edit2, Pencil, Trash2} from "lucide-react"
import { ITransaction } from "@/interfaces/ITransaction"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/atoms/dialog"
import { AddExpenseDialog } from "../organisms/AddExpenseDialog"
import { AddIncomeDialog } from "../organisms/AddIncomeDialog"

interface TransactionsTableProps {
    transactions: ITransaction[]
    onEditTransaction: (transaction: ITransaction) => void
    onDeleteTransaction: (transactionId: string) => void
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
        if (transactionToDelete && transactionToDelete._id) {
            onDeleteTransaction(transactionToDelete._id.toString())
            setDeleteDialogOpen(false)
            setTransactionToDelete(null)
        }
    }

    const handleEditTransaction = async (description: string, amount: number, tag: string, date: string) => {
        if (transactionToEdit) {
            const updatedTransaction = { ...transactionToEdit, description, amount, tag, date }
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
            <Table>
                <TableHeader>
                    <TableRow className="text-black">
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
                                <TableCell className="text-black">{new Date(transaction.date).toLocaleDateString()}</TableCell>
                                <TableCell className="text-black">{transaction.description}</TableCell>
                                <TableCell className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                                    R$ {transaction.amount !== undefined && transaction.amount !== null ? transaction.amount.toFixed(2) : 'N/A'}
                                </TableCell>
                                <TableCell className={transaction.type === 'income' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{transaction.type === 'income' ? 'Receita' : 'Despesa'}</TableCell>
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
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => handleDeleteClick(transaction)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white">
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
                <DialogContent className="sm:max-w-[425px] bg-white">
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