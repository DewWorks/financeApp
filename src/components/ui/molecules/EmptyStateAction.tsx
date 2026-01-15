
import { motion } from "framer-motion";
import { ArrowDown, PlusCircle } from "lucide-react";

export function EmptyStateAction() {
    return (
        <div className="relative flex flex-col items-center justify-center py-12 px-4 text-center">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-green-50 dark:bg-green-900/20 p-6 rounded-full mb-6"
            >
                <PlusCircle className="w-12 h-12 text-green-500" />
            </motion.div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Nenhuma transação ainda?
            </h3>

            <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-8">
                Que tal começar agora? Adicione sua primeira receita ou despesa para ver a mágica acontecer!
            </p>

            {/* Mobile Pointer - FIXED to Viewport to match FAB */}
            <motion.div
                className="sm:hidden fixed bottom-28 right-6 flex flex-col items-center pointer-events-none z-50"
                initial={{ y: 0, opacity: 0 }}
                animate={{ y: [0, 10, 0], opacity: 1 }}
                transition={{ repeat: Infinity, duration: 2 }}
            >
                <span className="text-sm font-bold text-green-600 dark:text-green-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-md mb-2">
                    Clique aqui!
                </span>
                <ArrowDown className="w-8 h-8 text-green-500" />
            </motion.div>

            {/* Desktop Pointer - Fixed to point to Top Right Buttons */}
            <motion.div
                className="hidden sm:flex flex-col items-center fixed top-28 right-10 pointer-events-none z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: [-5, 5, -5] }}
                transition={{ delay: 0.5, duration: 2, repeat: Infinity }}
            >
                <span className="text-sm font-bold text-gray-500 mb-2 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded shadow-sm backdrop-blur-sm">
                    Comece por aqui
                </span>
                {/* Arrow pointing up */}
                <ArrowDown className="w-8 h-8 text-gray-400 transform rotate-180" />
            </motion.div>
        </div>
    );
}
