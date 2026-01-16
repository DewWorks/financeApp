"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card"
import { BarChart2, Calendar, TrendingUp } from "lucide-react"
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from "recharts"
import { formatShortDate, formatCurrency } from "@/lib/utils"

interface TransactionData {
    data: string
    receita: number
    despesa: number
}

interface IncomeVsExpensesChartProps {
    areaChartData: TransactionData[];
    onFetchAllTransactions: () => Promise<boolean>;
}

type ChartType = "acumulado" | "mensal" | "anual"

const chartTitles: Record<ChartType, string> = {
    acumulado: "Evolução Patrimonial",
    mensal: "Fluxo Mensal",
    anual: "Comparativo Anual",
}

export function IncomeVsExpensesChart({ areaChartData, onFetchAllTransactions }: IncomeVsExpensesChartProps) {
    const [selectedChartType, setSelectedChartType] = useState<ChartType>("acumulado")

    const handleChartTypeChange = async (type: ChartType) => {
        if (type === "anual") {
            const confirmed = await onFetchAllTransactions();
            if (confirmed) {
                setSelectedChartType(type);
            }
        } else {
            setSelectedChartType(type);
        }
    };

    const processedData = useMemo(() => {
        const sortedData = [...areaChartData].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())

        // Acumulado
        let cumulativeReceita = 0
        let cumulativeDespesa = 0
        const acumuladoData = sortedData.map((t) => {
            cumulativeReceita += t.receita
            cumulativeDespesa += t.despesa
            return {
                data: t.data,
                receitaTotal: cumulativeReceita,
                despesaTotal: cumulativeDespesa,
                saldoLiquido: cumulativeReceita - cumulativeDespesa
            }
        })

        // Mensal
        const mensalData = sortedData.reduce((acc: Record<string, any>, curr) => {
            const date = new Date(curr.data);
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            const label = date.toLocaleString("pt-BR", { month: "short", year: "numeric" });

            if (!acc[key]) acc[key] = { data: label, receita: 0, despesa: 0 };
            acc[key].receita += curr.receita;
            acc[key].despesa += curr.despesa;
            return acc;
        }, {})

        // Anual
        const anualData: Record<string, { mes: string; receitaAtual: number; despesaAtual: number; receitaAnterior: number; despesaAnterior: number }> = {}
        const currentYear = new Date().getFullYear()
        sortedData.forEach((t) => {
            const d = new Date(t.data)
            const monthIndex = d.getMonth();
            const monthName = d.toLocaleString("pt-BR", { month: "short" })
            const year = d.getFullYear()

            if (!anualData[monthIndex]) {
                anualData[monthIndex] = { mes: monthName, receitaAtual: 0, despesaAtual: 0, receitaAnterior: 0, despesaAnterior: 0 }
            }
            if (year === currentYear) {
                anualData[monthIndex].receitaAtual += t.receita
                anualData[monthIndex].despesaAtual += t.despesa
            } else if (year === currentYear - 1) {
                anualData[monthIndex].receitaAnterior += t.receita
                anualData[monthIndex].despesaAnterior += t.despesa
            }
        })

        return {
            acumulado: acumuladoData,
            mensal: Object.values(mensalData),
            anual: Object.values(anualData),
        }
    }, [areaChartData])

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-400 mb-2">{String(label)}</p>
                    <div className="space-y-1">
                        {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                                    <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">{entry.name}</span>
                                </div>
                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(entry.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )
        }
        return null
    }

    const GradientDefs = () => (
        <defs>
            <linearGradient id="gradientReceita" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradientDespesa" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
        </defs>
    )

    const renderChart = (height: number) => {
        return (
            <ResponsiveContainer width="100%" height={height}>
                {selectedChartType === "anual" ? (
                    <LineChart data={processedData.anual} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:opacity-10" />
                        <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} dy={10} />
                        <YAxis tickFormatter={(val) => `R$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                        <Line type="monotone" dataKey="receitaAtual" stroke="#10b981" strokeWidth={2} dot={false} name="Receita Atual" />
                        <Line type="monotone" dataKey="despesaAtual" stroke="#ef4444" strokeWidth={2} dot={false} name="Despesa Atual" />
                        <Line type="monotone" dataKey="receitaAnterior" stroke="#86efac" strokeDasharray="5 5" dot={false} name="Receita Ant." />
                        <Line type="monotone" dataKey="despesaAnterior" stroke="#fca5a5" strokeDasharray="5 5" dot={false} name="Despesa Ant." />
                    </LineChart>
                ) : (
                    <AreaChart data={selectedChartType === "acumulado" ? processedData.acumulado : processedData.mensal} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <GradientDefs />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:opacity-10" />
                        <XAxis
                            dataKey="data"
                            tickFormatter={selectedChartType === "acumulado" ? formatShortDate : undefined}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 11 }}
                            dy={10}
                        />
                        <YAxis tickFormatter={(val) => `R$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />

                        {selectedChartType === "acumulado" ? (
                            <>
                                <Area type="monotone" dataKey="receitaTotal" stroke="#10b981" strokeWidth={3} fill="url(#gradientReceita)" name="Receita Total" />
                                <Area type="monotone" dataKey="despesaTotal" stroke="#ef4444" strokeWidth={3} fill="url(#gradientDespesa)" name="Despesa Total" />
                            </>
                        ) : (
                            <>
                                <Area type="monotone" dataKey="receita" stroke="#10b981" fill="url(#gradientReceita)" name="Receita" />
                                <Area type="monotone" dataKey="despesa" stroke="#ef4444" fill="url(#gradientDespesa)" name="Despesa" />
                            </>
                        )}
                    </AreaChart>
                )}
            </ResponsiveContainer>
        )
    }

    // Modern Pill Filter
    const renderFilters = () => (
        <div className="flex justify-center md:justify-end space-x-2 mt-4 md:mt-0 bg-gray-100 dark:bg-gray-900/50 p-1 rounded-lg w-fit mx-auto md:mx-0">
            {[
                { id: "acumulado", label: "Evolução", icon: TrendingUp },
                { id: "mensal", label: "Mensal", icon: BarChart2 },
                { id: "anual", label: "Comparar", icon: Calendar }
            ].map((btn) => (
                <button
                    key={btn.id}
                    onClick={() => handleChartTypeChange(btn.id as ChartType)}
                    className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-200
                        ${selectedChartType === btn.id
                            ? "bg-white dark:bg-gray-800 text-blue-600 shadow-sm"
                            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}
                    `}
                >
                    <btn.icon className="w-3 h-3" />
                    <span className="hidden sm:inline">{btn.label}</span>
                </button>
            ))}
        </div>
    )

    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <Card className="bg-white dark:bg-gray-800 shadow-sm border-none ring-1 ring-gray-200 dark:ring-gray-700">
                <CardHeader className="flex flex-col md:flex-row items-center justify-between pb-2">
                    <div>
                        <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">{chartTitles[selectedChartType]}</CardTitle>
                        <p className="text-sm text-gray-500">Acompanhe seu balanço financeiro</p>
                    </div>
                    {renderFilters()}
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        {renderChart(300)}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
