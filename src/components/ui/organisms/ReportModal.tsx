import type React from "react"
import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/atoms/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/atoms/tabs"
import type { ITransaction } from "@/interfaces/ITransaction"
import { Title } from "@/components/ui/molecules/Title"
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { SummaryCard } from "../molecules/SummaryCard"
import { ArrowDownIcon, ArrowUpIcon, DollarSign, Download } from "lucide-react"
import { IGoal } from "@/interfaces/IGoal"
import { IUser } from "@/interfaces/IUser"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { TransactionsTable } from "@/components/ui/molecules/TransactionsTable"

export interface ReportModalProps {
    onClose: () => void
    user: IUser
    transactions: ITransaction[]
    goals: IGoal[]
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"]

export const ReportModal: React.FC<ReportModalProps> = ({
                                                            onClose,
                                                            transactions: initialTransactions
                                                        }) => {
    const reportRef = useRef<HTMLDivElement>(null)
    const [isPrinting, setIsPrinting] = useState(false)
    const [transactions, setTransactions] = useState(initialTransactions)
    const [selectedFrequency, setSelectedFrequency] = useState<"weekly" | "biweekly" | "monthly">("weekly")

    const filterTransactions = (frequency: "weekly" | "biweekly" | "monthly") => {
        const now = new Date()
        let startDate: Date

        switch (frequency) {
            case "weekly":
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
                break
            case "biweekly":
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14)
                break
            case "monthly":
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
                break
        }

        return initialTransactions.filter((t) => new Date(t.date) >= startDate)
    }

    useEffect(() => {
        setTransactions(filterTransactions(selectedFrequency))
    }, [selectedFrequency, initialTransactions]) // Added initialTransactions to dependencies

    const totalExpense = transactions.reduce((acc, curr) => (curr.type === "expense" ? acc + curr.amount : acc), 0)
    const totalIncome = transactions.reduce((acc, curr) => (curr.type === "income" ? acc + curr.amount : acc), 0)
    const balance = totalIncome - totalExpense

    const pieChartData = [
        { name: "Receitas", value: totalIncome },
        { name: "Despesas", value: totalExpense },
    ]

    const barChartData = transactions.map((transaction) => ({
        date: new Date(transaction.date).toLocaleDateString(),
        amount: transaction.amount,
        type: transaction.type,
    }))

    useEffect(() => {
        const charts = document.querySelectorAll(".recharts-wrapper")
        charts.forEach(() => {
            const event = new Event("resize")
            window.dispatchEvent(event)
        })
    }, [])

    const generatePDF = async () => {
        if (reportRef.current) {
            setIsPrinting(true)

            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            })

            // Temporarily apply light theme for PDF generation
            reportRef.current.classList.remove("dark")
            reportRef.current.classList.add("light")

            // Capture summary page
            const summaryCanvas = await html2canvas(reportRef.current, {
                scale: 2,
                logging: true,
                useCORS: true,
                allowTaint: true,
                ignoreElements: (element) => element.classList.contains("transactions-table"),
            })
            const summaryImgData = summaryCanvas.toDataURL("image/png")
            pdf.addImage(summaryImgData, "PNG", 0, 0, 210, 297)

            // Capture transactions table
            const tableElement = reportRef.current.querySelector(".transactions-table")
            if (tableElement) {
                pdf.addPage()
                const tableCanvas = await html2canvas(tableElement as HTMLElement, {
                    scale: 2,
                    logging: true,
                    useCORS: true,
                    allowTaint: true,
                })
                const tableImgData = tableCanvas.toDataURL("image/png")
                pdf.addImage(tableImgData, "PNG", 0, 0, 210, 297)
            }

            // Restore original theme
            reportRef.current.classList.remove("light")
            reportRef.current.classList.add("dark")

            pdf.save("relatorio-financeiro.pdf")
            setIsPrinting(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
        >
            <div
                ref={reportRef}
                className="w-full max-w-4xl bg-white dark:bg-gray-800 dark:text-white overflow-y-auto p-8"
                style={{ maxHeight: "90vh" }}
            >
                <div className="flex justify-between items-center mb-8">
                    <div className="flex flex-col">
                    <h1 className="text-3xl font-bold">Relatório Financeiro</h1>
                    <Title/>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={generatePDF} className="bg-blue-600 text-white" variant="outline" disabled={isPrinting}>
                            {isPrinting ? "Gerando PDF..." : <Download className="h-4 w-4" />}
                        </Button>
                        <Button onClick={onClose} className="bg-red-600 text-white" variant="outline">
                            X
                        </Button>
                    </div>
                </div>

                <Tabs
                    value={selectedFrequency}
                    onValueChange={(value) => setSelectedFrequency(value as "weekly" | "biweekly" | "monthly")}
                >
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="weekly">Semanal</TabsTrigger>
                        <TabsTrigger value="biweekly">Quinzenal</TabsTrigger>
                        <TabsTrigger value="monthly">Mensal</TabsTrigger>
                    </TabsList>

                    <TabsContent value={selectedFrequency}>
                        <div className="grid grid-cols-3 gap-4 mb-8">
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
                            <SummaryCard title="Saldo Total" value={balance} icon={DollarSign} description="Atualizado agora" />
                        </div>

                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div>
                                <h2 className="text-2xl font-bold mb-4">Distribuição por Categoria</h2>
                                <div className="h-64">
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
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold mb-4">Fluxo de Caixa</h2>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={barChartData}>
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="amount" fill="#8884d8" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        <div className="transactions-table">
                            <h2 className="text-2xl font-bold mb-4">Transações</h2>
                            <TransactionsTable transactions={transactions} />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </motion.div>
    )
}

