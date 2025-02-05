"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import type React from "react" 

const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
]

interface SliderMonthSelectorProps {
    onSelectMonth: (month: number) => void
}

export default function SliderMonthSelector({ onSelectMonth }: SliderMonthSelectorProps) {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const sliderRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        onSelectMonth(selectedMonth)
    }, [selectedMonth, onSelectMonth])

    const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedMonth(Number(event.target.value))
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowLeft") {
            setSelectedMonth((prev) => Math.max(1, prev - 1))
        } else if (event.key === "ArrowRight") {
            setSelectedMonth((prev) => Math.min(12, prev + 1))
        }
    }

    return (
        <div className="w-full max-w-md mx-auto p-4">
            <div className="relative mb-2">
                <input
                    ref={sliderRef}
                    type="range"
                    min="1"
                    max="12"
                    value={selectedMonth}
                    onChange={handleSliderChange}
                    onKeyDown={handleKeyDown}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <div className="absolute top-6 left-0 right-0 flex justify-between px-2">
                    {months.map((_, index) => (
                        <div key={index} className="h-3 w-0.5 bg-gray-300 dark:bg-gray-600" />
                    ))}
                </div>
            </div>
            <motion.div
                className="text-center text-2xl font-bold mt-4 dark:text-white"
                key={selectedMonth}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                {months[selectedMonth - 1]}
            </motion.div>
        </div>
    )
}

