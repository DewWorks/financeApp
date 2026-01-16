"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/atoms/popover"
import { Info } from "lucide-react"
import { ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"
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
    const [activeIndex, setActiveIndex] = useState<number | null>(null)
    const [hoveredData, setHoveredData] = useState<any>(null);

    useEffect(() => {
        const checkIsMobile = () => setIsMobile(window.innerWidth < 768)
        checkIsMobile()
        window.addEventListener("resize", checkIsMobile)
        return () => window.removeEventListener("resize", checkIsMobile)
    }, [])

    const prepareChartData = (data: ChartData[]) => {
        return data.sort((a, b) => b.value - a.value).slice(0, 5)
    }

    // Process Data
    const incomeVsExpenseData = [
        { name: "Receitas", value: transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0) },
        { name: "Despesas", value: transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0) },
    ]

    const tagData = transactions.reduce((acc, t) => {
        if (!acc[t.tag]) acc[t.tag] = 0
        acc[t.tag] += t.amount
        return acc
    }, {} as Record<string, number>)

    const tagChartData = prepareChartData(Object.entries(tagData).map(([name, value]) => ({ name, value })))

    const monthData = transactions.reduce((acc, t) => {
        const month = new Date(t.date).toLocaleString("pt-BR", { month: "long" })
        if (!acc[month]) acc[month] = 0
        acc[month] += t.amount
        return acc
    }, {} as Record<string, number>)

    const monthChartData = prepareChartData(Object.entries(monthData).map(([name, value]) => ({ name, value })))

    const renderPieChart = (data: ChartData[], title: string, info: string, totalLabel: string) => {
        const totalValue = data.reduce((sum, item) => sum + item.value, 0)

        // Add percentage to data for Legend usage
        const dataWithPercent = data.map(item => ({
            ...item,
            percent: totalValue > 0 ? item.value / totalValue : 0
        }));

        // Determine what to show in the center
        const centerLabel = activeIndex !== null && hoveredData ? hoveredData.name : "Total";
        const centerValue = activeIndex !== null && hoveredData
            ? hoveredData.value
            : totalValue;
        const centerPercent = activeIndex !== null && hoveredData
            ? `${(hoveredData.percent * 100).toFixed(1)}%`
            : null;

        return (
            <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300 border-none ring-1 ring-gray-200 dark:ring-gray-700 h-full flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
                    <div>
                        <CardTitle className="text-base font-bold text-gray-900 dark:text-gray-100">{title}</CardTitle>
                        <p className="text-xs text-gray-400 mt-1">{totalLabel}</p>
                    </div>
                    <Popover>
                        <PopoverTrigger>
                            <div className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                                <Info className="h-4 w-4 text-gray-400" />
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm max-w-xs p-4">
                            {info}
                        </PopoverContent>
                    </Popover>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center pt-0 min-h-[300px]">
                    <div className="relative w-full h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={dataWithPercent}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={85}
                                    paddingAngle={5}
                                    dataKey="value"
                                    onMouseEnter={(_, index) => {
                                        setActiveIndex(index);
                                        setHoveredData(dataWithPercent[index]);
                                    }}
                                    onMouseLeave={() => {
                                        setActiveIndex(null);
                                        setHoveredData(null);
                                    }}
                                >
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={colors[index % colors.length]}
                                            stroke={activeIndex === index ? '#fff' : 'none'}
                                            strokeWidth={2}
                                            className="transition-all duration-300 outline-none cursor-pointer"
                                            style={{
                                                filter: activeIndex === index ? 'drop-shadow(0px 4px 8px rgba(0,0,0,0.2))' : 'none',
                                                opacity: activeIndex === null || activeIndex === index ? 1 : 0.6
                                            }}
                                        />
                                    ))}
                                </Pie>
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    formatter={(value, entry: any) => {
                                        const percent = (entry.payload.percent * 100).toFixed(0);
                                        return <span className={`text-xs font-medium ml-1 transition-colors ${activeIndex === null || (hoveredData && hoveredData.name === value) ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-400'}`}>{value} ({percent}%)</span>
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Dynamic Center Text Overlay */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[60%] text-center pointer-events-none z-0">
                            <motion.div
                                key={centerLabel} // Animate changes
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
                            >
                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">
                                    {centerLabel}
                                </p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">
                                    {new Intl.NumberFormat('pt-BR', { notation: "compact", maximumFractionDigits: 1 }).format(centerValue)}
                                </p>
                                {centerPercent && (
                                    <p className="text-xs font-bold text-blue-500 mt-0.5">
                                        {centerPercent}
                                    </p>
                                )}
                            </motion.div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const charts = [
        {
            data: incomeVsExpenseData,
            title: "Receitas vs Despesas",
            totalLabel: "Balanço Geral",
            info: "Proporção entre o que entrou e o que saiu. Ideal para ver se você está gastando mais do que ganha.",
        },
        {
            data: tagChartData,
            title: "Top 5 Categorias",
            totalLabel: "Principais Gastos",
            info: "As 5 categorias onde você mais movimenta dinheiro. Ajuda a identificar gargalos no orçamento.",
        },
        {
            data: monthChartData,
            title: "Top 5 Meses",
            totalLabel: "Sazonalidade",
            info: "Os meses com maior volume financeiro. Útil para entender épocas de maior custo ou lucro.",
        },
    ]

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full"
        >
            {isMobile ? (
                <Swiper
                    modules={[Pagination]}
                    spaceBetween={16}
                    slidesPerView={1.05}
                    centeredSlides={true}
                    pagination={{ clickable: true, dynamicBullets: true }}
                    className="w-full pb-8"
                >
                    {charts.map((chart, index) => (
                        <SwiperSlide key={index}>
                            {renderPieChart(chart.data, chart.title, chart.info, chart.totalLabel)}
                        </SwiperSlide>
                    ))}
                </Swiper>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {charts.map((chart, index) => (
                        <div key={index} className="h-full">{renderPieChart(chart.data, chart.title, chart.info, chart.totalLabel)}</div>
                    ))}
                </div>
            )}
        </motion.div>
    )
}
