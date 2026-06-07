import { useState } from "react"
import { Button } from "@/components/ui/atoms/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/atoms/popover"
import { Home, List, PieChart, Plus, ArrowUpIcon, ArrowDownIcon, MessageSquare, UploadCloud, Sparkles } from "lucide-react"
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
    const [isPopoverOpen, setIsPopoverOpen] = useState(false)

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

            {/* CENTRAL ADD BUTTON */}
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
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
                <PopoverContent className="w-56 p-2 mb-4 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-2xl rounded-xl" side="top" align="center" sideOffset={10}>
                    <div className="flex flex-col gap-1.5">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setIsPopoverOpen(false)
                                setActiveTab('fin')
                            }}
                            className="w-full justify-start text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-bold border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/10"
                        >
                            <Sparkles className="w-4 h-4 mr-2 text-amber-500 animate-pulse" /> Falar com o Fin (IA) 🎙️
                        </Button>

                        <div className="h-px bg-gray-100 dark:bg-gray-700 my-0.5" />

                        <div className="w-full">
                            <AddIncomeDialog onAddIncome={onAddIncome} trigger={
                                <Button variant="ghost" className="w-full justify-start text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20">
                                    <ArrowUpIcon className="w-4 h-4 mr-2" /> Receita
                                </Button>
                            } />
                        </div>
                        <div className="w-full">
                            <AddExpenseDialog onAddExpense={onAddExpense} trigger={
                                <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                                    <ArrowDownIcon className="w-4 h-4 mr-2" /> Despesa
                                </Button>
                            } />
                        </div>

                        <div className="h-px bg-gray-100 dark:bg-gray-700 my-0.5" />

                        <Button
                            variant="ghost"
                            onClick={() => {
                                setIsPopoverOpen(false)
                                setActiveTab('import')
                            }}
                            className="w-full justify-start text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        >
                            <UploadCloud className="w-4 h-4 mr-2" /> Importar Extrato
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>

            <button
                onClick={() => setActiveTab('fin')}
                className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-300 ${
                    activeTab === 'fin'
                        ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white scale-110 shadow-lg shadow-indigo-500/20'
                        : 'bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100/50 hover:scale-105'
                }`}
            >
                <div className="relative">
                    <MessageSquare className="w-5 h-5" strokeWidth={2.5} />
                    <Sparkles className="absolute -top-1 -right-1 w-2.5 h-2.5 text-amber-400 animate-pulse" />
                </div>
                <span className="text-[9px] font-bold">Fin AI</span>
            </button>

            <button
                onClick={() => setActiveTab('analytics')}
                className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'analytics' ? 'text-blue-600 dark:text-blue-400 scale-105' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}
            >
                <PieChart className="w-5 h-5" strokeWidth={activeTab === 'analytics' ? 2.5 : 2} />
                <span className="text-[9px] font-medium">Painel</span>
            </button>
        </div>
    )
}
