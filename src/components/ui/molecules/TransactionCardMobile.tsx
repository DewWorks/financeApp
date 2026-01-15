
import { ITransaction } from "@/interfaces/ITransaction";
import { ArrowDownCircle, ArrowUpCircle, Calendar, Edit, RepeatIcon, Tag, Trash2 } from "lucide-react";
import { Button } from "../atoms/button";
import { Card, CardContent } from "../atoms/card";
import { motion } from "framer-motion";

interface TransactionCardMobileProps {
    transaction: ITransaction;
    onEdit: (transaction: ITransaction) => void;
    onDelete: (transaction: ITransaction) => void;
}

export function TransactionCardMobile({ transaction, onEdit, onDelete }: TransactionCardMobileProps) {
    const isIncome = transaction.type === "income";
    const statusColor = isIncome ? "text-green-600" : "text-red-600";
    const statusBg = isIncome ? "bg-green-50" : "bg-red-50";
    const iconBg = isIncome ? "bg-green-100" : "bg-red-100";
    const borderColor = isIncome ? "border-green-200" : "border-red-200";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
        >
            <Card className={`mb-3 border-l-4 ${borderColor} ${statusBg} dark:bg-gray-800 dark:border-l-4 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow`}>
                <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${iconBg} dark:bg-gray-700`}>
                                {isIncome ? (
                                    <ArrowUpCircle className={`w-5 h-5 ${statusColor}`} />
                                ) : (
                                    <ArrowDownCircle className={`w-5 h-5 ${statusColor}`} />
                                )}
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{transaction.description}</h3>
                                <p className={`text-sm font-bold ${statusColor}`}>
                                    R$ {transaction.amount.toFixed(2)}
                                </p>
                            </div>
                        </div>
                        <div className="flex space-x-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-500" onClick={() => onEdit(transaction)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500" onClick={() => onDelete(transaction)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-1">
                                <Tag className="w-3 h-3" />
                                <span>{transaction.tag}</span>
                            </div>
                            {transaction.isRecurring && (
                                <div className="flex items-center space-x-1 text-blue-500">
                                    <RepeatIcon className="w-3 h-3" />
                                    <span>{transaction.recurrenceCount}x</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(transaction.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
