"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface TooltipProps {
    title: string
    children: React.ReactNode
    position?: "top" | "bottom" | "left" | "right" | "auto"
    arrow?: boolean
    delay?: number
    className?: string
}

export function Tooltip({
                            title,
                            children,
                            position = "auto",
                            arrow = true,
                            delay = 500,
                            className = "",
                        }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [showTooltip, setShowTooltip] = useState(false)
    const [calculatedPosition, setCalculatedPosition] = useState<"top" | "bottom" | "left" | "right">("top")
    const timeoutRef = useRef<NodeJS.Timeout>()
    const tooltipRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLDivElement>(null)

    const calculatePosition = () => {
        if (!triggerRef.current || position !== "auto") {
            setCalculatedPosition(position as "top" | "bottom" | "left" | "right")
            return
        }

        const triggerRect = triggerRef.current.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        // Espaço disponível em cada direção
        const spaceTop = triggerRect.top
        const spaceBottom = viewportHeight - triggerRect.bottom
        const spaceLeft = triggerRect.left
        const spaceRight = viewportWidth - triggerRect.right

        // Determinar a melhor posição baseada no espaço disponível
        if (spaceTop > 60 && spaceTop >= spaceBottom) {
            setCalculatedPosition("top")
        } else if (spaceBottom > 60) {
            setCalculatedPosition("bottom")
        } else if (spaceRight > 150) {
            setCalculatedPosition("right")
        } else if (spaceLeft > 150) {
            setCalculatedPosition("left")
        } else {
            setCalculatedPosition("top") // fallback
        }
    }

    const handleMouseEnter = () => {
        calculatePosition()
        timeoutRef.current = setTimeout(() => {
            setIsVisible(true)
            setShowTooltip(true)
        }, delay)
    }

    const handleMouseLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
        setIsVisible(false)
        setTimeout(() => setShowTooltip(false), 150)
    }

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    const getPositionClasses = () => {
        switch (calculatedPosition) {
            case "top":
                return "bottom-full left-1/2 transform -translate-x-1/2 mb-2"
            case "bottom":
                return "top-full left-1/2 transform -translate-x-1/2 mt-2"
            case "left":
                return "right-full top-1/2 transform -translate-y-1/2 mr-2"
            case "right":
                return "left-full top-1/2 transform -translate-y-1/2 ml-2"
            default:
                return "bottom-full left-1/2 transform -translate-x-1/2 mb-2"
        }
    }

    const getArrowClasses = () => {
        switch (calculatedPosition) {
            case "top":
                return "top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800"
            case "bottom":
                return "bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800"
            case "left":
                return "left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800"
            case "right":
                return "right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800"
            default:
                return "top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800"
        }
    }

    return (
        <div
            ref={triggerRef}
            className={`relative inline-block ${className}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}

            <AnimatePresence>
                {showTooltip && (
                    <motion.div
                        ref={tooltipRef}
                        className={`absolute z-[9999] ${getPositionClasses()}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.8 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        style={{ pointerEvents: "none" }}
                    >
                        <div className="bg-gray-800 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap max-w-xs">
                            {title}
                        </div>

                        {arrow && (
                            <div className={`absolute w-0 h-0 border-4 ${getArrowClasses()}`} style={{ borderWidth: "4px" }} />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// Versão simplificada sem animações (mais performática)
export function SimpleTooltip({
                                  title,
                                  children,
                                  className = "",
                              }: {
    title: string
    children: React.ReactNode
    className?: string
}) {
    return (
        <div className={`group relative inline-block ${className}`}>
            {children}
            <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[9999] pointer-events-none">
                <div className="bg-gray-800 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">{title}</div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-4 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800" />
            </div>
        </div>
    )
}
