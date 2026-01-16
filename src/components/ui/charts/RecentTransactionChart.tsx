import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/atoms/popover";
import { Info, BarChart3, Tag, DollarSign } from "lucide-react"; // Icons for filter buttons
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from "recharts";
import { Button } from "@/components/ui/atoms/button";
import { ITransaction } from "@/interfaces/ITransaction";

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
                return Object.entries(categoryData)
                    .sort(([, a], [, b]) => b - a) // Sort by amount desc
                    .slice(0, 7) // Top 7 categories
                    .map(([description, amount]) => ({ description, amount }));
            case "tipo":
                const typeData: Record<string, number> = {};
                transactions.forEach((t) => {
                    typeData[t.type] = (typeData[t.type] || 0) + t.amount;
                });
                return Object.entries(typeData).map(([key, amount]) => ({
                    description: key === "income" ? "Receita" : "Despesa",
                    amount,
                }));
            default:
                return [];
        }
    }, [transactions, filter]);

    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700">
                    <p className="font-bold text-gray-900 dark:text-white mb-1">{label}</p>
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        R$ {payload[0].value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
            )
        }
        return null
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="bg-white dark:bg-gray-800 shadow-sm border-none ring-1 ring-gray-200 dark:ring-gray-700">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                        <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">Análise Comparativa</CardTitle>
                        <p className="text-sm text-gray-500">Visualize seus dados por diferentes perspectivas</p>
                    </div>

                    <Popover>
                        <PopoverTrigger>
                            <div className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                                <Info className="h-5 w-5 text-gray-400" />
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="bg-white dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-300">
                            Use os botões para alternar a visualização. "Últimas" mostra as transações mais recentes, "Categorias" agrupa seus gastos e "Tipos" compara Receita vs Despesa.
                        </PopoverContent>
                    </Popover>
                </CardHeader>
                <CardContent>
                    {/* Modern Pill Filters */}
                    <div className="flex justify-start space-x-2 mb-6 bg-gray-100 dark:bg-gray-900/50 p-1 rounded-lg w-fit">
                        {[
                            { id: "ultimas", label: "Últimas", icon: BarChart3 },
                            { id: "categoria", label: "Categorias", icon: Tag },
                            { id: "tipo", label: "Tipo", icon: DollarSign }
                        ].map((btn) => (
                            <button
                                key={btn.id}
                                onClick={() => setFilter(btn.id as FilterType)}
                                className={`
                                    flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                                    ${filter === btn.id
                                        ? "bg-white dark:bg-gray-800 text-blue-600 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-800/50"}
                                `}
                            >
                                <btn.icon className="w-4 h-4" />
                                {btn.label}
                            </button>
                        ))}
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={filteredData} barSize={40}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:opacity-10" />
                                <XAxis
                                    dataKey="description"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    dy={10}
                                    interval={0}
                                    // Truncate long labels
                                    tickFormatter={(val) => val.length > 8 ? val.substring(0, 8) + '...' : val}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    tickFormatter={(value) => `R$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                                    {filteredData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
