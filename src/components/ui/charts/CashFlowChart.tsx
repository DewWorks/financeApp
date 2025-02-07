"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/atoms/popover"
import { Info } from 'lucide-react'
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    TooltipProps,
} from "recharts"
import { formatDate, formatShortDate, formatCurrency } from "@/lib/utils"
import { Swiper, SwiperSlide } from "swiper/react"
import { Pagination } from "swiper/modules"
import "swiper/css"
import "swiper/css/pagination"
import { Button } from "@/components/ui/atoms/button"
import type { ITransaction } from "@/interfaces/ITransaction"

interface CashFlowChartProps {
    transactions: ITransaction[]
    colors: string[]
    onFetchAllTransactions: () => void;
}

type ChartType = "saldoAcumulado" | "fluxoMensal" | "comparativoAnual"

const chartTypes: ChartType[] = ["saldoAcumulado", "fluxoMensal", "comparativoAnual"]

const chartTitles: Record<ChartType, string> = {
    saldoAcumulado: "Evolução",
    fluxoMensal: "Mensal",
    comparativoAnual: "Anual",
}

const chartDescriptions: Record<ChartType, string> = {
    saldoAcumulado: "Este gráfico mostra a evolução do seu saldo ao longo do tempo, permitindo visualizar o crescimento ou declínio do seu patrimônio financeiro.",
    fluxoMensal: "Apresenta o fluxo de receitas e despesas mês a mês, ajudando a identificar padrões sazonais e meses que requerem mais atenção.",
    comparativoAnual: "Compara o saldo acumulado mês a mês entre o ano atual e o ano anterior, facilitando a análise do progresso financeiro ano a ano.",
}

export function CashFlowChart({ transactions, colors, onFetchAllTransactions }: CashFlowChartProps) {
    const [isMobile, setIsMobile] = useState(false)
    const [selectedChartType, setSelectedChartType] = useState<ChartType>("saldoAcumulado")

    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }
        checkIsMobile()
        window.addEventListener("resize", checkIsMobile)
        return () => window.removeEventListener("resize", checkIsMobile)
    }, [])

    const handleChartTypeChange = async (type: ChartType) => {
        setSelectedChartType(type);
        if (type === "comparativoAnual") {
            onFetchAllTransactions();
        }
    };

    const processedData = useMemo(() => {
        const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        // Dados para o gráfico de Saldo Acumulado
        let cumulativeValue = 0
        const saldoAcumuladoData = sortedTransactions.map(t => {
            cumulativeValue += t.type === "income" ? t.amount : -t.amount
            return { data: t.date, saldo: cumulativeValue }
        })

        // Dados para o gráfico de Fluxo Mensal
        const fluxoMensalData: Record<string, { mes: string, receitas: number, despesas: number }> = {}
        sortedTransactions.forEach(t => {
            const monthYear = new Date(t.date).toLocaleString('default', { month: 'short', year: 'numeric' })
            if (!fluxoMensalData[monthYear]) {
                fluxoMensalData[monthYear] = { mes: monthYear, receitas: 0, despesas: 0 }
            }
            if (t.type === "income") {
                fluxoMensalData[monthYear].receitas += t.amount
            } else {
                fluxoMensalData[monthYear].despesas += t.amount
            }
        })

        // Dados para o gráfico de Comparativo Anual
        const comparativoAnualData: Record<string, { mes: string, anoAtual: number, anoAnterior: number }> = {}
        const currentYear = new Date().getFullYear()
        sortedTransactions.forEach(t => {
            const transactionDate = new Date(t.date)
            const month = transactionDate.toLocaleString('default', { month: 'short' })
            const year = transactionDate.getFullYear()
            if (!comparativoAnualData[month]) {
                comparativoAnualData[month] = { mes: month, anoAtual: 0, anoAnterior: 0 }
            }
            const value = t.type === "income" ? t.amount : -t.amount
            if (year === currentYear) {
                comparativoAnualData[month].anoAtual += value
            } else if (year === currentYear - 1) {
                comparativoAnualData[month].anoAnterior += value
            }
        })

        return {
            saldoAcumulado: saldoAcumuladoData,
            fluxoMensal: Object.values(fluxoMensalData),
            comparativoAnual: Object.values(comparativoAnualData),
        }
    }, [transactions])

    const renderChart = (height: number) => {
        switch (selectedChartType) {
            case "saldoAcumulado":
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <LineChart data={processedData.saldoAcumulado} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="data" tickFormatter={formatShortDate} />
                            <YAxis tickFormatter={(value) => formatCurrency(value)} />
                            <Tooltip content={renderTooltipSaldoAcumulado} />
                            <Legend />
                            <Line type="monotone" dataKey="saldo" stroke={colors[0]} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                )
            case "fluxoMensal":
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <LineChart data={processedData.fluxoMensal} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="mes" />
                            <YAxis tickFormatter={(value) => formatCurrency(value)} />
                            <Tooltip content={renderTooltipFluxoMensal} />
                            <Legend />
                            <Line type="monotone" dataKey="receitas" stroke={colors[1]} />
                            <Line type="monotone" dataKey="despesas" stroke={colors[2]} />
                        </LineChart>
                    </ResponsiveContainer>
                )
            case "comparativoAnual":
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <LineChart data={processedData.comparativoAnual} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="mes" />
                            <YAxis tickFormatter={(value) => formatCurrency(value)} />
                            <Tooltip content={renderTooltipComparativoAnual} />
                            <Legend />
                            <Line type="monotone" dataKey="anoAtual" stroke={colors[0]} name="Ano Atual" />
                            <Line type="monotone" dataKey="anoAnterior" stroke={colors[1]} name="Ano Anterior" />
                        </LineChart>
                    </ResponsiveContainer>
                )
        }
    }

    const renderTooltipSaldoAcumulado = ({ active, payload, label }: TooltipProps<number, string>) => {
        if (active && payload && payload.length > 0) {
            const saldo = payload[0].value ?? 0; // Garante que sempre tenha um número
            return (
                <div className="bg-white p-2 border rounded shadow">
                    <p className="font-bold">{formatDate(String(label))}</p>
                    <p>Saldo: {formatCurrency(saldo)}</p>
                </div>
            );
        }
        return null;
    };

    const renderTooltipFluxoMensal = ({ active, payload, label }: TooltipProps<number, string>) => {
        if (active && payload && payload.length >= 2) {
            const receita = payload[0].value ?? 0;
            const despesa = payload[1].value ?? 0;
            return (
                <div className="bg-white p-2 border rounded shadow">
                    <p className="font-bold">{String(label)}</p>
                    <p>Receitas: {formatCurrency(receita)}</p>
                    <p>Despesas: {formatCurrency(despesa)}</p>
                    <p>Saldo: {formatCurrency(receita - despesa)}</p>
                </div>
            );
        }
        return null;
    };

    const renderTooltipComparativoAnual = ({ active, payload, label }: TooltipProps<number, string>) => {
        if (active && payload && payload.length >= 2) {
            const anoAtual = payload[0].value ?? 0;
            const anoAnterior = payload[1].value ?? 0;
            return (
                <div className="bg-white p-2 border rounded shadow">
                    <p className="font-bold">{String(label)}</p>
                    <p>Ano Atual: {formatCurrency(anoAtual)}</p>
                    <p>Ano Anterior: {formatCurrency(anoAnterior)}</p>
                    <p>Diferença: {formatCurrency(anoAtual - anoAnterior)}</p>
                </div>
            );
        }
        return null;
    };

    const renderSummary = () => {
        switch (selectedChartType) {
            case "saldoAcumulado":
                const lastValue = processedData.saldoAcumulado[processedData.saldoAcumulado.length - 1]?.saldo || 0
                const initialValue = processedData.saldoAcumulado[0]?.saldo || 0
                return (
                    <div className="p-4 dark:text-white">
                        <h3 className="text-lg font-semibold mb-2">Evolução</h3>
                        <ul className="list-disc pl-5">
                            <li>Saldo inicial: {formatCurrency(initialValue)}</li>
                            <li>Saldo atual: {formatCurrency(lastValue)}</li>
                            <li>Variação total: {formatCurrency(lastValue - initialValue)}</li>
                            <li>Período analisado: {processedData.saldoAcumulado.length} dias</li>
                        </ul>
                    </div>
                )
            case "fluxoMensal":
                const totalReceitas = processedData.fluxoMensal.reduce((sum, item) => sum + item.receitas, 0)
                const totalDespesas = processedData.fluxoMensal.reduce((sum, item) => sum + item.despesas, 0)
                return (
                    <div className="p-4 dark:text-white">
                        <h3 className="text-lg font-semibold mb-2">Resumo do Fluxo de Caixa Mensal</h3>
                        <ul className="list-disc pl-5">
                            <li>Total de receitas: {formatCurrency(totalReceitas)}</li>
                            <li>Total de despesas: {formatCurrency(totalDespesas)}</li>
                            <li>Saldo: {formatCurrency(totalReceitas - totalDespesas)}</li>
                            <li>Meses analisados: {processedData.fluxoMensal.length}</li>
                        </ul>
                    </div>
                )
            case "comparativoAnual":
                const totalAnoAtual = processedData.comparativoAnual.reduce((sum, item) => sum + item.anoAtual, 0)
                const totalAnoAnterior = processedData.comparativoAnual.reduce((sum, item) => sum + item.anoAnterior, 0)
                return (
                    <div className="p-4 dark:text-white">
                        <h3 className="text-lg font-semibold mb-2">Anual</h3>
                        <ul className="list-disc pl-5">
                            <li>Total: {formatCurrency(totalAnoAtual)}</li>
                            <li>Total ano anterior: {formatCurrency(totalAnoAnterior)}</li>
                            <li>Diferença: {formatCurrency(totalAnoAtual - totalAnoAnterior)}</li>
                            <li>Variação: {((totalAnoAtual / totalAnoAnterior - 1) * 100).toFixed(2)}%</li>
                        </ul>
                    </div>
                )
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
        >
            <Card className="bg-white shadow-lg mb-8 dark:bg-gray-800">
                    <CardHeader className="w-full flex flex-row items-center justify-between">
                        <CardTitle className="self-start text-lg font-semibold text-gray-900 dark:text-gray-100">Gráfico de Progressão</CardTitle>
                        <Popover>
                            <PopoverTrigger>
                                <Info className="h-5 w-5 text-gray-500" />
                            </PopoverTrigger>
                            <PopoverContent className="bg-white dark:bg-gray-800 dark:text-gray-100">
                                {chartDescriptions[selectedChartType]}
                            </PopoverContent>
                        </Popover>
                    </CardHeader>
                <CardHeader className="w-full flex flex-col items-center md:justify-around sm:flex-row">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {chartTitles[selectedChartType]}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                        {chartTypes.map((type) => (
                            <Button
                                className={`text-white ${selectedChartType === type ? "bg-blue-600" : "bg-blue-400"}`}
                                key={type}
                                variant={selectedChartType === type ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleChartTypeChange(type)}
                            >
                                {chartTitles[type]}
                            </Button>
                        ))}
                    </div>
                </CardHeader>
                <CardContent>
                    {isMobile ? (
                        <Swiper
                            modules={[Pagination]}
                            spaceBetween={20}
                            slidesPerView={1}
                            pagination={{ clickable: true }}
                            className="w-full h-[300px]"
                        >
                            <SwiperSlide>{renderChart(250)}</SwiperSlide>
                            <SwiperSlide>{renderSummary()}</SwiperSlide>
                        </Swiper>
                    ) : (
                        <div className="space-y-4">
                            {renderChart(300)}
                            {renderSummary()}
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    )
}