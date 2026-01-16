"use client"

import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertTriangle, AlertCircle, ShieldAlert } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Swal from 'sweetalert2'

interface ToastProps {
    message: string
    type: 'success' | 'error' | 'warning' | 'auth'
    duration?: number
    onClose: () => void
}

const variants = {
    initial: { opacity: 0, y: 50, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
}

const iconMap = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    auth: ShieldAlert
}

const colorMap = {
    success: 'bg-green-500/90 dark:bg-green-600/90 border-green-200 dark:border-green-800 text-white',
    error: 'bg-red-500/90 dark:bg-red-600/90 border-red-200 dark:border-red-800 text-white',
    warning: 'bg-yellow-500/90 dark:bg-yellow-600/90 border-yellow-200 dark:border-yellow-800 text-white',
    auth: 'bg-blue-500/90 dark:bg-blue-600/90 border-blue-200 dark:border-blue-800 text-white'
}

export function Toast({ message, type, duration = 3000, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false)
            setTimeout(onClose, 200) // Wait for exit animation
        }, duration)

        return () => clearTimeout(timer)
    }, [duration, onClose])

    const handleAuthClick = () => {
        Swal.fire({
            title: 'Autenticação necessária',
            html: `
                <div class="flex flex-col items-center">
                    <h2 class="text-lg font-semibold text-gray-800">Faça login para continuar</h2>
                    <button class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-md transition-all" onClick={() => window.location.href = '/login'}>
                        Fazer Login
                    </button>
                </div>
            `,
            showCloseButton: true,
            showConfirmButton: false,
            customClass: {
                popup: 'p-6 rounded-2xl shadow-xl',
                title: 'text-xl font-bold text-gray-800',
            }
        })
    }

    const handleButtonClick = () => {
        if (type === 'auth') {
            handleAuthClick()
        } else {
            setIsVisible(false)
            setTimeout(onClose, 200)
        }
    }

    const Icon = iconMap[type]

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    layout
                    variants={variants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    onClick={handleButtonClick}
                    className={`
                        fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[110] 
                        flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl 
                        backdrop-blur-md border ${colorMap[type]}
                        cursor-pointer hover:scale-105 transition-transform duration-200
                        min-w-[300px] max-w-[90vw] justify-between
                    `}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-1 bg-white/20 rounded-full">
                            <Icon size={18} className="text-white" />
                        </div>
                        <p className="text-sm font-semibold tracking-wide drop-shadow-sm">{message}</p>
                    </div>
                    <X size={16} className="text-white/70 hover:text-white transition-colors" />
                </motion.div>
            )}
        </AnimatePresence>
    )
}
