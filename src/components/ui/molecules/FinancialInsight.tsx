"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TrendingUp, TrendingDown, Sun, Moon, Lightbulb, CheckCircle, ArrowRight, Info } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/atoms/dialog"
import { Button } from "@/components/ui/atoms/button"

interface InsightItem {
    id: string;
    type: "weekly" | "monthly" | "category" | "zero_spend" | "tip" | "general";
    text: string;
    value: string;
    trend: "positive" | "negative" | "neutral";
    details?: string;
    recommendation?: string;
}

interface InsightData {
    greeting: string;
    insights: InsightItem[];
    dailySummary: {
        total: number;
    };
}

interface FinancialInsightProps {
    userRequestName?: string
    profileId?: string
    loading?: boolean
    compact?: boolean
    refreshTrigger?: unknown
}

export function FinancialInsight({ userRequestName, profileId, loading = false, compact = false, refreshTrigger }: FinancialInsightProps) {
    const [data, setData] = useState<InsightData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const query = profileId ? `?profileId=${profileId}` : "";
                const res = await fetch(`/api/insights${query}`);
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (error) {
                console.error("Failed to fetch insights", error)
            } finally {
                setIsLoading(false)
            }
        }

        if (!loading) {
            fetchInsights()
        }
    }, [profileId, loading, refreshTrigger])

    // Carousel Logic
    useEffect(() => {
        if (!data || data.insights.length <= 1 || isPaused || isModalOpen) return;

        timerRef.current = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % data.insights.length);
        }, 5000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        }
    }, [data, isPaused, isModalOpen]);

    if (loading || isLoading) {
        return (
            <div className={`animate-pulse bg-gray-200 dark:bg-gray-800 rounded-xl ${compact ? 'h-20 w-full' : 'h-24 w-full'}`}></div>
        )
    }

    if (!data) return null;

    const currentInsight = data.insights[currentIndex] || data.insights[0];
    const { greeting, dailySummary } = data;

    const isPositive = currentInsight.trend === "positive";
    const isNegative = currentInsight.trend === "negative";

    // Icons
    const getIcon = () => {
        if (currentInsight.type === 'tip') return Lightbulb;
        if (currentInsight.type === 'zero_spend') return CheckCircle;
        if (isPositive) return TrendingUp;
        if (isNegative) return TrendingDown;
        return Info;
    }
    const TrendIcon = getIcon();

    // Colors
    const getColors = () => {
        if (currentInsight.type === 'tip') return "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30";
        if (isPositive) return "text-green-500 bg-green-100 dark:bg-green-900/30";
        if (isNegative) return "text-red-500 bg-red-100 dark:bg-red-900/30";
        return "text-blue-500 bg-blue-100 dark:bg-blue-900/30";
    }
    const colorClass = getColors();
    const trendTextColor = isPositive ? "text-green-600 dark:text-green-400" : (isNegative ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400");

    const handleCardClick = () => {
        setIsModalOpen(true);
    }

    return (
        <>
            {/* Main Widget Card */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm w-full cursor-pointer group hover:shadow-md transition-all duration-300"
                onClick={handleCardClick}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                {/* Background Gradient Effect */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

                <div className="flex flex-row items-center justify-between p-4">
                    {/* Left: Dynamic Content (Carousel) */}
                    <div className="flex-1 mr-4 min-w-0"> {/* min-w-0 prevents flex overflow */}
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                {greeting}, {userRequestName?.split(" ")[0]}
                                {data.insights.length > 1 && (
                                    <span className="bg-gray-100 dark:bg-gray-700 text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                                        {currentIndex + 1}/{data.insights.length}
                                    </span>
                                )}
                            </span>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentInsight.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="flex flex-col"
                            >
                                <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 leading-tight">
                                    {currentInsight.text}
                                </h3>

                                <div className="flex items-center gap-2 mt-1">
                                    {currentInsight.value !== "---" && (
                                        <span className={`text-xs font-bold ${trendTextColor}`}>
                                            {currentInsight.value}
                                        </span>
                                    )}
                                    <span className="text-[10px] text-blue-500 font-medium flex items-center group-hover:underline">
                                        Ver detalhes <ArrowRight className="w-3 h-3 ml-0.5" />
                                    </span>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Right: Icon / Visual */}
                    <div className={`p-3 rounded-xl flex-shrink-0 ${colorClass} transition-colors duration-300`}>
                        <TrendIcon className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                </div>

                {/* Progress Bar (Auto-play indicator) */}
                {data.insights.length > 1 && !isPaused && (
                    <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 5, ease: "linear", repeat: Infinity }} // Matches interval
                        className="absolute bottom-0 left-0 h-1 bg-blue-500/20"
                    />
                )}
            </motion.div>

            {/* Smart Recommendation Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className={`w-12 h-12 rounded-full ${colorClass} flex items-center justify-center mb-4 mx-auto sm:mx-0`}>
                            <TrendIcon className="w-6 h-6" />
                        </div>
                        <DialogTitle className="text-xl text-center sm:text-left">{currentInsight.text}</DialogTitle>
                        {dailySummary.total > 0 && (
                            <DialogDescription className="text-center sm:text-left mt-1">
                                Gastos de hoje: <span className="font-bold text-gray-900 dark:text-gray-100">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(dailySummary.total)}</span>
                            </DialogDescription>
                        )}
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-200 mb-1">Análise</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                {currentInsight.details || "Baseado nos seus padrões de gastos recentes."}
                            </p>
                        </div>

                        {currentInsight.recommendation && (
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/20">
                                <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1 flex items-center gap-2">
                                    <Lightbulb className="w-4 h-4" /> Recomendação Inteligente
                                </h4>
                                <p className="text-sm text-blue-700 dark:text-blue-200 leading-relaxed">
                                    {currentInsight.recommendation}
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="sm:justify-between flex-row gap-2">
                        {data.insights.length > 1 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentIndex((prev) => (prev + 1) % data.insights.length);
                                }}
                                className="text-gray-500"
                            >
                                Próximo Insight
                            </Button>
                        )}
                        <Button type="button" variant="default" onClick={() => setIsModalOpen(false)} className="flex-1 sm:flex-none">
                            Entendi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
