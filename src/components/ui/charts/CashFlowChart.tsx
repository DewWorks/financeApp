import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/atoms/popover";
import { Info } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { formatDate, formatShortDate } from "@/lib/utils";

interface CashFlowChartProps {
    lineChartData: Array<{
        data: string;
        valor: number;
        tag: string;
    }>;
}

// Função para definir as cores da linha (subindo = verde, descendo = vermelho)
const getSegmentedData = (data: CashFlowChartProps["lineChartData"]) => {
    return data.map((point, index) => {
        if (index === 0) return { ...point, color: "#8884d8" };
        const previous = data[index - 1];
        return {
            ...point,
            color: point.valor >= previous.valor ? "#8884d8" : "#ff3300",
        };
    });
};

export function CashFlowChart({ lineChartData }: CashFlowChartProps) {
    const segmentedData = getSegmentedData(lineChartData);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
        >
            <Card className="bg-white shadow-lg mb-8 dark:bg-gray-800">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Fluxo de Caixa
                    </CardTitle>
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
                        <LineChart data={segmentedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <defs>
                                <linearGradient id="fluxoGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#8884d8" />
                                    <stop offset="100%" stopColor="#ff3366" />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="data" tickFormatter={formatShortDate} label={{ value: "Datas", position: "insideBottom", offset: -5 }} />
                            <YAxis label={{ value: "Valores", angle: -90, position: "insideLeft" }} />
                            <Legend wrapperStyle={{ display: "none" }} />

                            <Tooltip
                                labelFormatter={formatDate}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-white text-popover-foreground p-2 border rounded shadow">
                                                <p className="font-bold">{formatDate(data.data)}</p>
                                                <p>Valor: R$ {Math.abs(data.valor).toFixed(2)}</p>
                                                <p>Tipo: {data.valor >= 0 ? "Receita" : "Despesa"}</p>
                                                <p>Categoria: {data.tag}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Legend />

                            {/* Linha de sombra para criar efeito 3D */}
                            <Line
                                type="monotone"
                                dataKey="valor"
                                stroke="rgba(0, 0, 0, 0.2)"
                                strokeWidth={6} // Linha mais grossa atrás para efeito de profundidade
                                dot={false}
                            />

                            {/* Linha principal com gradiente 3D */}
                            <Line
                                type="monotone"
                                dataKey="valor"
                                stroke="url(#fluxoGradient)"
                                strokeWidth={3}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </motion.div>
    );
}
