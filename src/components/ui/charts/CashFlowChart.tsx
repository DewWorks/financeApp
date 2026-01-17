"use client"

import { useState, useMemo } from "react"
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
    AreaChart,
    BarChart,
    Bar,
    ReferenceLine
} from "recharts"
import { formatDate, formatShortDate, formatCurrency } from "@/lib/utils"
import type { ITransaction } from "@/interfaces/ITransaction"

interface CashFlowChartProps {
    transactions: ITransaction[]
    colors?: string[]
    onFetchAllTransactions?: () => Promise<boolean>;
}

type ChartType = "saldoAcumulado" | "fluxoDiario" | "comparativoAnual"

const chartTitles: Record<ChartType, string> = {
    saldoAcumulado: "Evolução Patrimonial",
    fluxoDiario: "Fluxo Diário",
    comparativoAnual: "Comparativo Anual",
}

export function CashFlowChart({ transactions, colors, onFetchAllTransactions }: CashFlowChartProps) {
    const [selectedChartType, setSelectedChartType] = useState<ChartType>("saldoAcumulado")

    // Process Data
    const processedData = useMemo(() => {
        if (!transactions || transactions.length === 0) {
            return { saldoAcumulado: [], fluxoDiario: [], comparativoAnual: [] };
        }

        const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        // 1. Saldo Acumulado (Cumulative)
        let cumulativeValue = 0
        const saldoAcumuladoData = sortedTransactions.map(t => {
            cumulativeValue += t.type === "income" ? t.amount : -t.amount
            return {
                data: t.date,
                saldo: cumulativeValue,
                displayDate: formatShortDate(t.date)
            }
        })

        // 2. Fluxo Diário (Daily Aggregation)
        // Aggregates transactions by day to show bars.
        const fluxoDiarioMap: Record<string, { date: string, receitas: number, despesas: number, ord: number }> = {}
        sortedTransactions.forEach(t => {
            const d = new Date(t.date);
            // Use local date string to avoid timezone shifts
            const key = d.toLocaleDateString('en-CA'); // YYYY-MM-DD format

            if (!fluxoDiarioMap[key]) {
                fluxoDiarioMap[key] = {
                    date: t.date,
                    receitas: 0,
                    despesas: 0,
                    ord: d.getTime()
                }
            }
            if (t.type === "income") fluxoDiarioMap[key].receitas += t.amount;
            else fluxoDiarioMap[key].despesas += t.amount;
        })
        const fluxoDiarioData = Object.values(fluxoDiarioMap).sort((a, b) => a.ord - b.ord);

        // 3. Comparativo Anual
        const comparativoMap: Record<number, { mes: string, anoAtual: number, anoAnterior: number }> = {}
        const currentYear = new Date().getFullYear();

        // Init 12 months
        for (let i = 0; i < 12; i++) {
            const date = new Date(currentYear, i, 1);
            comparativoMap[i] = {
                mes: date.toLocaleString('pt-BR', { month: 'short' }),
                anoAtual: 0,
                anoAnterior: 0
            }
        }

        sortedTransactions.forEach(t => {
            const d = new Date(t.date);
            const mIndex = d.getMonth();
            const year = d.getFullYear();
            const val = t.type === "income" ? t.amount : -t.amount;

            if (year === currentYear) comparativoMap[mIndex].anoAtual += val;
            if (year === currentYear - 1) comparativoMap[mIndex].anoAnterior += val;
        })
        const comparativoAnualData = Object.values(comparativoMap);

        return {
            saldoAcumulado: saldoAcumuladoData,
            fluxoDiario: fluxoDiarioData,
            comparativoAnual: comparativoAnualData
        }
    }, [transactions])


    // Gradient Offset for Balance Area
    const gradientOffset = () => {
        const data = processedData.saldoAcumulado;
        if (!data || data.length === 0) return 0;

        const dataMax = Math.max(...data.map((i) => i.saldo));
        const dataMin = Math.min(...data.map((i) => i.saldo));

        if (dataMax <= 0) return 0;
        if (dataMin >= 0) return 1;
        if (dataMax === dataMin) return 0;

        return dataMax / (dataMax - dataMin);
    }
    const off = gradientOffset();

    const handleChartTypeChange = async (type: ChartType) => {
        if (type === "comparativoAnual" && onFetchAllTransactions) {
            const confirmed = await onFetchAllTransactions();
            if (confirmed) {
                setSelectedChartType(type);
            }
        } else {
            setSelectedChartType(type);
        }
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            let displayLabel = label;
            // Attempt to format if it looks like a date string
            if (typeof label === 'string' && (label.includes('T') || label.includes('-'))) {
                try {
                    displayLabel = formatDate(label);
                } catch (e) {
                    // keep original if fail
                }
            }

            return (
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700">
                    <p className="font-bold text-gray-900 dark:text-white mb-2">
                        {displayLabel}
                    </p>
                    {payload.map((entry: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 mb-1 last:mb-0">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-xs text-gray-500 capitalize">{entry.name}:</span>
                            <span className={`text-sm font-semibold ${entry.value < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatCurrency(entry.value)}
                            </span>
                        </div>
                    ))}
                </div>
            )
        }
        return null
    }

    const renderChart = (height: number) => {
        // FLUXO DIÁRIO -> BAR CHART
        if (selectedChartType === "fluxoDiario") {
            const data = processedData.fluxoDiario;
            if (data.length === 0) return <div className="h-full flex items-center justify-center text-gray-400">Sem dados para este período</div>;

            return (
                <ResponsiveContainer width="100%" height={height}>
                    <BarChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }} data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:opacity-10" />
                        <XAxis
                            dataKey="date"
                            tickFormatter={formatShortDate}
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
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />

                        <Bar dataKey="receitas" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    </BarChart>
                </ResponsiveContainer>
            );
        }

        // EVOLUÇÃO & COMPARATIVO -> AREA CHART
        let activeData: any[] = [];
        let xKey = "data";

        if (selectedChartType === "saldoAcumulado") {
            activeData = processedData.saldoAcumulado;
            xKey = "data";
        } else {
            activeData = processedData.comparativoAnual;
            xKey = "mes";
        }

        if (activeData.length === 0) return <div className="h-full flex items-center justify-center text-gray-400">Sem dados para este período</div>;

        return (
            <ResponsiveContainer width="100%" height={height}>
                <AreaChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }} data={activeData}>
                    <defs>
                        <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset={off} stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset={off} stopColor="#ef4444" stopOpacity={0.3} />
                        </linearGradient>
                        <linearGradient id="splitColorStroke" x1="0" y1="0" x2="0" y2="1">
                            <stop offset={off} stopColor="#10b981" stopOpacity={1} />
                            <stop offset={off} stopColor="#ef4444" stopOpacity={1} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:opacity-10" />

                    <XAxis
                        dataKey={xKey}
                        tick={{ fill: '#6B7280', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                        tickFormatter={(val) => selectedChartType === "saldoAcumulado" ? formatShortDate(val) : val}
                    />

                    <YAxis
                        tickFormatter={(val) => `R$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                        tick={{ fill: '#6B7280', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                    />

                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" strokeOpacity={0.5} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />

                    {selectedChartType === "saldoAcumulado" && (
                        <Area
                            type="monotone"
                            dataKey="saldo"
                            stroke="url(#splitColorStroke)"
                            strokeWidth={3}
                            fill="url(#splitColor)"
                            name="Saldo Acumulado"
                            animationDuration={1500}
                        />
                    )}

                    {selectedChartType === "comparativoAnual" && (
                        <>
                            <Area type="monotone" dataKey="anoAtual" stroke="#3b82f6" fillOpacity={0.1} fill="#3b82f6" name="Ano Atual" />
                            <Area type="monotone" dataKey="anoAnterior" stroke="#9ca3af" strokeDasharray="5 5" fill="transparent" name="Ano Anterior" />
                        </>
                    )}

                </AreaChart>
            </ResponsiveContainer>
        )
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="bg-white dark:bg-gray-800 shadow-sm border-none ring-1 ring-gray-200 dark:ring-gray-700">
                <CardHeader className="flex flex-col md:flex-row items-center justify-between pb-2">
                    <div className="text-center md:text-left mb-2 md:mb-0">
                        <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {chartTitles[selectedChartType]}
                        </CardTitle>
                        <p className="text-xs text-gray-400 mt-1 max-w-sm">
                            Acompanhe suas finanças.
                        </p>
                    </div>
                    <div className="flex justify-center md:justify-end space-x-2 mt-4 md:mt-0 bg-gray-100 dark:bg-gray-900/50 p-1 rounded-lg w-fit mx-auto md:mx-0">
                        {[
                            { id: "saldoAcumulado", label: "Evolução", icon: TrendingUp },
                            { id: "fluxoDiario", label: "Fluxo", icon: BarChart2 },
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