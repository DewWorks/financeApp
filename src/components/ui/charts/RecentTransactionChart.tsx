import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/atoms/popover"
import { Info } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

interface RecentTransactionsChartProps {
    barChartData: Array<{
        name: string
        valor: number
        tipo: string
        tag: string
    }>
}

export function RecentTransactionsChart({ barChartData }: RecentTransactionsChartProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
        >
            <Card className="bg-white shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900">Últimas Transações</CardTitle>
                    <Popover>
                        <PopoverTrigger>
                            <Info className="h-5 w-5 text-gray-500" />
                        </PopoverTrigger>
                        <PopoverContent className="bg-white">
                            Este gráfico de barras exibe suas transações mais recentes, permitindo uma rápida comparação entre diferentes entradas e saídas.
                        </PopoverContent>
                    </Popover>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={barChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div className="bg-white p-2 border rounded shadow">
                                            <p>{data.name}</p>
                                            <p>Valor: R$ {data.valor.toFixed(2)}</p>
                                            <p>Tipo: {data.tipo}</p>
                                            <p>Categoria: {data.tag}</p>
                                        </div>
                                    );
                                }
                                return null;
                            }} />
                            <Legend />
                            <Bar dataKey="valor" fill="#8884d8" name="Valor" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </motion.div>
    )
}