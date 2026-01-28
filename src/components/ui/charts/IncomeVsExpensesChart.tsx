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
    BarChart,
    Bar,
    ComposedChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceLine,
    Cell
} from "recharts"
import { formatShortDate, formatCurrency, formatDate } from "@/lib/utils"
import type { ITransaction } from "@/interfaces/ITransaction"

interface IncomeVsExpensesChartProps {
    transactions: ITransaction[]
    onFetchAllTransactions: () => Promise<boolean>;
    initialChartType?: ChartType
}

type ChartType = "acumulado" | "mensal" | "anual"

const chartTitles: Record<ChartType, string> = {
    acumulado: "Evolução Patrimonial",
    mensal: "Resultado Diário (Líquido)",
    anual: "Comparativo Anual",
}

export function IncomeVsExpensesChart({ transactions, onFetchAllTransactions, initialChartType = "acumulado" }: IncomeVsExpensesChartProps) {
    const [selectedChartType, setSelectedChartType] = useState<ChartType>(initialChartType)

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
        if (!transactions || transactions.length === 0) {
            return { acumulado: [], mensal: [], anual: [] };
        }

        const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        // Common Aggregation Logic
        const dailyMap: Record<string, { income: number, expense: number }> = {};

        sortedTransactions.forEach(t => {
            const d = new Date(t.date);
            const key = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
            if (!dailyMap[key]) dailyMap[key] = { income: 0, expense: 0 };

            if (t.type === "income") dailyMap[key].income += t.amount;
            else dailyMap[key].expense += t.amount;
        });

        // 1. Acumulado Nodes
        const dailyNodes = Object.keys(dailyMap).sort().map(key => {
            const [y, m, d] = key.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);
            const net = dailyMap[key].income - dailyMap[key].expense;
            return {
                dateStr: key,
                displayDate: formatShortDate(dateObj.toDateString()),
                change: net
            };
        });

        let runningTotal = 0;
        const acumuladoData = dailyNodes.map(node => {
            runningTotal += node.change;
            return {
                data: node.dateStr,
                displayDate: node.displayDate,
                saldo: runningTotal,
                change: node.change
            };
        });

        // 2. Mensal (NET RESULT -> Distinct from Gross Flow)
        const mensalData = Object.keys(dailyMap).sort().map(key => {
            const [y, m, d] = key.split('-').map(Number);
            const vals = dailyMap[key];
            const net = vals.income - vals.expense;
            return {
                dateStr: key,
                displayDate: formatShortDate(new Date(y, m - 1, d).toDateString()),
                resultado: net, // Single value per day
                receita: vals.income,
                despesa: vals.expense
            };
        });

        // 3. Anual
        const anualData: Record<number, { mes: string; receitaAtual: number; despesaAtual: number; receitaAnterior: number; despesaAnterior: number }> = {}
        const currentYear = new Date().getFullYear()

        for (let i = 0; i < 12; i++) {
            const d = new Date(currentYear, i, 1);
            anualData[i] = {
                mes: d.toLocaleString("pt-BR", { month: "short" }),
                receitaAtual: 0, despesaAtual: 0, receitaAnterior: 0, despesaAnterior: 0
            }
        }
        sortedTransactions.forEach((t) => {
            const d = new Date(t.date)
            const monthIndex = d.getMonth();
            const year = d.getFullYear()
            if (year === currentYear) {
                anualData[monthIndex].receitaAtual += (t.type === "income" ? t.amount : 0)
                anualData[monthIndex].despesaAtual += (t.type === "expense" ? t.amount : 0)
            } else if (year === currentYear - 1) {
                anualData[monthIndex].receitaAnterior += (t.type === "income" ? t.amount : 0)
                anualData[monthIndex].despesaAnterior += (t.type === "expense" ? t.amount : 0)
            }
        })

        return {
            acumulado: acumuladoData,
            mensal: mensalData,
            anual: Object.values(anualData),
        }
    }, [transactions])

    // Calculate gradient offset based on 0 value for Area Chart
    const gradientOffset = () => {
        const data = processedData.acumulado;
        if (data.length <= 0) return 0;
        const dataMax = Math.max(...data.map((i) => i.saldo));
        const dataMin = Math.min(...data.map((i) => i.saldo));
        if (dataMax <= 0) return 0;
        if (dataMin >= 0) return 1;
        return dataMax / (dataMax - dataMin);
    };
    const off = gradientOffset();

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            let displayLabel = label;
            if (typeof label === 'string' && (label.includes('T') || label.includes('-'))) {
                try { displayLabel = formatDate(label); } catch (e) { }
            } else { displayLabel = label; }

            return (
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-400 mb-2">{displayLabel}</p>
                    <div className="space-y-1">
                        {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill || entry.stroke }} />
                                    <span className="text-sm text-gray-600 dark:text-gray-300 font-medium capitalize">{entry.name}</span>
                                </div>
                                <span className={`text-sm font-bold ${entry.value < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                    {formatCurrency(entry.value)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )
        }
        return null
    }

    const renderChart = (height: number) => {
        if (processedData.acumulado.length === 0 && processedData.mensal.length === 0 && processedData.anual.length === 0) {
            return <div className="h-full flex items-center justify-center text-gray-400">Sem dados para este período</div>;
        }

        // 1. COMPARATIVO ANUAL -> LINE CHART
        if (selectedChartType === "anual") {
            return (
                <ResponsiveContainer width="100%" height={height}>
                    <LineChart data={processedData.anual} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:opacity-10" />
                        <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} dy={10} />
                        <YAxis tickFormatter={(val) => `R$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                        <Line type="monotone" dataKey="receitaAtual" stroke="#10b981" strokeWidth={2} dot={false} name="Receita Atual" />
                        <Line type="monotone" dataKey="despesaAtual" stroke="#ef4444" strokeWidth={2} dot={false} name="Despesa Atual" />
                    </LineChart>
                </ResponsiveContainer>
            )
        }

        // 2. MENSAL (RESULTADO LÍQUIDO) -> POSITIVE/NEGATIVE BAR CHART
        // Distinct from "Side-by-See" bars. This is a single "Net" bar.
        if (selectedChartType === "mensal") {
            return (
                <ResponsiveContainer width="100%" height={height}>
                    <BarChart data={processedData.mensal} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:opacity-10" />
                        <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} dy={10} />
                        <YAxis tickFormatter={(val) => `R$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                        <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />

                        <Bar dataKey="resultado" name="Resultado Líquido" radius={[4, 4, 0, 0]} maxBarSize={50}>
                            {processedData.mensal.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.resultado >= 0 ? '#10b981' : '#ef4444'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )
        }

        // 3. EVOLUÇÃO (ACUMULADO) -> SMOOTH GRADIENT AREA CHART
        return (
            <ResponsiveContainer width="100%" height={height}>
                <AreaChart data={processedData.acumulado} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset={off} stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset={off} stopColor="#ef4444" stopOpacity={0.4} />
                        </linearGradient>
                        <linearGradient id="splitColorStroke" x1="0" y1="0" x2="0" y2="1">
                            <stop offset={off} stopColor="#10b981" stopOpacity={1} />
                            <stop offset={off} stopColor="#ef4444" stopOpacity={1} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:opacity-10" />
                    <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} dy={10} />
                    <YAxis tickFormatter={(val) => `R$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />

                    <Area
                        type="monotone"
                        dataKey="saldo"
                        stroke="url(#splitColorStroke)"
                        fill="url(#splitColor)"
                        strokeWidth={3}
                        name="Saldo Acumulado"
                        dot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: "#6b7280" }}
                        activeDot={{ r: 6 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        )
    }

    const renderFilters = () => (
        <div className="flex justify-center md:justify-end space-x-2 mt-4 md:mt-0 bg-gray-100 dark:bg-gray-900/50 p-1 rounded-lg w-fit mx-auto md:mx-0">
            {[
                { id: "acumulado", label: "Evolução", icon: TrendingUp },
                { id: "mensal", label: "Resultado", icon: BarChart2 }, // Renamed Label to differentiate
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
