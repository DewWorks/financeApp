"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "../atoms/button"

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

interface TimelineMonthSelectorProps {
    onSelectMonth: (month: number | null) => void
}

export default function TimelineMonthSelector({ onSelectMonth }: TimelineMonthSelectorProps) {
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    const handleMonthClick = (monthIndex: number) => {
        const newSelectedMonth = selectedMonth === monthIndex + 1 ? null : monthIndex + 1
        setSelectedMonth(newSelectedMonth)
        onSelectMonth(newSelectedMonth)
    }

    const scroll = (direction: "left" | "right") => {
        if (scrollContainerRef.current) {
            const scrollAmount = direction === "left" ? -200 : 200
            scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
        }
    }

    useEffect(() => {
        const container = scrollContainerRef.current
        if (container) {
            const handleWheel = (e: WheelEvent) => {
                if (e.deltaY !== 0) {
                    e.preventDefault()
                    container.scrollLeft += e.deltaY
                }
            }
            container.addEventListener("wheel", handleWheel, { passive: false })
            return () => container.removeEventListener("wheel", handleWheel)
        }
    }, [])

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <div className="relative">
                <Button
                    onClick={() => scroll("left")}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 p-2 rounded-full shadow-md"
                >
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <div
                    ref={scrollContainerRef}
                    className="flex overflow-x-auto scrollbar-hide space-x-4 p-4"
                    style={{ scrollSnapType: "x mandatory" }}
                >
                    {months.map((month, index) => (
                        <motion.button
                            key={month}
                            className={`flex-shrink-0 w-40 h-40 rounded-lg shadow-md flex flex-col items-center justify-center transition-colors
                ${
                                selectedMonth === index + 1
                                    ? "bg-blue-500 text-white"
                                    : "bg-white text-gray-800 hover:bg-blue-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                            }`}
                            onClick={() => handleMonthClick(index)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{ scrollSnapAlign: "center" }}
                        >
                            <span className="text-3xl font-bold mb-2">{index + 1}</span>
                            <span className="text-lg font-medium">{month}</span>
                        </motion.button>
                    ))}
                </div>
                <Button
                    onClick={() => scroll("right")}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 p-2 rounded-full shadow-md"
                >
                    <ChevronRight className="w-6 h-6" />
                </Button>
            </div>
            {selectedMonth && (
                <motion.button
                    className="mt-6 p-2 rounded-full bg-red-500 text-white flex items-center justify-center mx-auto"
                    onClick={() => handleMonthClick(selectedMonth - 1)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <span>Limpar Seleção ({months[selectedMonth - 1]})</span>
                </motion.button>
            )}
        </div>
    )
}

