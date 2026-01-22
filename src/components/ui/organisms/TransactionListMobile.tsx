
import { ITransaction } from "@/interfaces/ITransaction";
import { TransactionCardMobile } from "../molecules/TransactionCardMobile";
import { motion, AnimatePresence } from "framer-motion";

interface TransactionListMobileProps {
    transactions: ITransaction[];
    onEdit: (transaction: ITransaction) => void;
    onDelete: (transaction: ITransaction) => void;
}

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../atoms/button";

export function TransactionListMobile({ transactions, onEdit, onDelete }: TransactionListMobileProps) {
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
            {/* Carousel Container */}
            <div className="w-full relative px-1">
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
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between w-full px-4 bg-white dark:bg-gray-800 py-2 rounded-lg shadow-sm">
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
        </div>
    );
}
