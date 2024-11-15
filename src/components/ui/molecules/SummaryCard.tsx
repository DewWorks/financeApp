import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card"
import { LucideIcon } from 'lucide-react'

interface SummaryCardProps {
  title: string
  value: number
  icon: LucideIcon
  description?: string
  valueColor?: string
}

export function SummaryCard({ title, value, icon: Icon, description, valueColor = "text-gray-900" }: SummaryCardProps) {
  return (
    <Card className="bg-white shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className="h-4 w-4 text-gray-600" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueColor}`}>R$ {value.toFixed(2)}</div>
        {description && <p className="text-xs text-gray-600 mt-1">{description}</p>}
      </CardContent>
    </Card>
  )
}