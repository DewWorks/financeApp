import type React from "react"
import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/atoms/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/atoms/tabs"
import type { ITransaction, ReportFrequency } from "@/interfaces/ITransaction"
import { filterTransactionsByFrequency, calculateTotals, getCategoryTotals } from "@/app/functions/report"
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { SummaryCard } from "../molecules/SummaryCard"
import { ArrowDownIcon, ArrowUpIcon, DollarSign, LogIn, LogOut, Upload, Download } from "lucide-react"

interface ReportModalProps {
    onClose: () => void
    transactions: ITransaction[]
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

export const ReportModal: React.FC<ReportModalProps> = ({ onClose, transactions: initialTransactions }) => {
    const [transactions, setTransactions] = useState<ITransaction[]>(initialTransactions)
    const [selectedFrequency, setSelectedFrequency] = useState<ReportFrequency>("weekly")
    const [filteredTransactions, setFilteredTransactions] = useState<ITransaction[]>([])
    const [totals, setTotals] = useState({ totalIncome: 0, totalExpenses: 0 })
    const [categoryTotals, setCategoryTotals] = useState<Record<string, number>>({})
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const filtered = filterTransactionsByFrequency(transactions, selectedFrequency)
        setFilteredTransactions(filtered)
        setTotals(calculateTotals(filtered))
        setCategoryTotals(getCategoryTotals(filtered))
    }, [selectedFrequency, transactions])

    const pieChartData = Object.entries(categoryTotals).map(([category, total]) => ({
        name: category,
        value: total,
    }))

    const barChartData = filteredTransactions.map((t) => ({
        date: new Date(t.date).toLocaleDateString(),
        amount: t.type === "income" ? t.amount : -t.amount,
    }))

    const totalIncome = filteredTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
    const totalExpense = filteredTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)
    const balance = totalIncome - totalExpense

    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click()
        }
    }

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                const content = e.target?.result as string
                try {
                    const importedTransactions = JSON.parse(content) as ITransaction[]
                    setTransactions([...transactions, ...importedTransactions])
                } catch (error) {
                    console.error("Error parsing imported file:", error)
                    alert("Erro ao importar o arquivo. Certifique-se de que é um JSON válido.")
                }
            }
            reader.readAsText(file)
        }
    }

    const generateMonthlyReport = () => {
        const monthlyTransactions = filterTransactionsByFrequency(transactions, "monthly")
        const monthlyTotals = calculateTotals(monthlyTransactions)
        const monthlyCategoryTotals = getCategoryTotals(monthlyTransactions)

        let reportContent = "Relatório Financeiro Mensal\n\n"
        reportContent += `Saldo Total: R$ ${(monthlyTotals.totalIncome - monthlyTotals.totalExpenses).toFixed(2)}\n`
        reportContent += `Total de Receitas: R$ ${monthlyTotals.totalIncome.toFixed(2)}\n`
        reportContent += `Total de Despesas: R$ ${monthlyTotals.totalExpenses.toFixed(2)}\n\n`
        reportContent += "Distribuição por Categoria:\n"

        Object.entries(monthlyCategoryTotals).forEach(([category, total]) => {
            reportContent += `${category}: R$ ${total.toFixed(2)}\n`
        })

        const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = "relatorio_mensal.txt"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

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
                    <CardTitle className="w-full flex justify-between items-center text-2xl font-bold">
                        Relatório Financeiro
                        <div className="flex space-x-2">
                            <Button onClick={handleImportClick} className="bg-green-600 text-white" variant="outline">
                                <Upload className="mr-2 h-4 w-4" /> Importar
                            </Button>
                            <Button onClick={generateMonthlyReport} className="bg-blue-600 text-white" variant="outline">
                                <Download className="mr-2 h-4 w-4" /> Relatório Mensal
                            </Button>
                            <Button onClick={onClose} className="bg-red-600 text-white" variant="outline">
                                X
                            </Button>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileImport}
                        accept=".json"
                        style={{ display: "none" }}
                    />
                    <Tabs defaultValue="weekly" onValueChange={(value) => setSelectedFrequency(value as ReportFrequency)}>
                        <TabsList className="grid w-full grid-cols-3 mb-4">
                            <TabsTrigger
                                value="weekly"
                                className={`${selectedFrequency === "weekly" ? "bg-blue-500 text-white" : ""} transition-colors duration-200`}
                            >
                                Semanal
                            </TabsTrigger>
                            <TabsTrigger
                                value="biweekly"
                                className={`${selectedFrequency === "biweekly" ? "bg-blue-500 text-white" : ""} transition-colors duration-200`}
                            >
                                Quinzenal
                            </TabsTrigger>
                            <TabsTrigger
                                value="monthly"
                                className={`${selectedFrequency === "monthly" ? "bg-blue-500 text-white" : ""} transition-colors duration-200`}
                            >
                                Mensal
                            </TabsTrigger>
                        </TabsList>
                        {["weekly", "biweekly", "monthly"].map((freq) => (
                            <TabsContent key={freq} value={freq}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                    <SummaryCard
                                        title="Despesas"
                                        value={totalExpense}
                                        icon={ArrowDownIcon}
                                        valueColor="text-red-600"
                                        description={`-${((totalExpense / (totalIncome + totalExpense)) * 100).toFixed(1)}% do total`}
                                    />
                                    <SummaryCard
                                        title="Receitas"
                                        value={totalIncome}
                                        icon={ArrowUpIcon}
                                        valueColor="text-green-600"
                                        description={`+${((totalIncome / (totalIncome + totalExpense)) * 100).toFixed(1)}% do total`}
                                    />
                                    <SummaryCard
                                        title="Saldo Total"
                                        value={balance}
                                        icon={DollarSign}
                                        description="Atualizado agora"
                                    />
                                        </div>
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
                    <div className="mt-6 flex justify-end space-x-4">
                        {/* <Button onClick={onClose} variant="outline">
              Fechar
            </Button> */}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}

