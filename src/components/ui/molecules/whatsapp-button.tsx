"use client"

import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/atoms/button"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

interface WhatsAppButtonProps {
    className?: string
}

export function WhatsAppButton({ className = "" }: WhatsAppButtonProps) {
    const router = useRouter()

    return (
        <motion.div
            className={`${className}`}
            animate={{
                y: [0, -4, 0],
            }}
            transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
            }}
        >
            <Button
                onClick={() => router.push("/whatsapp-connect")}
                className="bg-green-600 text-white hover:bg-green-700 border border-gray-200 font-medium px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
                <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-green-500" />

                    <div className="flex items-center gap-2">
                        <span className="font-semibold">FinancePro AI</span>
                        <div className="flex gap-1">
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-md font-medium">BETA</span>
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-md font-medium">NOVO</span>
                        </div>
                    </div>
                </div>
            </Button>
        </motion.div>
    )
}
