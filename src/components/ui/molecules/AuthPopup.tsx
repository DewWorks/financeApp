'use client'

import { useState, useEffect } from 'react'
import {usePathname, useRouter} from 'next/navigation'
import { Button } from "@/components/ui/atoms/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card"
import { motion, AnimatePresence } from 'framer-motion'
import {Title} from "@/components/ui/molecules/Title";

export function AuthPopup() {
    const [isVisible, setIsVisible] = useState(false)
    const router = useRouter()

    const pathname = usePathname()

    useEffect(() => {
        const token = typeof window !== "undefined" && localStorage.getItem('auth_token');
        // Don't show popup on auth pages
        const isAuthPage = pathname?.includes('/auth/') || pathname?.includes('/login') || pathname?.includes('/register')
        const tutorialCompleted = typeof window !== "undefined" && localStorage.getItem("tutorial-guide-v2") === "true";
        if (!token && !isAuthPage && tutorialCompleted) {
            setIsVisible(true)
        } else {
            setIsVisible(false)
        }
    }, [pathname])

    const handleLogin = () => {
        router.push('/auth/login')
    }

    const handleRegister = () => {
        router.push('/auth/register')
    }

    if (!isVisible) return null

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="w-full max-w-sm px-4"
                    >
                        <Card className="w-full bg-white dark:bg-zinc-900 border-2 border-gray-200 dark:border-zinc-800 shadow-2xl flex flex-col items-center justify-center p-6 rounded-2xl">
                            <CardHeader className="flex flex-col items-center justify-center p-0 mb-4 gap-2">
                                <Title size="lg" />
                                <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">Bem-vindo</CardTitle>
                            </CardHeader>
                             <CardContent className="space-y-4 p-0 w-full">
                                <p className="text-center text-sm text-gray-600 dark:text-zinc-400">
                                    Para acessar todas as funcionalidades, faça login ou crie uma conta.
                                </p>
                                <div className="flex justify-center gap-4 w-full">
                                    <Button onClick={handleLogin} className="flex-1 bg-blue-600 text-white hover:bg-blue-700 font-medium py-2 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg">
                                        Login
                                    </Button>
                                    <Button onClick={handleRegister} className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-gray-950 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 font-medium py-2 rounded-xl transition-all duration-200 shadow-sm">
                                        Cadastro
                                    </Button>
                                </div>
                                <div className="flex flex-col items-center gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
                                    <button 
                                        onClick={() => {
                                            localStorage.removeItem("tutorial-guide-v2")
                                            window.location.reload()
                                        }} 
                                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                    >
                                        ✨ Ver Tour / Tutorial de IA
                                    </button>
                                    <button 
                                        onClick={() => setIsVisible(false)} 
                                        className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                    >
                                        Continuar como Visitante (Modo Demo)
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}