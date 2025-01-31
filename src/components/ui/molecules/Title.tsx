import { Wallet } from "lucide-react"

export function Title() {
    return (
        <div className="flex items-center justify-center">
            <Wallet className="lg:h-12 lg:w-12 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400 transition-colors duration-200" />
            <span className="m-4 lg:text-5xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-200">
        FinancePro
      </span>
        </div>
    )
}

