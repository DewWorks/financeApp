"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/atoms/card"
import { Button } from "@/components/ui/atoms/button"
import { Shield, X, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface MfaNudgeProps {
    mfaEnabled?: boolean
}

export function MfaNudge({ mfaEnabled }: MfaNudgeProps) {
    const [isVisible, setIsVisible] = useState(false)
    const router = useRouter()

    useEffect(() => {
        // If MFA is NOT enabled, check if user dismissed it recently
        if (mfaEnabled === false) {
            const dismissedAt = localStorage.getItem("mfa-nudge-dismissed")
            if (dismissedAt) {
                const diff = Date.now() - parseInt(dismissedAt)
                const days = diff / (1000 * 60 * 60 * 24)
                if (days < 7) return; // Don't show if dismissed less than 7 days ago
            }
            setIsVisible(true)
        }
    }, [mfaEnabled])

    const handleDismiss = () => {
        setIsVisible(false)
        localStorage.setItem("mfa-nudge-dismissed", Date.now().toString())
    }

    const handleAction = () => {
        router.push("/profile")
    }

    if (!isVisible) return null

    return (
        <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-100 dark:bg-blue-800 p-3 rounded-full">
                        <Shield className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100">Proteja sua conta</h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            Ative a autenticação de dois fatores (MFA) para evitar acessos não autorizados.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 self-end md:self-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDismiss}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/50"
                    >
                        <X className="w-4 h-4 mr-1" /> Agora não
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleAction}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Ativar Agora <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
