"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/atoms/popover"
import { Info } from "lucide-react"
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts"
import type { ITransaction } from "@/interfaces/ITransaction"
import { Swiper, SwiperSlide } from "swiper/react"
import { Pagination } from "swiper/modules"
import "swiper/css"
import "swiper/css/pagination"

interface DistributionChartProps {
    transactions: ITransaction[]
    colors: string[]
}

interface ChartData {
    name: string
    value: number
}

export function DistributionChart({ transactions, colors }: DistributionChartProps) {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }
        checkIsMobile()
        window.addEventListener("resize", checkIsMobile)
        return () => window.removeEventListener("resize", checkIsMobile)
    }, [])

    const prepareChartData = (data: ChartData[]) => {
        return data.sort((a, b) => b.value - a.value).slice(0, 5)
    }

    const incomeVsExpenseData = [
        { name: "Receitas", value: transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0) },
        { name: "Despesas", value: transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0) },
    ]

    const tagData = transactions.reduce(
        (acc, t) => {
            if (!acc[t.tag]) acc[t.tag] = 0
            acc[t.tag] += t.amount
            return acc
        },
        {} as Record<string, number>,
    )

    const tagChartData = prepareChartData(Object.entries(tagData).map(([name, value]) => ({ name, value })))

    const monthData = transactions.reduce(
        (acc, t) => {
            const month = new Date(t.date).toLocaleString("default", { month: "long" })
            if (!acc[month]) acc[month] = 0
            acc[month] += t.amount
            return acc
        },
        {} as Record<string, number>,
    )

    const monthChartData = prepareChartData(Object.entries(monthData).map(([name, value]) => ({ name, value })))

    const renderPieChart = (data: ChartData[], title: string, info: string) => (
        <Card className="bg-white shadow-lg dark:bg-gray-800 h-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</CardTitle>
                <Popover>
                    <PopoverTrigger>
                        <Info className="h-5 w-5 text-gray-500" />
                    </PopoverTrigger>
                    <PopoverContent className="bg-white">{info}</PopoverContent>
                </Popover>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )

    const charts = [
        {
            data: incomeVsExpenseData,
            title: "Receitas vs Despesas",
            info: "Este gráfico mostra a proporção entre suas receitas e despesas totais, permitindo uma visualização rápida do equilíbrio financeiro.",
        },
        {
            data: tagChartData,
            title: "Top 5 Categorias",
            info: "Este gráfico mostra as 5 principais categorias de suas transações, permitindo identificar as áreas de maior gasto ou receita.",
        },
        {
            data: monthChartData,
            title: "Top 5 Meses",
            info: "Este gráfico mostra os 5 meses com maior volume de transações, permitindo visualizar tendências sazonais em suas finanças.",
        },
    ]

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="w-full"
        >
            {isMobile ? (
                <Swiper
                    modules={[Pagination]}
                    spaceBetween={20}
                    slidesPerView={1}
                    pagination={{ clickable: true }}
                    className="w-full"
                >
                    {charts.map((chart, index) => (
                        <SwiperSlide key={index}>{renderPieChart(chart.data, chart.title, chart.info)}</SwiperSlide>
                    ))}
                </Swiper>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {charts.map((chart, index) => (
                        <div key={index}>{renderPieChart(chart.data, chart.title, chart.info)}</div>
                    ))}
                </div>
            )}
        </motion.div>
    )
}

