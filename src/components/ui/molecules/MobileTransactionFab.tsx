import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/atoms/button'
import { AddIncomeDialog } from '@/components/ui/organisms/AddIncomeDialog'
import { AddExpenseDialog } from '@/components/ui/organisms/AddExpenseDialog'

interface MobileTransactionFabProps {
    onAddIncome: (description: string, amount: number, tag: string, date: string, isRecurring: boolean, recurrenceCount: number) => void
    onAddExpense: (description: string, amount: number, tag: string, date: string, isRecurring: boolean, recurrenceCount: number) => void
}

export function MobileTransactionFab({ onAddIncome, onAddExpense }: MobileTransactionFabProps) {
    const [isOpen, setIsOpen] = useState(false)

    const toggleOpen = () => setIsOpen(!isOpen)

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center space-y-4 sm:hidden">
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.8 }}
                            className="flex flex-col items-end space-y-3"
                        >
                            <div className="flex items-center space-x-2">
                                <span className="bg-white dark:bg-gray-800 dark:text-gray-200 px-2 py-1 rounded shadow-md text-sm font-medium">
                                    Receita
                                </span>
                                <AddIncomeDialog
                                    onAddIncome={(...args) => {
                                        onAddIncome(...args)
                                        setIsOpen(false)
                                    }}
                                    trigger={
                                        <Button
                                            size="icon"
                                            className="h-10 w-10 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg"
                                        >
                                            <Plus className="h-5 w-5" />
                                        </Button>
                                    }
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <span className="bg-white dark:bg-gray-800 dark:text-gray-200 px-2 py-1 rounded shadow-md text-sm font-medium">
                                    Despesa
                                </span>
                                <AddExpenseDialog
                                    onAddExpense={(...args) => {
                                        onAddExpense(...args)
                                        setIsOpen(false)
                                    }}
                                    trigger={
                                        <Button
                                            size="icon"
                                            className="h-10 w-10 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg"
                                        >
                                            <Plus className="h-5 w-5" />
                                        </Button>
                                    }
                                />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <Button
                onClick={toggleOpen}
                size="icon"
                className={`h-14 w-14 rounded-full shadow-xl transition-transform duration-200 ${isOpen ? 'bg-gray-500 rotate-45' : 'bg-blue-600'
                    } text-white hover:opacity-90`}
            >
                <Plus className="h-8 w-8" />
            </Button>

            {/* Overlay to close when clicking outside, only if open */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-[-1]"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    )
}
