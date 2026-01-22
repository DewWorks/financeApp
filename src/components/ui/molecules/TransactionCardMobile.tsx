
import { ITransaction } from "@/interfaces/ITransaction";
import { ArrowDownCircle, ArrowUpCircle, Calendar, Edit, RepeatIcon, Tag, Trash2 } from "lucide-react";
import { Button } from "../atoms/button";
import { Card, CardContent } from "../atoms/card";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";

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

    // Drag logic
    const x = useMotionValue(0);

    // Background Color Transformation
    // Left drag (negative x) -> Red (Delete)
    // Right drag (positive x) -> Blue (Edit)
    const containerBg = useTransform(
        x,
        [-150, -50, 0, 50, 150],
        [
            "rgba(220, 38, 38, 1)",   // Deep Red
            "rgba(220, 38, 38, 0.5)", // Faded Red
            "rgba(255, 255, 255, 0)", // Transparent
            "rgba(37, 99, 235, 0.5)", // Faded Blue
            "rgba(37, 99, 235, 1)"    // Deep Blue
        ]
    );

    const deleteOpacity = useTransform(x, [-100, -50], [1, 0]);
    const editOpacity = useTransform(x, [50, 100], [0, 1]);

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.x < -100) {
            onDelete(transaction);
        } else if (info.offset.x > 100) {
            onEdit(transaction);
        }
    };

    return (
        <div className="relative mb-3 overflow-hidden rounded-lg">
            {/* Dynamic Background Layer */}
            <motion.div
                style={{ backgroundColor: containerBg }}
                className="absolute inset-0 flex items-center justify-between px-4 z-0 rounded-lg"
            >
                {/* Left Action (Edit) - Visible when dragging right */}
                <motion.div
                    style={{ opacity: editOpacity }}
                    className="flex items-center text-white font-bold"
                >
                    <Edit className="mr-2 h-5 w-5" /> Editar
                </motion.div>

                {/* Right Action (Delete) - Visible when dragging left */}
                <motion.div
                    style={{ opacity: deleteOpacity }}
                    className="flex items-center text-white font-bold"
                >
                    Excluir <Trash2 className="ml-2 h-5 w-5" />
                </motion.div>
            </motion.div>

            {/* Foreground Card Layer */}
            <motion.div
                layout
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                style={{ x }}
                onDragEnd={handleDragEnd}
                whileDrag={{ scale: 1.02, cursor: "grabbing" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="relative bg-white dark:bg-gray-800 z-10"
            >
                <Card className={`border-l-4 ${borderColor} ${statusBg} dark:bg-gray-800 dark:border-l-4 dark:border-gray-700 shadow-sm`}>
                    <CardContent className="p-3 select-none touch-pan-y">
                        <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center space-x-3">
                                <div className={`p-1.5 rounded-full ${iconBg} dark:bg-gray-700`}>
                                    {isIncome ? (
                                        <ArrowUpCircle className={`w-4 h-4 ${statusColor}`} />
                                    ) : (
                                        <ArrowDownCircle className={`w-4 h-4 ${statusColor}`} />
                                    )}
                                </div>
                                <div className="max-w-[160px] xs:max-w-[200px]">
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm line-clamp-1">{transaction.description}</h3>
                                    <p className={`text-xs font-bold ${statusColor}`}>
                                        R$ {transaction.amount.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                            {/* Actions */}
                            <div className="flex space-x-0" onPointerDownCapture={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-blue-500" onClick={() => onEdit(transaction)}>
                                    <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-500" onClick={() => onDelete(transaction)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-1 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                    <Tag className="w-3 h-3" />
                                    <span className="truncate max-w-[80px]">{transaction.tag}</span>
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
        </div>
    );
}
