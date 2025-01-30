import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card"
import { type LucideIcon } from 'lucide-react'

interface SummaryCardProps {
    title: string
    value: number
    icon: LucideIcon
    description?: string
    valueColor?: string
}

export function SummaryCard({
                                title,
                                value,
                                icon: Icon,
                                description,
                                valueColor = "text-gray-900 dark:text-gray-100"
                            }: SummaryCardProps) {
    return (
        <Card className="bg-white dark:bg-gray-800 shadow-lg transition-colors duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${valueColor}`}>
                    R$ {value.toFixed(2)}
                </div>
                {description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
