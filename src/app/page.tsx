'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowDownIcon, ArrowUpIcon, PlusIcon } from 'lucide-react'
import { Header } from '../components/Header'
import { TransactionChart } from '../components/transaction-chart'
import { ITransaction } from '@/interfaces/ITransaction'

export default function Component() {
  const [transactions, setTransactions] = useState<ITransaction[]>([
    { id: 1, type: 'income', description: 'Salário', amount: 3000, date: '2023-05-01' },
    { id: 2, type: 'expense', description: 'Aluguel', amount: 1000, date: '2023-05-05' },
    { id: 3, type: 'expense', description: 'Supermercado', amount: 500, date: '2023-05-10' },
    { id: 4, type: 'income', description: 'Freelance', amount: 800, date: '2023-05-15' },
    { id: 5, type: 'expense', description: 'Conta de Luz', amount: 150, date: '2023-05-20' },
  ])

  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false)
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)

  const addTransaction = (type: 'income' | 'expense', description: string, amount: number) => {
    const newTransaction: ITransaction = {
      id: transactions.length + 1,
      type,
      description,
      amount,
      date: new Date().toISOString().split('T')[0],
    }
    setTransactions([newTransaction, ...transactions])
    // Alternative fix: Use an if-else statement
    if (type === 'income') {
      setIsIncomeModalOpen(false)
    } else {
      setIsExpenseModalOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-green-100 border-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium text-green-800">Receitas</CardTitle>
              <ArrowUpIcon className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">R$ {totalIncome.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="bg-red-100 border-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium text-red-800">Despesas</CardTitle>
              <ArrowDownIcon className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-700">R$ {totalExpense.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Últimas Transações</h2>
          <div className="space-x-2">
            <Dialog open={isIncomeModalOpen} onOpenChange={setIsIncomeModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-green-500 text-white hover:bg-green-600">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Receita
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Receita</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault()
                  const form = e.target as HTMLFormElement
                  const description = (form.elements.namedItem('description') as HTMLInputElement).value
                  const amount = parseFloat((form.elements.namedItem('amount') as HTMLInputElement).value)
                  addTransaction('income', description, amount)
                }}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">
                        Descrição
                      </Label>
                      <Input id="description" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="amount" className="text-right">
                        Valor
                      </Label>
                      <Input id="amount" type="number" step="0.01" className="col-span-3" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit">Adicionar</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-red-500 text-white hover:bg-red-600">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Despesa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Despesa</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault()
                  const form = e.target as HTMLFormElement
                  const description = (form.elements.namedItem('description') as HTMLInputElement).value
                  const amount = parseFloat((form.elements.namedItem('amount') as HTMLInputElement).value)
                  addTransaction('expense', description, amount)
                }}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">
                        Descrição
                      </Label>
                      <Input id="description" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="amount" className="text-right">
                        Valor
                      </Label>
                      <Input id="amount" type="number" step="0.01" className="col-span-3" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit">Adicionar</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="mb-8">
          <CardContent className="p-6">
            <TransactionChart transactions={transactions.slice(0, 5)} />
          </CardContent>
        </Card>

        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Todas as Transações</h2>
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell>{transaction.type === 'income' ? 'Receita' : 'Despesa'}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                      R$ {transaction.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}