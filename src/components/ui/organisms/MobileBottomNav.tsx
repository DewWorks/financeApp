import { Button } from "@/components/ui/atoms/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/atoms/popover"
import { Home, List, Target, PieChart, Plus, ArrowUpIcon, ArrowDownIcon, MessageSquare, UploadCloud } from "lucide-react"
import { AddIncomeDialog } from "@/components/ui/organisms/AddIncomeDialog"
import { AddExpenseDialog } from "@/components/ui/organisms/AddExpenseDialog"
import { ITransaction } from "@/interfaces/ITransaction"

interface MobileBottomNavProps {
    activeTab: string
    setActiveTab: (tab: string) => void
    onAddIncome: (desc: string, amount: number, tag: string, date: string, isRecurring: boolean, recurrenceCount: number) => void
    onAddExpense: (desc: string, amount: number, tag: string, date: string, isRecurring: boolean, recurrenceCount: number) => void
}

export function MobileBottomNav({ 
    activeTab, 
    setActiveTab, 
    onAddIncome, 
    onAddExpense
}: MobileBottomNavProps) {
    return (
        <div id="mobile-bottom-nav" className="md:hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 px-3 py-2.5 z-50 flex items-center justify-between w-[96vw] max-w-md">
            <button
                onClick={() => setActiveTab('home')}
                className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'home' ? 'text-blue-600 dark:text-blue-400 scale-105' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}
            >
                <Home className="w-5 h-5" strokeWidth={activeTab === 'home' ? 2.5 : 2} />
                <span className="text-[9px] font-medium">Início</span>
            </button>

            <button
                onClick={() => setActiveTab('transactions')}
                className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'transactions' ? 'text-blue-600 dark:text-blue-400 scale-105' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}
            >
                <List className="w-5 h-5" strokeWidth={activeTab === 'transactions' ? 2.5 : 2} />
                <span className="text-[9px] font-medium">Tabela</span>
            </button>

            <button
                onClick={() => setActiveTab('goals')}
                className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'goals' ? 'text-blue-600 dark:text-blue-400 scale-105' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}
            >
                <Target className="w-5 h-5" strokeWidth={activeTab === 'goals' ? 2.5 : 2} />
                <span className="text-[9px] font-medium">Metas</span>
            </button>

            {/* CENTRAL ADD BUTTON */}
            <Popover>
                <PopoverTrigger asChild>
                    <div className="relative -top-5 flex-shrink-0">
                        <div className="absolute inset-0 bg-blue-500 blur-lg opacity-40 rounded-full"></div>
                        <button
                            id="mobile-add-btn"
                            className="relative bg-gradient-to-tr from-blue-600 to-blue-500 text-white rounded-full p-3.5 shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 active:scale-95 border-4 border-gray-50 dark:border-gray-900 flex items-center justify-center"
                        >
                            <Plus className="w-6 h-6" strokeWidth={3} />
                        </button>
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2 mb-4 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-2xl rounded-xl" side="top" align="center" sideOffset={10}>
                    <div className="flex flex-col gap-1">
                        <div className="w-full">
                            <AddIncomeDialog onAddIncome={onAddIncome} trigger={
                                <Button variant="ghost" className="w-full justify-start text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20">
                                    <ArrowUpIcon className="w-4 h-4 mr-2" /> Receita
                                </Button>
                            } />
                        </div>
                        <div className="h-px bg-gray-100 dark:bg-gray-700" />
                        <div className="w-full">
                            <AddExpenseDialog onAddExpense={onAddExpense} trigger={
                                <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                                    <ArrowDownIcon className="w-4 h-4 mr-2" /> Despesa
                                </Button>
                            } />
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            <button
                onClick={() => setActiveTab('analytics')}
                className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'analytics' ? 'text-blue-600 dark:text-blue-400 scale-105' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}
            >
                <PieChart className="w-5 h-5" strokeWidth={activeTab === 'analytics' ? 2.5 : 2} />
                <span className="text-[9px] font-medium">Análise</span>
            </button>

            <button
                onClick={() => setActiveTab('fin')}
                className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'fin' ? 'text-indigo-600 dark:text-indigo-400 scale-105' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}
            >
                <MessageSquare className="w-5 h-5" strokeWidth={activeTab === 'fin' ? 2.5 : 2} />
                <span className="text-[9px] font-medium">Fin AI</span>
            </button>

            <button
                onClick={() => setActiveTab('import')}
                className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'import' ? 'text-emerald-600 dark:text-emerald-400 scale-105' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}
            >
                <UploadCloud className="w-5 h-5" strokeWidth={activeTab === 'import' ? 2.5 : 2} />
                <span className="text-[9px] font-medium">Importar</span>
            </button>
        </div>
    )
}
