"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Filter, X } from "lucide-react"
import { Button } from "../atoms/button"

const months = [
    { short: "Jan", full: "Janeiro" }, { short: "Fev", full: "Fevereiro" },
    { short: "Mar", full: "Março" }, { short: "Abr", full: "Abril" },
    { short: "Mai", full: "Maio" }, { short: "Jun", full: "Junho" },
    { short: "Jul", full: "Julho" }, { short: "Ago", full: "Agosto" },
    { short: "Set", full: "Setembro" }, { short: "Out", full: "Outubro" },
    { short: "Nov", full: "Novembro" }, { short: "Dez", full: "Dezembro" },
]

interface TimelineMonthSelectorProps {
    onSelectMonth: (month: number | null) => void
    selectedMonth?: number | null // Controlled prop (1-12)
}

export default function TimelineMonthSelector({ onSelectMonth, selectedMonth }: TimelineMonthSelectorProps) {
    // If selectedMonth is provided (1-12), use it (convert to 0-11 index). 
    // Else default to current month.
    const getInitialIndex = () => {
        if (selectedMonth) return selectedMonth - 1;
        return new Date().getMonth();
    }

    const [isFiltering, setIsFiltering] = useState(!!selectedMonth)
    const [focusedIndex, setFocusedIndex] = useState(getInitialIndex())

    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const isProgrammaticScroll = useRef(false)

    const ITEM_WIDTH = 100;

    const scrollToMonth = (index: number, smooth = true) => {
        if (scrollContainerRef.current) {
            isProgrammaticScroll.current = true;
            const scrollPos = index * ITEM_WIDTH
            scrollContainerRef.current.scrollTo({
                left: scrollPos,
                behavior: smooth ? 'smooth' : 'instant'
            })
            // Reset flag after animation
            setTimeout(() => { isProgrammaticScroll.current = false }, 500)
            setFocusedIndex(index)
        }
    }

    // Sync with external prop selectedMonth
    useEffect(() => {
        if (selectedMonth !== undefined && selectedMonth !== null) {
            const index = selectedMonth - 1;
            if (index !== focusedIndex) {
                setIsFiltering(true);
                setFocusedIndex(index);
                // Delay scroll slightly to ensure layout is ready or if it's a remount
                setTimeout(() => scrollToMonth(index, false), 50);
            }
        } else if (selectedMonth === null && isFiltering) {
            // If external prop set to null, clear internal filter
            setIsFiltering(false);
            // Optional: Scroll to current month or stay put? 
            // Let's stay put but exit filter mode.
        }
    }, [selectedMonth])


    const handleSelect = (index: number) => {
        // Optimistic UI update
        setIsFiltering(true)
        setFocusedIndex(index)
        scrollToMonth(index)
        onSelectMonth(index + 1)
    }

    const handleClear = () => {
        setIsFiltering(false)
        onSelectMonth(null)
        // Scroll back to current month
        const currentMonth = new Date().getMonth()
        setFocusedIndex(currentMonth)
        scrollToMonth(currentMonth)
    }

    const onScroll = () => {
        if (!scrollContainerRef.current || isProgrammaticScroll.current) return;

        const scrollLeft = scrollContainerRef.current.scrollLeft;
        const index = Math.round(scrollLeft / ITEM_WIDTH);
        const clampedIndex = Math.max(0, Math.min(11, index));

        if (clampedIndex !== focusedIndex) {
            setFocusedIndex(clampedIndex);

            if (timeoutRef.current) clearTimeout(timeoutRef.current);

            timeoutRef.current = setTimeout(() => {
                setIsFiltering(true);
                onSelectMonth(clampedIndex + 1);
            }, 500);
        }
    }

    // Initial center on mount
    useEffect(() => {
        setTimeout(() => scrollToMonth(focusedIndex, false), 100)
    }, [])

    return (
        <div className="w-full flex flex-col gap-4 my-6">

            {/* Header */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-medium uppercase tracking-wide">
                        {isFiltering ? "Filtrando por:" : "Mostrando:"}
                    </span>
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={isFiltering ? focusedIndex : "all"}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className={`text-sm font-bold ${isFiltering ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}
                        >
                            {isFiltering ? months[focusedIndex].full : "Todas as Transações"}
                        </motion.span>
                    </AnimatePresence>
                </div>

                {isFiltering && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        className="text-xs h-7 hover:bg-red-50 hover:text-red-600 text-gray-400"
                    >
                        Limpar <X className="w-3 h-3 ml-1" />
                    </Button>
                )}
            </div>

            {/* Carousel */}
            <div className="relative group">
                {/* Center Bracket */}
                <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[100px] pointer-events-none z-10 flex flex-col items-center justify-center">
                    <div className={`w-2 h-2 rounded-full mb-auto transition-colors duration-300 ${isFiltering ? 'bg-blue-500' : 'bg-gray-300'}`} />
                    <div className={`absolute inset-0 rounded-2xl border-2 transition-colors duration-300 ${isFiltering ? 'border-blue-500/50 bg-blue-500/5' : 'border-gray-200 dark:border-gray-700'}`} />
                    <div className={`w-2 h-2 rounded-full mt-auto transition-colors duration-300 ${isFiltering ? 'bg-blue-500' : 'bg-gray-300'}`} />
                </div>

                {/* Nav Arrows */}
                <Button variant="ghost" size="icon" className="absolute left-0 top-1/2 -translate-y-1/2 z-20 hidden md:flex hover:bg-transparent hover:text-blue-500" onClick={() => handleSelect(Math.max(0, focusedIndex - 1))}>
                    <ChevronLeft className="w-8 h-8 opacity-50" />
                </Button>
                <Button variant="ghost" size="icon" className="absolute right-0 top-1/2 -translate-y-1/2 z-20 hidden md:flex hover:bg-transparent hover:text-blue-500" onClick={() => handleSelect(Math.min(11, focusedIndex + 1))}>
                    <ChevronRight className="w-8 h-8 opacity-50" />
                </Button>

                {/* Track */}
                <div
                    ref={scrollContainerRef}
                    onScroll={onScroll}
                    className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory py-6"
                    style={{ scrollPaddingLeft: '50%', scrollPaddingRight: '50%' }}
                >
                    <div className="w-[calc(50%-50px)] flex-shrink-0" />
                    {months.map((month, index) => {
                        const isActive = focusedIndex === index;
                        return (
                            <button
                                key={month.short}
                                onClick={() => handleSelect(index)}
                                className={`flex-shrink-0 w-[100px] h-[80px] snap-center flex flex-col items-center justify-center transition-all duration-300 transform ${isActive ? 'scale-100 opacity-100' : 'scale-75 opacity-40 hover:opacity-70'}`}
                            >
                                <span className={`text-2xl font-bold mb-1 transition-colors ${isActive && isFiltering ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500'}`}>
                                    {month.short}
                                </span>
                                {isActive && (
                                    <motion.span layoutId="activeLabel" className="text-[10px] uppercase font-bold tracking-widest text-gray-500">
                                        2025
                                    </motion.span>
                                )}
                            </button>
                        )
                    })}
                    <div className="w-[calc(50%-50px)] flex-shrink-0" />
                </div>
            </div>
            <p className="text-center text-xs text-gray-400 -mt-2">Deslize para selecionar</p>
        </div>
    )
}
