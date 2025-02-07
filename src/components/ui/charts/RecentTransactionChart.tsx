import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/atoms/popover";
import { Info } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from "recharts";
import { Button } from "@/components/ui/atoms/button";
import { ITransaction } from "@/interfaces/ITransaction";

// Tipagem dos dados para o gráfico
interface TransactionChartData {
    description: string;
    amount: number;
}

interface RecentTransactionsChartProps {
    transactions: ITransaction[];
    colors: string[];
}

type FilterType = "ultimas" | "categoria" | "tipo";

export function RecentTransactionsChart({ transactions, colors }: RecentTransactionsChartProps) {
    const [filter, setFilter] = useState<FilterType>("ultimas");

    const filteredData: TransactionChartData[] = useMemo(() => {
        switch (filter) {
            case "ultimas":
                return transactions
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 5)
                    .map((t) => ({
                        description: t.description,
                        amount: t.amount,
                    }));
            case "categoria":
                const categoryData: Record<string, number> = {};
                transactions.forEach((t) => {
                    categoryData[t.tag] = (categoryData[t.tag] || 0) + t.amount;
                });
                return Object.entries(categoryData).map(([description, amount]) => ({ description, amount }));
            case "tipo":
                const typeData: Record<string, number> = {};
                transactions.forEach((t) => {
                    typeData[t.type] = (typeData[t.type] || 0) + t.amount;
                });

                return Object.entries(typeData).map(([key, amount]) => ({
                    description: key === "income" ? "Receita" : "Despesa", // Converte income/expense para Receita/Despesa
                    amount,
                }));
            default:
                return [];
        }
    }, [transactions, filter]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
        >
            <Card className="bg-white dark:bg-gray-800 shadow-lg transition-colors duration-200">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Gráfico de Transações
                    </CardTitle>
                    <Popover>
                        <PopoverTrigger>
                            <Info className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </PopoverTrigger>
                        <PopoverContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                            Este gráfico exibe suas transações recentes. Use os botões para alternar entre os filtros: últimas transações, categorias e tipos.
                        </PopoverContent>
                    </Popover>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center space-x-4 mb-4">
                        <Button
                            className={filter === "ultimas" ? "bg-blue-600 text-white" : "bg-gray-400 text-white"}
                            onClick={() => setFilter("ultimas")}
                        >
                            Últimas
                        </Button>
                        <Button
                            className={filter === "categoria" ? "bg-blue-600 text-white" : "bg-gray-400 text-white"}
                            onClick={() => setFilter("categoria")}
                        >
                            Categorias
                        </Button>
                        <Button
                            className={filter === "tipo" ? "bg-blue-600 text-white" : "bg-gray-400 text-white"}
                            onClick={() => setFilter("tipo")}
                        >
                            Tipos
                        </Button>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={filteredData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="description" />
                            <YAxis />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-white dark:bg-gray-800 p-2 border rounded shadow text-gray-900 dark:text-gray-100">
                                                <p className="font-bold">{data.description}</p>
                                                <p>Valor: R$ {data.amount.toFixed(2)}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Legend formatter={(value) => <span className="text-gray-900 dark:text-gray-100">{value}</span>} />
                            <Bar dataKey="amount" name="Valor">
                                {filteredData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                ))}
                        </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </motion.div>
    );
}
