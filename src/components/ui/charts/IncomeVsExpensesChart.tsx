import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/atoms/popover"
import { Info } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import {formatDate, formatShortDate } from '@/lib/utils'

interface IncomeVsExpensesChartProps {
    areaChartData: Array<{
        data: string
        receita: number
        despesa: number
    }>
}

export function IncomeVsExpensesChart({ areaChartData }: IncomeVsExpensesChartProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
        >
            <Card className="bg-white shadow-lg mb-8 dark:bg-gray-800">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Receitas vs Despesas</CardTitle>
                    <Popover>
                        <PopoverTrigger>
                            <Info className="h-5 w-5 text-gray-500" />
                        </PopoverTrigger>
                        <PopoverContent className="bg-white">
                            Este gráfico de área empilhada compara suas receitas e despesas ao longo do tempo, permitindo visualizar facilmente a diferença entre entradas e saídas.
                        </PopoverContent>
                    </Popover>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={areaChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="data" tickFormatter={formatShortDate} label={{ value: "Datas", position: "insideBottom", offset: -5 }} />
                            <YAxis label={{ value: "Valores", angle: -90, position: "insideLeft" }} />
                            <Tooltip
                                labelFormatter={(dateString) => formatDate(dateString)}
                                formatter={(value: number) => [`R$ ${value.toFixed(2)}`, ""]}
                            />
                            <Legend />
                            <Area type="monotone" dataKey="receita" stroke="#ff3300" fill="#ff3300" name="Receita" />
                            <Area type="monotone" dataKey="despesa" stroke="#8884d8" fill="#8884d8" name="Despesa" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </motion.div>
    )
}