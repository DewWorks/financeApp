import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/atoms/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/atoms/tabs"
import { calculateTotals, getCategoryTotals } from "@/app/functions/report"
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { ITransaction, ReportFrequency } from "@/interfaces/ITransaction"
import { SummaryCard } from '@/components/ui/molecules/SummaryCard'
import { ArrowDownIcon, ArrowUpIcon, DollarSign, LogIn, LogOut } from 'lucide-react'

interface ReportModalProps {
    onClose: () => void
    transactions: ITransaction[]
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

export const ReportModal: React.FC<ReportModalProps> = ({ onClose, transactions }) => {
    const [selectedFrequency, setSelectedFrequency] = useState<ReportFrequency>("weekly")
    const [filteredTransactions, setFilteredTransactions] = useState<ITransaction[]>([])
    const [totals, setTotals] = useState({ totalIncome: 0, totalExpenses: 0 })
    const [categoryTotals, setCategoryTotals] = useState<Record<string, number>>({})

    useEffect(() => {
        setFilteredTransactions(transactions)
        setTotals(calculateTotals(transactions))
        setCategoryTotals(getCategoryTotals(transactions))
    }, [selectedFrequency, transactions])

    const pieChartData = Object.entries(categoryTotals).map(([category, total]) => ({
        name: category,
        value: total,
    }))

    const barChartData = filteredTransactions.map((t) => ({
        date: new Date(t.date).toLocaleDateString(),
        amount: t.type === "income" ? t.amount : -t.amount,
    }))

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    const balance = totalIncome - totalExpense


    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
        >
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold w-full flex justify-between">Relatório Financeiro
                            <Button onClick={onClose} variant="outline" className="bg-red-600 text-white">
                                X
                            </Button>
                    </CardTitle>


                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="weekly" onValueChange={(value: string) => setSelectedFrequency(value as ReportFrequency)}>
                        <TabsList className="grid w-full grid-cols-3 mb-4">
                            <TabsTrigger value="weekly">Semanal</TabsTrigger>
                            <TabsTrigger value="biweekly">Quinzenal</TabsTrigger>
                            <TabsTrigger value="monthly">Mensal</TabsTrigger>
                        </TabsList>
                        {["weekly", "biweekly", "monthly"].map((freq) => (
                            <TabsContent key={freq} value={freq}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Resumo</CardTitle>
                                        </CardHeader>
                                        <CardContent className="gap-2">
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
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Distribuição por Categoria</CardTitle>
                                        </CardHeader>
                                        <CardContent className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={pieChartData}
                                                        cx="50%"
                                                        cy="50%"
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
                                    <Card className="md:col-span-2">
                                        <CardHeader>
                                            <CardTitle>Fluxo de Caixa</CardTitle>
                                        </CardHeader>
                                        <CardContent className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={barChartData}>
                                                    <XAxis dataKey="date" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Bar dataKey="amount" fill="#8884d8" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </CardContent>
            </Card>
        </motion.div>
    )
}

