import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card"
import { type LucideIcon } from 'lucide-react'

interface SummaryCardProps {
    title: string
    value: number
    icon: LucideIcon
    description?: string
    valueColor?: string
    variant?: "default" | "success" | "danger" | "info"
    valueClassName?: string
}

export function SummaryCard({
    title,
    value,
    icon: Icon,
    description,
    variant = "default",
    valueClassName
}: SummaryCardProps) {

    // Define gradient and icon styles based on variant
    const styles = {
        default: {
            gradient: "bg-white dark:bg-gray-800",
            iconBg: "bg-blue-100 dark:bg-blue-900/30",
            iconColor: "text-blue-600 dark:text-blue-400",
            textColor: "text-gray-900 dark:text-gray-100"
        },
        success: {
            gradient: "bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/20",
            iconBg: "bg-green-100 dark:bg-green-900/30",
            iconColor: "text-green-600 dark:text-green-400",
            textColor: "text-green-700 dark:text-green-400"
        },
        danger: {
            gradient: "bg-gradient-to-br from-white to-red-50 dark:from-gray-800 dark:to-red-900/20",
            iconBg: "bg-red-100 dark:bg-red-900/30",
            iconColor: "text-red-600 dark:text-red-400",
            textColor: "text-red-700 dark:text-red-400"
        },
        info: {
            gradient: "bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800",
            iconBg: "bg-blue-100 dark:bg-blue-900/30",
            iconColor: "text-blue-600 dark:text-blue-400",
            textColor: "text-blue-700 dark:text-blue-400"
        }
    }

    const activeStyle = styles[variant] || styles.default

    return (
        <Card className={`${activeStyle.gradient} shadow-md hover:shadow-lg transition-all duration-300 border-none`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {title}
                </CardTitle>
                <div className={`p-2 rounded-full ${activeStyle.iconBg}`}>
                    <Icon className={`h-4 w-4 ${activeStyle.iconColor}`} />
                </div>
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold mt-1 ${valueClassName || activeStyle.textColor}`}>
                    R$ {value.toFixed(2)}
                </div>
                {description && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-medium">
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
