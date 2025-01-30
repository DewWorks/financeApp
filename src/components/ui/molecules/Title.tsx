import { Wallet } from "lucide-react"

export function Title() {
    return (
        <div className="flex items-center justify-center">
            <Wallet className="h-12 w-12 text-blue-600 dark:text-blue-400 transition-colors duration-200" />
            <span className="m-4 text-5xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-200">
        FinancePro
      </span>
        </div>
    )
}

