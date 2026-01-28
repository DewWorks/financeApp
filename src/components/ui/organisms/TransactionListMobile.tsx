
import { ITransaction } from "@/interfaces/ITransaction";
import { TransactionCardMobile } from "../molecules/TransactionCardMobile";
import { motion, AnimatePresence } from "framer-motion";

interface TransactionListMobileProps {
    transactions: ITransaction[];
    onEdit: (transaction: ITransaction) => void;
    onDelete: (transaction: ITransaction) => void;
    viewMode?: 'list' | 'card' | 'table';
}

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Edit, Trash2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { Button } from "../atoms/button";
import { Card } from "../atoms/card";

export function TransactionListMobile({ transactions, onEdit, onDelete, viewMode = 'list' }: TransactionListMobileProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Reset index when transactions change (e.g. pagination)
    useEffect(() => {
        setCurrentIndex(0);
    }, [transactions]);

    if (transactions.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500">
                Nenhuma transação encontrada.
            </div>
        );
    }

    const handleNext = () => {
        if (currentIndex < transactions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const currentTransaction = transactions[currentIndex];

    return (
        <div className="flex flex-col items-center space-y-4 pb-4">
            {/* Content Container */}
            <div className="w-full relative px-1">
                {viewMode === 'card' ? (
                    /* CAROUSEL MODE (CARD) */
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentTransaction._id?.toString() || currentIndex}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="w-full"
                        >
                            <TransactionCardMobile
                                transaction={currentTransaction}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        </motion.div>
                    </AnimatePresence>
                ) : (
                    /* COMPACT LIST MODE */
                    <div className="flex flex-col space-y-2">
                        {transactions.map((t) => (
                            <div key={t._id?.toString()} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${t.type === 'income' ? 'bg-green-100/50 dark:bg-green-900/20' : 'bg-red-100/50 dark:bg-red-900/20'}`}>
                                        {t.type === 'income' ? (
                                            <ArrowUpCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                        ) : (
                                            <ArrowDownCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{t.merchantName || t.description}</span>
                                        <span className="text-[10px] text-gray-500">{new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} • {t.tag}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`text-sm font-bold ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        R$ {t.amount.toFixed(2)}
                                    </span>
                                    <div className="flex gap-2">
                                        <button onClick={() => onEdit(t)} className="text-blue-500"><Edit className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => onDelete(t)} className="text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Navigation Controls */}
            {viewMode === 'card' && (
                <div className="flex items-center justify-between w-full px-4 bg-white dark:bg-gray-800 py-2 rounded-lg shadow-sm mt-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        className="h-10 w-10 p-0 rounded-full"
                    >
                        <ChevronLeft className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </Button>

                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                        {currentIndex + 1} de {transactions.length}
                    </span>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleNext}
                        disabled={currentIndex === transactions.length - 1}
                        className="h-10 w-10 p-0 rounded-full"
                    >
                        <ChevronRight className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </Button>
                </div>
            )}
        </div>
    );
}
