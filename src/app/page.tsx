'use client'

import { useTransactions } from '@/hooks/useTransactions'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownIcon, ArrowUpIcon, DollarSign, LogIn, LogOut, Info } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts'
import { AddIncomeDialog } from '@/components/AddIncomeDialog'
import { AddExpenseDialog } from '@/components/AddExpenseDialog'
import { ITransaction } from '@/interfaces/ITransaction'
import { SummaryCard } from '@/components/SummaryCard'
import { TransactionsTable } from '@/components/TransactionsTable'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Title } from '@/components/Title'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function DashboardFinanceiro() {
  const router = useRouter()
  const { transactions, addTransaction } = useTransactions()
  const [selectedTimeRange, setSelectedTimeRange] = useState('all')

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

  const handleAddIncome = (description: string, amount: number, tag: string) => {
    const newTransaction: Partial<ITransaction> = {
      type: 'income',
      description,
      amount,
      date: new Date().toISOString(),
      tag
    }
    addTransaction(newTransaction)
  }

  const handleAddExpense = (description: string, amount: number, tag: string) => {
    const newTransaction: Partial<ITransaction> = {
      type: 'expense',
      description,
      amount,
      date: new Date().toISOString(),
      tag
    }
    addTransaction(newTransaction)
  }

  const filterTransactions = (timeRange: string) => {
    setSelectedTimeRange(timeRange)
    // Implement filtering logic based on timeRange
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
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Financeiro</h1>
            <p className="mt-1 text-sm text-gray-600">Visão geral das suas finanças pessoais</p>
          </div>
          <div className="space-x-2">
            <AddIncomeDialog onAddIncome={handleAddIncome} />
            <AddExpenseDialog onAddExpense={handleAddExpense} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.2 }}
        >
          <Card className="bg-white shadow-lg mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Todas as Transações</CardTitle>
              <div className="flex space-x-2">
                <Button onClick={() => filterTransactions('week')} variant={selectedTimeRange === 'week' ? 'default' : 'outline'}>Semana</Button>
                <Button onClick={() => filterTransactions('month')} variant={selectedTimeRange === 'month' ? 'default' : 'outline'}>Mês</Button>
                <Button onClick={() => filterTransactions('year')} variant={selectedTimeRange === 'year' ? 'default' : 'outline'}>Ano</Button>
                <Button onClick={() => filterTransactions('all')} variant={selectedTimeRange === 'all' ? 'default' : 'outline'}>Todas</Button>
              </div>
            </CardHeader>
            <CardContent>
              <TransactionsTable transactions={transactions} />
            </CardContent>
          </Card>
        </motion.div>
        <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="bg-white shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">Distribuição de Receitas e Despesas</CardTitle>
                <Popover>
                  <PopoverTrigger>
                    <Info className="h-5 w-5 text-gray-500" />
                  </PopoverTrigger>
                  <PopoverContent>
                    Este gráfico mostra a proporção entre suas receitas e despesas totais, permitindo uma visualização rápida do equilíbrio financeiro.
                  </PopoverContent>
                </Popover>
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
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="bg-white shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">Últimas Transações</CardTitle>
                <Popover>
                  <PopoverTrigger>
                    <Info className="h-5 w-5 text-gray-500" />
                  </PopoverTrigger>
                  <PopoverContent>
                    Este gráfico de barras exibe suas transações mais recentes, permitindo uma rápida comparação entre diferentes entradas e saídas.
                  </PopoverContent>
                </Popover>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-2 border rounded shadow">
                            <p>{data.name}</p>
                            <p>Valor: R$ {data.valor.toFixed(2)}</p>
                            <p>Tipo: {data.tipo}</p>
                            <p>Categoria: {data.tag}</p>
                          </div>
                        );
                      }
                      return null;
                    }} />
                    <Legend />
                    <Bar dataKey="valor" fill="#8884d8" name="Valor" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Card className="bg-white shadow-lg mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Fluxo de Caixa</CardTitle>
              <Popover>
                <PopoverTrigger>
                  <Info className="h-5 w-5 text-gray-500" />
                </PopoverTrigger>
                <PopoverContent>
                  Este gráfico de linha mostra a evolução do seu fluxo de caixa ao longo do tempo, ajudando a identificar tendências e padrões em suas finanças.
                </PopoverContent>
              </Popover>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" />
                  <YAxis />
                  <Tooltip content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-2 border rounded shadow">
                          <p>Data: {data.data}</p>
                          <p>Valor: R$ {Math.abs(data.valor).toFixed(2)}</p>
                          <p>Tipo: {data.valor >= 0 ? 'Receita' : 'Despesa'}</p>
                          <p>Categoria: {data.tag}</p>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <Legend />
                  <Line type="monotone" dataKey="valor" stroke="#8884d8" name="Fluxo de Caixa" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          <Card className="bg-white shadow-lg mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Receitas vs Despesas</CardTitle>
              <Popover>
                <PopoverTrigger>
                  <Info className="h-5 w-5 text-gray-500" />
                </PopoverTrigger>
                <PopoverContent>
                  Este gráfico de área empilhada compara suas receitas e despesas ao longo do tempo, permitindo visualizar facilmente a diferença entre entradas e saídas.
                </PopoverContent>
              </Popover>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={areaChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="receita" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Receita" />
                  <Area type="monotone" dataKey="despesa" stackId="1" stroke="#8884d8" fill="#8884d8" name="Despesa" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}