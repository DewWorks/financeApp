'use client'

import { useState, useEffect } from 'react'
import {usePathname, useRouter} from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, AnimatePresence } from 'framer-motion'
import {Title} from "@/components/Title";

export function AuthPopup() {
    const [isVisible, setIsVisible] = useState(false)
    const router = useRouter()

    const pathname = usePathname()

    useEffect(() => {
        const token = document.cookie.includes('auth_token');
        // Don't show popup on auth pages
        const isAuthPage = pathname?.includes('/auth/') || pathname?.includes('/login') || pathname?.includes('/register')
        if (token && !isAuthPage) {
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
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                        <Card className="w-full max-w-md items-center justify-center bg-white">
                            <CardHeader>
                                <Title/>
                                <CardTitle className="text-2xl font-bold text-center">Bem-vindo</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-center text-gray-600">
                                    Para acessar todas as funcionalidades, faça login ou crie uma conta.
                                </p>
                                <div className="flex justify-center space-x-4">
                                    <Button onClick={handleLogin} className="bg-blue-600 text-white hover:bg-blue-700">
                                        Login
                                    </Button>
                                    <Button onClick={handleRegister} className="bg-blue-600 text-white hover:bg-blue-700">
                                        Cadastro
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}