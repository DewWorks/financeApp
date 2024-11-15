'use client'

import { useTransactions } from '@/hooks/useTransactions'
import { Card, CardContent, CardTitle } from "@/components/ui/atoms/card"
import { ArrowDownIcon, ArrowUpIcon, DollarSign, LogIn, LogOut } from 'lucide-react'
import { AddIncomeDialog } from '@/components/ui/organisms/AddIncomeDialog'
import { AddExpenseDialog } from '@/components/ui/organisms/AddExpenseDialog'
import { ITransaction } from '@/interfaces/ITransaction'
import { SummaryCard } from '@/components/ui/molecules/SummaryCard'
import { TransactionsTable } from '@/components/ui/molecules/TransactionsTable'
import { Button } from '@/components/ui/atoms/button'
import { useRouter } from 'next/navigation'
import { Title } from '@/components/ui/molecules/Title'
import { motion } from 'framer-motion'
import { ExpensePrediction } from '@/components/ai/ExpensePrediction'
import {CashFlowChart} from "@/components/ui/charts/CashFlowChart";
import {DistributionChart} from "@/components/ui/charts/DistributionChart";
import {RecentTransactionsChart} from "@/components/ui/charts/RecentTransactionChart";
import {IncomeVsExpensesChart} from "@/components/ui/charts/IncomeVsExpensesChart";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function DashboardFinanceiro() {
  const router = useRouter()
  const { transactions, addTransaction, editTransaction, deleteTransaction } = useTransactions()

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const balance = totalIncome - totalExpense

  const pieChartData = [
    { name: 'Receitas', value: totalIncome },
    { name: 'Despesas', value: totalExpense },
  ]

  const barChartData = transactions.slice(0, 5).map(t => ({
    name: t.description,
    valor: t.amount,
    tipo: t.type === 'income' ? 'Receita' : 'Despesa',
    tag: t.tag
  }))

  const lineChartData = transactions.slice(0, 10).map(t => ({
    data: t.date,
    valor: t.type === 'income' ? t.amount : -t.amount,
    tag: t.tag
  }))

  const areaChartData = transactions.slice(0, 15).map(t => ({
    data: t.date,
    receita: t.type === 'income' ? t.amount : 0,
    despesa: t.type === 'expense' ? t.amount : 0,
  }))

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/auth/login')
  }

  const handleLogin = () => {
    router.push('/auth/login')
  }

  const handleAddIncome = (description: string, amount: number, tag: string, date: string) => {
    const newTransaction: Partial<ITransaction> = {
      type: 'income',
      description,
      amount,
      date,
      tag
    }
    addTransaction(newTransaction)
  }

  const handleAddExpense = (description: string, amount: number, tag: string, date: string) => {
    const newTransaction: Partial<ITransaction> = {
      type: 'expense',
      description,
      amount,
      date,
      tag
    }
    addTransaction(newTransaction)
  }

  const handleEditTransaction = async (updatedTransaction: Partial<ITransaction>) => {
    await editTransaction(updatedTransaction)
  }

  const handleDeleteTransaction = async (transactionId: string) => {
    await deleteTransaction(transactionId)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <Title/>
          </div>
          <div className="flex items-center">
            <Button onClick={handleLogin} variant="ghost">
                <LogIn className="h-5 w-5 mr-2" />
                Entrar
              </Button>
              <Button onClick={handleLogout} variant="ghost">
                <LogOut className="h-5 w-5 mr-2" />
                Sair
              </Button>
            </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
            initial={{opacity: 0, y: -20}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.5}}
            className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Financeiro</h1>
            <p className="mt-1 text-sm text-gray-600">Visão geral das suas finanças pessoais</p>
          </div>
          <div className="space-x-2">
            <AddIncomeDialog onAddIncome={handleAddIncome}/>
            <AddExpenseDialog onAddExpense={handleAddExpense}/>
            <ExpensePrediction transactions={transactions}/>
          </div>
        </motion.div>

        <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.5, delay: 0.2}}
            className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-3"
        >
          <SummaryCard
              title="Saldo Total"
              value={balance}
              icon={DollarSign}
              description="Atualizado agora"
          />
          <SummaryCard
              title="Receitas"
              value={totalIncome}
              icon={ArrowUpIcon}
              valueColor="text-green-600"
              description={`+${((totalIncome / (totalIncome + totalExpense)) * 100).toFixed(1)}% do total`}
          />
          <SummaryCard
              title="Despesas"
              value={totalExpense}
              icon={ArrowDownIcon}
              valueColor="text-red-600"
              description={`-${((totalExpense / (totalIncome + totalExpense)) * 100).toFixed(1)}% do total`}
          />
        </motion.div>
        <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.5, delay: 1.2}}
        >
          <Card className="bg-white shadow-lg mb-8">
            <CardTitle className="text-lg font-semibold text-gray-900">Todas as Transações</CardTitle>
            {/*
            <CardHeader className="flex flex-row items-center justify-between">

              <div className="flex space-x-2">
                <Button onClick={() => filterTransactions('week')}
                        variant={selectedTimeRange === 'week' ? 'default' : 'outline'}>Semana</Button>
                <Button onClick={() => filterTransactions('month')}
                        variant={selectedTimeRange === 'month' ? 'default' : 'outline'}>Mês</Button>
                <Button onClick={() => filterTransactions('year')}
                        variant={selectedTimeRange === 'year' ? 'default' : 'outline'}>Ano</Button>
                <Button onClick={() => filterTransactions('all')}
                        variant={selectedTimeRange === 'all' ? 'default' : 'outline'}>Todas</Button>
              </div>
            </CardHeader>
            */}
            <CardContent>
              <TransactionsTable
                  transactions={transactions}
                  onEditTransaction={handleEditTransaction}
                  onDeleteTransaction={handleDeleteTransaction}/>
            </CardContent>
          </Card>
        </motion.div>
        <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
          <DistributionChart pieChartData={pieChartData} colors={COLORS}/>
          <RecentTransactionsChart barChartData={barChartData}/>
        </div>

        <CashFlowChart lineChartData={lineChartData}/>
        <IncomeVsExpensesChart areaChartData={areaChartData}/>
      </main>
    </div>
  )
}