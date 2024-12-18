import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/atoms/popover"
import { Info } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

interface CashFlowChartProps {
    lineChartData: Array<{
        data: string
        valor: number
        tag: string
    }>
}

export function CashFlowChart({ lineChartData }: CashFlowChartProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
        >
            <Card className="bg-white shadow-lg mb-8">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900">Fluxo de Caixa</CardTitle>
                    <Popover>
                        <PopoverTrigger>
                            <Info className="h-5 w-5 text-gray-500" />
                        </PopoverTrigger>
                        <PopoverContent className="bg-white">
                            Este gráfico de linha mostra a evolução do seu fluxo de caixa ao longo do tempo, ajudando a identificar tendências e padrões em suas finanças.
                        </PopoverContent>
                    </Popover>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={lineChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="data" />
                            <YAxis />
                            <Tooltip content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div className="bg-white p-2 border rounded shadow">
                                            <p>Data: {data.data}</p>
                                            <p>Valor: R$ {Math.abs(data.valor).toFixed(2)}</p>
                                            <p>Tipo: {data.valor >= 0 ? 'Receita' : 'Despesa'}</p>
                                            <p>Categoria: {data.tag}</p>
                                        </div>
                                    );
                                }
                                return null;
                            }} />
                            <Legend />
                            <Line type="monotone" dataKey="valor" stroke="#8884d8" name="Fluxo de Caixa" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </motion.div>
    )
}