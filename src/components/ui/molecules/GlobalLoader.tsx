"use client"

import { motion } from "framer-motion"
import { Loader2, Database, BarChart3, Wallet } from "lucide-react"

export function GlobalLoader() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 dark:bg-gray-900/90 backdrop-blur-sm"
        >
            <div className="flex flex-col items-center max-w-sm text-center p-6">
                <div className="relative mb-8">
                    {/* Orbiting Icons Animation */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 w-20 h-20 border-2 border-dashed border-blue-500/30 rounded-full"
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-[-12px] w-26 h-26 border border-dashed border-purple-500/20 rounded-full"
                    />

                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xl relative z-10">
                        <div className="grid grid-cols-2 gap-2">
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Database className="w-6 h-6 text-blue-500" />
                            </motion.div>
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                            >
                                <BarChart3 className="w-6 h-6 text-green-500" />
                            </motion.div>
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                            >
                                <Wallet className="w-6 h-6 text-purple-500" />
                            </motion.div>
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                            >
                                <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                            </motion.div>
                        </div>
                    </div>
                </div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-2">
                        Buscando Todo o Histórico
                    </h3>
                    <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                        <motion.div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                            initial={{ width: "0%" }}
                            animate={{ width: "95%" }}
                            transition={{ duration: 8, ease: "circOut" }} // Fast start, slow end mock progress
                        />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                        Processando transações, calculando saldos e gerando gráficos...
                    </p>
                </motion.div>
            </div>
        </motion.div>
    )
}
