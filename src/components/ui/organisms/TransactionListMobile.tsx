
import { ITransaction } from "@/interfaces/ITransaction";
import { TransactionCardMobile } from "../molecules/TransactionCardMobile";
import { motion, AnimatePresence } from "framer-motion";

interface TransactionListMobileProps {
    transactions: ITransaction[];
    onEdit: (transaction: ITransaction) => void;
    onDelete: (transaction: ITransaction) => void;
}

export function TransactionListMobile({ transactions, onEdit, onDelete }: TransactionListMobileProps) {
    // Helper to standardise date for comparison
    const normalizeDate = (dateStr: string) => {
        const d = new Date(dateStr);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    };

    const getGroupTitle = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (normalizeDate(dateStr) === normalizeDate(today.toISOString())) return "Hoje";
        if (normalizeDate(dateStr) === normalizeDate(yesterday.toISOString())) return "Ontem";

        return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    };

    // Group transactions by date
    const groupedTransactions = transactions.reduce((acc, transaction) => {
        const dateKey = transaction.date;
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(transaction);
        return acc;
    }, {} as Record<string, ITransaction[]>);

    // Sort dates descending
    const sortedDates = Object.keys(groupedTransactions).sort((a, b) =>
        new Date(b).getTime() - new Date(a).getTime()
    );

    return (
        <motion.div
            className="space-y-6 pb-20" // Extra padding for FAB
            initial="hidden"
            animate="visible"
            variants={{
                hidden: { opacity: 0 },
                visible: { cursor: "default", opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
        >
            <AnimatePresence>
                {sortedDates.map((date) => (
                    <motion.div key={date} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 ml-1 sticky top-0 bg-gray-50 dark:bg-gray-900 z-10 py-1 transition-colors">
                            {getGroupTitle(date)}
                        </h4>
                        <div className="space-y-2">
                            {groupedTransactions[date].map((t) => (
                                <TransactionCardMobile
                                    key={t._id?.toString() || Math.random().toString()}
                                    transaction={t}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                />
                            ))}
                        </div>
                    </motion.div>
                ))}
                {sortedDates.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-10 text-gray-500"
                    >
                        Nenhuma transação encontrada.
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
