import { PieChart, BarChart, LineChart, AreaChart } from "lucide-react"
import { Button } from "@/components/ui/atoms/button"

interface ChartTypeSelectorProps {
    selectedType: string
    onSelectType: (type: string) => void
}

export function ChartTypeSelector({ selectedType, onSelectType }: ChartTypeSelectorProps) {
    const chartTypes = [
        { type: "pie", icon: PieChart, label: "Gráfico de Pizza" },
        { type: "bar", icon: BarChart, label: "Gráfico de Barras" },
        { type: "line", icon: LineChart, label: "Gráfico de Linhas" },
        { type: "area", icon: AreaChart, label: "Gráfico de Área" },
    ]

    return (
        <div className="flex space-x-2 mb-4">
            {chartTypes.map(({ type, icon: Icon, label }) => (
                <Button
                    className={`text-white ${selectedType === type ? "bg-violet-600" : "bg-blue-600"}`}
                    key={type}
                    variant={selectedType === type ? "default" : "outline"}
                    size="icon"
                    onClick={() => onSelectType(type)}
                    title={label}
                >
                    <Icon className="h-4 w-4" />
                </Button>
            ))}
        </div>
    )
}

