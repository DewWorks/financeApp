import { PieChart, BarChart, LineChart, AreaChart, Activity, TrendingUp, Layers, PieChart as PieIcon } from "lucide-react"
import { motion } from "framer-motion"

interface ChartTypeSelectorProps {
    selectedType: string
    onSelectType: (type: string) => void
}

export function ChartTypeSelector({ selectedType, onSelectType }: ChartTypeSelectorProps) {
    const chartTypes = [
        {
            type: "pie",
            icon: PieIcon,
            label: "Distribuição",
            desc: "Visão Geral"
        },
        {
            type: "bar",
            icon: Activity,
            label: "Comparativo",
            desc: "Por Categoria"
        },
        {
            type: "line",
            icon: TrendingUp,
            label: "Fluxo",
            desc: "Evolução"
        },
        {
            type: "area",
            icon: Layers,
            label: "Balanço",
            desc: "Acumulado"
        },
    ]

    return (
        <div className="w-full overflow-x-auto scrollbar-hide py-2">
            <div className="flex space-x-2 min-w-max p-1">
                {chartTypes.map(({ type, icon: Icon, label, desc }) => {
                    const isActive = selectedType === type
                    return (
                        <button
                            key={type}
                            onClick={() => onSelectType(type)}
                            className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 outline-none focus-visible:ring-2 ring-blue-500 bg-white dark:bg-gray-800 border ${isActive ? 'border-blue-500/0' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeChartTab"
                                    className="absolute inset-0 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-600 dark:border-blue-400"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}

                            <div className={`relative z-10 p-2 rounded-lg ${isActive ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                                <Icon className="w-5 h-5" />
                            </div>

                            <div className="relative z-10 flex flex-col items-start">
                                <span className={`text-sm font-bold ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {label}
                                </span>
                                <span className="text-[10px] text-gray-400 font-medium">
                                    {desc}
                                </span>
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
