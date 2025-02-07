"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/atoms/popover"
import { Info } from "lucide-react"
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
    Legend,
    TooltipProps,
} from "recharts"
import { formatDate, formatShortDate, formatCurrency } from "@/lib/utils"
import { Swiper, SwiperSlide } from "swiper/react"
import { Pagination } from "swiper/modules"
import "swiper/css"
import "swiper/css/pagination"
import { Button } from "@/components/ui/atoms/button"

interface TransactionData {
    data: string
    receita: number
    despesa: number
}

interface FlexibleIncomeExpensesChartProps {
    areaChartData: TransactionData[];
    onFetchAllTransactions: () => void;
}

type ChartType = "acumulado" | "mensal" | "anual"

const chartTypes: ChartType[] = ["acumulado", "mensal", "anual"]

const chartTitles: Record<ChartType, string> = {
    acumulado: "Evolução",
    mensal: "Mensal",
    anual: "Anual",
}

const chartDescriptions: Record<ChartType, string> = {
    acumulado: "Este gráfico mostra a evolução do saldo acumulado ao longo do tempo.",
    mensal: "Apresenta o fluxo de receitas e despesas mês a mês.",
    anual: "Compara receitas e despesas entre o ano atual e o ano anterior.",
}

export function IncomeVsExpensesChart({ areaChartData, onFetchAllTransactions }: FlexibleIncomeExpensesChartProps) {
    const [isMobile, setIsMobile] = useState(false)
    const [selectedChartType, setSelectedChartType] = useState<ChartType>("acumulado")

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
        if (type === "anual") {
            onFetchAllTransactions();
        }
    };

    const processedData = useMemo(() => {
        const sortedData = [...areaChartData].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())

        // Dados para o gráfico de Saldo Acumulado
        let cumulativeReceita = 0
        let cumulativeDespesa = 0
        const acumuladoData = sortedData.map((t) => {
            cumulativeReceita += t.receita
            cumulativeDespesa += t.despesa
            return {
                data: t.data,
                saldoAcumulado: cumulativeReceita - cumulativeDespesa,
                receitaAcumulada: cumulativeReceita,
                despesaAcumulada: cumulativeDespesa,
            }
        })

        // Dados para o gráfico de Fluxo Mensal
        const mensalData = sortedData.reduce((acc: Record<string, TransactionData>, curr) => {
            const monthYear = new Date(curr.data).toLocaleString("default", { month: "short", year: "numeric" })
            if (!acc[monthYear]) {
                acc[monthYear] = { data: monthYear, receita: 0, despesa: 0 }
            }
            acc[monthYear].receita += curr.receita
            acc[monthYear].despesa += curr.despesa
            return acc
        }, {})

        // Dados para o gráfico de Comparativo Anual
        const anualData: Record<
            string,
            { mes: string; receitaAtual: number; despesaAtual: number; receitaAnterior: number; despesaAnterior: number }
        > = {}
        const currentYear = new Date().getFullYear()
        sortedData.forEach((t) => {
            const transactionDate = new Date(t.data)
            const month = transactionDate.toLocaleString("default", { month: "short" })
            const year = transactionDate.getFullYear()
            if (!anualData[month]) {
                anualData[month] = { mes: month, receitaAtual: 0, despesaAtual: 0, receitaAnterior: 0, despesaAnterior: 0 }
            }
            if (year === currentYear) {
                anualData[month].receitaAtual += t.receita
                anualData[month].despesaAtual += t.despesa
            } else if (year === currentYear - 1) {
                anualData[month].receitaAnterior += t.receita
                anualData[month].despesaAnterior += t.despesa
            }
        })

        return {
            acumulado: acumuladoData,
            mensal: Object.values(mensalData),
            anual: Object.values(anualData),
        }
    }, [areaChartData])

    const renderChart = (height: number) => {
        switch (selectedChartType) {
            case "acumulado":
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <AreaChart data={processedData.acumulado} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="data" tickFormatter={formatShortDate} />
                            <YAxis tickFormatter={(value) => formatCurrency(value)} />
                            <Tooltip content={renderTooltipAcumulado} />
                            <Legend />
                            <Area type="monotone" dataKey="saldoAcumulado" stroke="#8884d8" fill="#8884d8" name="Saldo Acumulado" />
                        </AreaChart>
                    </ResponsiveContainer>
                )
            case "mensal":
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <AreaChart data={processedData.mensal} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="data" />
                            <YAxis tickFormatter={(value) => formatCurrency(value)} />
                            <Tooltip content={renderTooltipMensal} />
                            <Legend />
                            <Area type="monotone" dataKey="receita" stroke="#4CAF50" fill="#4CAF50" name="Receita" />
                            <Area type="monotone" dataKey="despesa" stroke="#F44336" fill="#F44336" name="Despesa" />
                        </AreaChart>
                    </ResponsiveContainer>
                )
            case "anual":
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <LineChart data={processedData.anual} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="mes" />
                            <YAxis tickFormatter={(value) => formatCurrency(value)} />
                            <Tooltip content={renderTooltipAnual} />
                            <Legend />
                            <Line type="monotone" dataKey="receitaAtual" stroke="#4CAF50" name="Receita (Atual)" />
                            <Line type="monotone" dataKey="despesaAtual" stroke="#F44336" name="Despesa (Atual)" />
                            <Line type="monotone" dataKey="receitaAnterior" stroke="#81C784" name="Receita (Anterior)" />
                            <Line type="monotone" dataKey="despesaAnterior" stroke="#E57373" name="Despesa (Anterior)" />
                        </LineChart>
                    </ResponsiveContainer>
                )
        }
    }

    const renderTooltipAcumulado = ({ active, payload, label }: TooltipProps<number, string>) => {
        if (active && payload && payload.length) {
            const saldoAcumulado = payload[0].value ?? 0; 
            return (
                <div className="bg-white p-2 border rounded shadow">
                    <p className="font-bold">{formatDate(String(label))}</p>
                    <p>Saldo Acumulado: {formatCurrency(saldoAcumulado)}</p>
                </div>
            );
        }
        return null;
    };

    const renderTooltipMensal = ({ active, payload, label }: TooltipProps<number, string>) => {
        if (active && payload && payload.length >= 2) {
            const receita = payload[0].value ?? 0;
            const despesa = payload[1].value ?? 0;
            return (
                <div className="bg-white p-2 border rounded shadow">
                    <p className="font-bold">{String(label)}</p>
                    <p>Receita: {formatCurrency(receita)}</p>
                    <p>Despesa: {formatCurrency(despesa)}</p>
                    <p>Saldo: {formatCurrency(receita - despesa)}</p>
                </div>
            );
        }
        return null;
    };

    const renderTooltipAnual = ({ active, payload, label }: TooltipProps<number, string>) => {
        if (active && payload && payload.length >= 4) {
            const receitaAtual = payload[0].value ?? 0;
            const despesaAtual = payload[1].value ?? 0;
            const receitaAnterior = payload[2].value ?? 0;
            const despesaAnterior = payload[3].value ?? 0;
            return (
                <div className="bg-white p-2 border rounded shadow">
                    <p className="font-bold">{String(label)}</p>
                    <p>Receita (Atual): {formatCurrency(receitaAtual)}</p>
                    <p>Despesa (Atual): {formatCurrency(despesaAtual)}</p>
                    <p>Receita (Anterior): {formatCurrency(receitaAnterior)}</p>
                    <p>Despesa (Anterior): {formatCurrency(despesaAnterior)}</p>
                </div>
            );
        }
        return null;
    };

    const renderSummary = () => {
        switch (selectedChartType) {
            case "acumulado":
                const lastValue = processedData.acumulado[processedData.acumulado.length - 1]
                return (
                    <div className="p-4 dark:text-white">
                        <h3 className="text-lg font-semibold mb-2">Resumo Acumulado</h3>
                        <ul className="list-disc pl-5">
                            <li>Saldo atual: {formatCurrency(lastValue.saldoAcumulado)}</li>
                            <li>Receita total: {formatCurrency(lastValue.receitaAcumulada)}</li>
                            <li>Despesa total: {formatCurrency(lastValue.despesaAcumulada)}</li>
                        </ul>
                    </div>
                )
            case "mensal":
                const totalReceitas = processedData.mensal.reduce((sum, item) => sum + item.receita, 0)
                const totalDespesas = processedData.mensal.reduce((sum, item) => sum + item.despesa, 0)
                return (
                    <div className="p-4 dark:text-white">
                        <h3 className="text-lg font-semibold mb-2">Resumo Mensal</h3>
                        <ul className="list-disc pl-5">
                            <li>Total de receitas: {formatCurrency(totalReceitas)}</li>
                            <li>Total de despesas: {formatCurrency(totalDespesas)}</li>
                            <li>Saldo: {formatCurrency(totalReceitas - totalDespesas)}</li>
                        </ul>
                    </div>
                )
            case "anual":
                const currentYear = new Date().getFullYear()
                const totalReceitaAtual = processedData.anual.reduce((sum, item) => sum + item.receitaAtual, 0)
                const totalDespesaAtual = processedData.anual.reduce((sum, item) => sum + item.despesaAtual, 0)
                const totalReceitaAnterior = processedData.anual.reduce((sum, item) => sum + item.receitaAnterior, 0)
                const totalDespesaAnterior = processedData.anual.reduce((sum, item) => sum + item.despesaAnterior, 0)
                return (
                    <div className="p-4 dark:text-white">
                        <h3 className="text-lg font-semibold mb-2">Resumo Anual</h3>
                        <ul className="list-disc pl-5">
                            <li>
                                {currentYear}: Receita {formatCurrency(totalReceitaAtual)}, Despesa {formatCurrency(totalDespesaAtual)}
                            </li>
                            <li>
                                {currentYear - 1}: Receita {formatCurrency(totalReceitaAnterior)}, Despesa{" "}
                                {formatCurrency(totalDespesaAnterior)}
                            </li>
                            <li>Variação Receita: {((totalReceitaAtual / totalReceitaAnterior - 1) * 100).toFixed(2)}%</li>
                            <li>Variação Despesa: {((totalDespesaAtual / totalDespesaAnterior - 1) * 100).toFixed(2)}%</li>
                        </ul>
                    </div>
                )
        }
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1 }}>
            <Card className="bg-white shadow-lg mb-8 dark:bg-gray-800">
                <CardHeader className="w-full flex flex-row items-center justify-between">
                    <CardTitle className="self-start text-lg font-semibold text-gray-900 dark:text-gray-100">Gráfico de Área Evolução</CardTitle>
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
