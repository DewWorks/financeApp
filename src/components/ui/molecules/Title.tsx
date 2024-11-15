import { Wallet } from "lucide-react";

export function Title(){
    return(
              <div className="flex items-center justify-center">
                <Wallet className="h-12 w-12 text-blue-600" />
                <span className="m-4 text-5xl font-bold text-gray-900">FinancePro</span>
              </div>
    )
}