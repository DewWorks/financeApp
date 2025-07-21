"use client"

import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/atoms/button"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { Title } from "@/components/ui/molecules/Title"

interface WhatsAppButtonProps {
    className?: string
}

export function WhatsAppButton({ className = "" }: WhatsAppButtonProps) {
    const router = useRouter()
    const [isTransitioning, setIsTransitioning] = useState(false)

    const handleClick = async () => {
        setIsTransitioning(true)

        setTimeout(() => {
            router.push("/whatsapp-connect")
        }, 5000)
    }

    return (
        <>
            <motion.div
                className={`${className}`}
                animate={{
                    y: [0, -4, 0],
                }}
                transition={{
                    duration: 1.5,
                    repeat: isTransitioning ? 0 : Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                }}
            >
                <Button
                    onClick={handleClick}
                    disabled={isTransitioning}
                    className="bg-green-600 hover:bg-green-500 border border-gray-200 font-medium px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50"
                >
                    <div className="flex items-center gap-3">
                        <MessageCircle className="w-6 h-6 text-green-300" />
                        <div className="scale-5">
                            <Title textColor={"#fff"} />
                        </div>
                    </div>
                </Button>
            </motion.div>

            {/* Transição Simplificada */}
            <AnimatePresence>
                {isTransitioning && (
                    <motion.div
                        className="fixed inset-0 z-50 pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Fundo gradiente */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-br from-green-500 to-blue-600"
                            initial={{ scale: 0 }}
                            animate={{ scale: 2 }}
                            transition={{ duration: 5, ease: "easeInOut" }}
                        />

                        {/* Ícones Centrais Grandes */}
                        <motion.div
                            className="absolute inset-0 flex items-center justify-center"
                            initial={{ scale: 0 }}
                            animate={{ scale: [0, 1.2, 1] }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                        >
                            <div className="flex items-center gap-8">
                                {/* WhatsApp Icon */}
                                <motion.div
                                    initial={{ x: -100, rotate: -180 }}
                                    animate={{ x: 0, rotate: 0 }}
                                    transition={{ delay: 0.5, duration: 1.5, ease: "easeOut" }}
                                >
                                    <MessageCircle className="w-20 h-20 text-white drop-shadow-2xl" />
                                </motion.div>

                                {/* Símbolo de conexão */}
                                <motion.div
                                    className="text-white text-6xl font-bold"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 1.5, duration: 0.8 }}
                                >
                                    +
                                </motion.div>

                                {/* FinancePro Icon */}
                                <motion.div
                                    initial={{ x: 100, rotate: 180 }}
                                    animate={{ x: 0, rotate: 0 }}
                                    transition={{ delay: 0.5, duration: 1.5, ease: "easeOut" }}
                                    className="scale-[3]"
                                >
                                    <Title textColor={"#fff"} size={'lg'}/>
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* Texto Simples */}
                        <motion.div
                            className="absolute inset-0 flex flex-col items-center justify-center text-white text-center"
                            style={{ marginTop: "300px" }}
                        >
                            <motion.h2
                                className="text-3xl font-bold mb-6"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 2, duration: 0.8 }}
                            >
                                Se prepare! Conectando...
                            </motion.h2>

                            <motion.div
                                className="space-y-2 text-lg"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 2.5, duration: 0.8 }}
                            >
                                <div>💬 Controle por mensagem</div>
                                <div>🤖 IA automática</div>
                                <div>📊 Relatórios instantâneos</div>
                            </motion.div>
                        </motion.div>

                        {/* Loading */}
                        <motion.div
                            className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white text-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 3.5, duration: 0.8 }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1">
                                    {[...Array(3)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="w-2 h-2 bg-white rounded-full"
                                            animate={{
                                                scale: [1, 1.5, 1],
                                                opacity: [0.5, 1, 0.5],
                                            }}
                                            transition={{
                                                duration: 1,
                                                delay: i * 0.2,
                                                repeat: Number.POSITIVE_INFINITY,
                                            }}
                                        />
                                    ))}
                                </div>
                                <span className="text-sm">Conectando...</span>
                            </div>
                        </motion.div>

                        {/* Zoom Final */}
                        <motion.div
                            className="absolute inset-0 bg-white"
                            initial={{ scale: 0, borderRadius: "50%" }}
                            animate={{
                                scale: [0, 0, 3],
                                borderRadius: ["50%", "50%", "0%"],
                            }}
                            transition={{
                                duration: 5,
                                times: [0, 0.8, 1],
                                ease: "easeInOut",
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
