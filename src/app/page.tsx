'use client'

import { useTransactions } from '@/hooks/useTransactions'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownIcon, ArrowUpIcon, DollarSign, Wallet } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { AddIncomeDialog } from '@/components/AddIncomeDialog'
import { AddExpenseDialog } from '@/components/AddExpenseDialog'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function DashboardFinanceiro() {
  const { transactions, addTransaction } = useTransactions()

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
    tipo: t.type === 'income' ? 'Receita' : 'Despesa'
  }))

  const lineChartData = transactions.slice(0, 10).map(t => ({
    data: t.date,
    valor: t.type === 'income' ? t.amount : -t.amount
  }))

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Wallet className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-2xl font-bold text-gray-900">FinançasPro</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Financeiro</h1>
            <p className="mt-1 text-sm text-gray-600">Visão geral das suas finanças pessoais</p>
          </div>
          <div className="space-x-2">
            <AddIncomeDialog onAddIncome={(description, amount) => addTransaction({ type: 'income', description, amount, date: new Date().toISOString() })} />
            <AddExpenseDialog onAddExpense={(description, amount) => addTransaction({ type: 'expense', description, amount, date: new Date().toISOString() })} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-white shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Saldo Total</CardTitle>
              <DollarSign className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">R$ {balance.toFixed(2)}</div>
              <p className="text-xs text-gray-600 mt-1">Atualizado agora</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Receitas</CardTitle>
              <ArrowUpIcon className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">R$ {totalIncome.toFixed(2)}</div>
              <p className="text-xs text-gray-600 mt-1">+{((totalIncome / (totalIncome + totalExpense)) * 100).toFixed(1)}% do total</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Despesas</CardTitle>
              <ArrowDownIcon className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">R$ {totalExpense.toFixed(2)}</div>
              <p className="text-xs text-gray-600 mt-1">-{((totalExpense / (totalIncome + totalExpense)) * 100).toFixed(1)}% do total</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Distribuição de Receitas e Despesas</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Últimas Transações</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="valor" fill="#8884d8" name="Valor" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Fluxo de Caixa</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="valor" stroke="#8884d8" name="Fluxo de Caixa" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}