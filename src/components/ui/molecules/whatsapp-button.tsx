"use client"

import { MessageCircle, Send, CheckCheck, Bell } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"

interface WhatsAppButtonProps {
    className?: string
}

const NOTIFICATIONS = [
    { text: "FinancePro", icon: MessageCircle, color: "text-white" },
    { text: "WhatsApp Conectado", icon: CheckCheck, color: "text-green-200" },
    { text: "Relatório Disponível", icon: Bell, color: "text-yellow-200" },
    { text: "1 Nova Mensagem", icon: MessageCircle, color: "text-white" }
]

export function WhatsAppButton({ className = "" }: WhatsAppButtonProps) {
    const router = useRouter()
    const [isTransitioning, setIsTransitioning] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [currentNotif, setCurrentNotif] = useState(0)

    // Auto-expand/collapse logic
    useEffect(() => {
        // Initial delay before first expansion
        const initialTimeout = setTimeout(() => {
            triggerNotification()
        }, 2000)

        // Loop for notifications every 15 seconds
        const interval = setInterval(() => {
            triggerNotification()
        }, 15000)

        return () => {
            clearTimeout(initialTimeout)
            clearInterval(interval)
        }
    }, [])

    const triggerNotification = () => {
        setCurrentNotif((prev) => (prev + 1) % NOTIFICATIONS.length)
        setIsExpanded(true)

        // Collapse after 5 seconds
        setTimeout(() => {
            setIsExpanded(false)
        }, 5000)
    }

    const handleClick = async () => {
        setIsTransitioning(true)
        setTimeout(() => {
            router.push("/whatsapp-connect")
        }, 4000)
    }

    const toggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsExpanded(!isExpanded)
    }

    const activeNotif = NOTIFICATIONS[currentNotif]

    return (
        <>
            <motion.div
                className={`${className} relative z-50`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                {/* Radar Waves Effect (Only when collapsed to draw attention) */}
                <AnimatePresence>
                    {!isExpanded && !isTransitioning && (
                        <>
                            <motion.div
                                className="absolute inset-0 bg-green-500 rounded-full opacity-0"
                                animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                            />
                            <motion.div
                                className="absolute inset-0 bg-green-500 rounded-full opacity-0"
                                animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                            />
                        </>
                    )}
                </AnimatePresence>

                {/* Notification Badge (Always visible if not transitioning) */}
                {!isTransitioning && (
                    <motion.div
                        className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full z-20 shadow-sm border-2 border-white dark:border-gray-900"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                        1
                    </motion.div>
                )}

                <motion.button
                    onClick={isExpanded ? handleClick : toggleExpand}
                    layout
                    className={`
                        relative overflow-hidden shadow-2xl transition-all duration-300 flex items-center
                        bg-gradient-to-r from-[#25D366] to-[#128C7E]
                        ${isExpanded ? "pr-6 pl-2 py-3 rounded-full" : "w-14 h-14 rounded-full justify-center"}
                    `}
                    whileTap={{ scale: 0.95 }}
                >
                    {/* Icon Container */}
                    <motion.div layout className={`relative z-10 p-2 ${isExpanded ? "bg-white/20 rounded-full mr-3" : ""}`}>
                        <activeNotif.icon className={`w-6 h-6 text-white drop-shadow-md`} />
                    </motion.div>

                    {/* Text Container */}
                    <AnimatePresence mode="wait">
                        {isExpanded && (
                            <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: "auto" }}
                                exit={{ opacity: 0, width: 0 }}
                                className="flex flex-col items-start overflow-hidden whitespace-nowrap"
                            >
                                <span className="text-[10px] font-bold text-green-100 uppercase tracking-wider">
                                    Nova Notificação
                                </span>
                                <span className="text-sm font-bold text-white leading-tight">
                                    {activeNotif.text}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
                        <motion.div
                            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                            animate={{ translateX: ["-100%", "200%"] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        />
                    </div>
                </motion.button>
            </motion.div>

            {/* Premium Full Screen Transition */}
            <AnimatePresence>
                {isTransitioning && (
                    <motion.div
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950"
                        initial={{ opacity: 0, clipPath: "circle(0% at bottom right)" }}
                        animate={{ opacity: 1, clipPath: "circle(150% at bottom right)" }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "circIn" }}
                    >
                        {/* Background Animated Gradient */}
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-gray-900 to-black opacity-90" />
                            <motion.div
                                className="absolute -inset-[50%] opacity-30 blur-3xl bg-gradient-to-r from-green-600 to-emerald-600"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            />
                        </div>

                        <div className="relative z-10 flex flex-col items-center p-8 text-center">
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                className="mb-8 relative"
                            >
                                <div className="absolute inset-0 bg-green-500 blur-2xl opacity-40 animate-pulse" />
                                <MessageCircle className="w-24 h-24 text-[#25D366] drop-shadow-[0_0_15px_rgba(37,211,102,0.5)]" />
                            </motion.div>

                            <motion.h2
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-4xl font-bold text-white mb-2"
                            >
                                FinancePro
                            </motion.h2>

                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-gray-400 mb-8 text-lg"
                            >
                                Conectando ao WhatsApp Seguro...
                            </motion.p>

                            {/* Loading Bar */}
                            <motion.div
                                className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden shadow-inner"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                            >
                                <motion.div
                                    className="h-full bg-gradient-to-r from-green-400 to-[#25D366]"
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 3.5, ease: "easeInOut" }}
                                />
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
