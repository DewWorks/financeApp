"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card"
import { BarChart2, Calendar, TrendingUp } from 'lucide-react'
import {
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    Area,
    AreaChart
} from "recharts"
import { formatDate, formatShortDate, formatCurrency } from "@/lib/utils"
import type { ITransaction } from "@/interfaces/ITransaction"

interface CashFlowChartProps {
    transactions: ITransaction[]
    colors: string[]
    onFetchAllTransactions: () => Promise<boolean>;
}

type ChartType = "saldoAcumulado" | "fluxoMensal" | "comparativoAnual"

const chartTitles: Record<ChartType, string> = {
    saldoAcumulado: "Evolução Global",
    fluxoMensal: "Fluxo Mensal",
    comparativoAnual: "Comparativo Anual",
}

export function CashFlowChart({ transactions, colors, onFetchAllTransactions }: CashFlowChartProps) {
    const [isMobile, setIsMobile] = useState(false)
    const [selectedChartType, setSelectedChartType] = useState<ChartType>("saldoAcumulado")

    useEffect(() => {
        const checkIsMobile = () => setIsMobile(window.innerWidth < 768)
        checkIsMobile()
        window.addEventListener("resize", checkIsMobile)
        return () => window.removeEventListener("resize", checkIsMobile)
    }, [])

    const handleChartTypeChange = async (type: ChartType) => {
        if (type === "comparativoAnual") {
            const confirmed = await onFetchAllTransactions();
            if (confirmed) {
                setSelectedChartType(type);
            }
        } else {
            setSelectedChartType(type);
        }
    };

    const processedData = useMemo(() => {
        const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        // Saldo Acumulado
        let cumulativeValue = 0
        const saldoAcumuladoData = sortedTransactions.map(t => {
            cumulativeValue += t.type === "income" ? t.amount : -t.amount
            return { data: t.date, saldo: cumulativeValue }
        })

        // Fluxo Mensal
        const fluxoMensalData: Record<string, { mes: string, receitas: number, despesas: number }> = {}
        sortedTransactions.forEach(t => {
            const date = new Date(t.date);
            const monthYearKey = `${date.getFullYear()}-${date.getMonth()}`; // Sortable key
            const displayLabel = date.toLocaleString('pt-BR', { month: 'short' });

            if (!fluxoMensalData[monthYearKey]) {
                fluxoMensalData[monthYearKey] = { mes: displayLabel, receitas: 0, despesas: 0 }
            }
            t.type === "income" ? fluxoMensalData[monthYearKey].receitas += t.amount : fluxoMensalData[monthYearKey].despesas += t.amount
        })

        // Comparativo Anual
        const comparativoAnualData: Record<string, { mes: string, anoAtual: number, anoAnterior: number }> = {}
        const currentYear = new Date().getFullYear()
        sortedTransactions.forEach(t => {
            const d = new Date(t.date)
            const monthIndex = d.getMonth();
            const monthName = d.toLocaleString('pt-BR', { month: 'short' })
            const year = d.getFullYear()

            // Use index as key to ensure correct order
            if (!comparativoAnualData[monthIndex]) {
                comparativoAnualData[monthIndex] = { mes: monthName, anoAtual: 0, anoAnterior: 0 }
            }
            const value = t.type === "income" ? t.amount : -t.amount
            if (year === currentYear) comparativoAnualData[monthIndex].anoAtual += value
            else if (year === currentYear - 1) comparativoAnualData[monthIndex].anoAnterior += value
        })

        return {
            saldoAcumulado: saldoAcumuladoData,
            fluxoMensal: Object.values(fluxoMensalData),
            comparativoAnual: Object.values(comparativoAnualData),
        }
    }, [transactions])

    // Reusable Gradient Defs
    const GradientDefs = () => (
        <defs>
            <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
        </defs>
    );

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700">
                    <p className="font-bold text-gray-900 dark:text-white mb-2">{formatDate(label) !== 'Data inválida' ? formatDate(label) : label}</p>
                    {payload.map((entry: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 mb-1 last:mb-0">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-xs text-gray-500 capitalize">{entry.name}:</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(entry.value)}</span>
                        </div>
                    ))}
                </div>
            )
        }
        return null
    }

    const renderChart = (height: number) => {
        return (
            <ResponsiveContainer width="100%" height={height}>
                <AreaChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <GradientDefs />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:opacity-10" />
                    <XAxis
                        dataKey={selectedChartType === "saldoAcumulado" ? "data" : "mes"}
                        tickFormatter={selectedChartType === "saldoAcumulado" ? formatShortDate : undefined}
                        tick={{ fill: '#6B7280', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                    />
                    <YAxis
                        tickFormatter={(val) => `R$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                        tick={{ fill: '#6B7280', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />

                    {selectedChartType === "saldoAcumulado" && (
                        <Area
                            type="monotone"
                            data={processedData.saldoAcumulado}
                            dataKey="saldo"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            fill="url(#colorSaldo)"
                            name="Saldo Acumulado"
                            animationDuration={1500}
                        />
                    )}

                    {selectedChartType === "fluxoMensal" && (
                        <>
                            <Area type="monotone" data={processedData.fluxoMensal} dataKey="receitas" stroke="#10b981" fill="url(#colorReceitas)" stackId="1" name="Receitas" />
                            <Area type="monotone" data={processedData.fluxoMensal} dataKey="despesas" stroke="#ef4444" fill="url(#colorDespesas)" stackId="2" name="Despesas" />
                        </>
                    )}

                    {selectedChartType === "comparativoAnual" && (
                        <>
                            <Area type="monotone" data={processedData.comparativoAnual} dataKey="anoAtual" stroke="#3b82f6" fillOpacity={0.1} fill="#3b82f6" name="Ano Atual" />
                            <Area type="monotone" data={processedData.comparativoAnual} dataKey="anoAnterior" stroke="#9ca3af" strokeDasharray="5 5" fill="transparent" name="Ano Anterior" />
                        </>
                    )}
                </AreaChart>
            </ResponsiveContainer>
        )
    }

    // Modern Pill Filter
    const renderFilters = () => (
        <div className="flex justify-center md:justify-end space-x-2 mt-4 md:mt-0 bg-gray-100 dark:bg-gray-900/50 p-1 rounded-lg w-fit mx-auto md:mx-0">
            {[
                { id: "saldoAcumulado", label: "Evolução", icon: TrendingUp },
                { id: "fluxoMensal", label: "Mensal", icon: BarChart2 },
                { id: "comparativoAnual", label: "Comparar", icon: Calendar }
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="bg-white dark:bg-gray-800 shadow-sm border-none ring-1 ring-gray-200 dark:ring-gray-700">
                <CardHeader className="flex flex-col md:flex-row items-center justify-between pb-2">
                    <div className="text-center md:text-left mb-2 md:mb-0">
                        <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {chartTitles[selectedChartType]}
                        </CardTitle>
                        <p className="text-xs text-gray-400 mt-1 max-w-sm">
                            Acompanhe como suas finanças estão performando ao longo do tempo.
                        </p>
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