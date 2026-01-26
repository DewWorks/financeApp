"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TrendingUp, TrendingDown, Sun, Moon, Lightbulb, CheckCircle, ArrowRight, Info } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/atoms/dialog"
import { Button } from "@/components/ui/atoms/button"
import { usePlanGate } from "@/context/PlanGateContext"
import { PlanType } from "@/interfaces/IUser"

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Area, ComposedChart } from 'recharts';

interface InsightItem {
    id: string;
    type: "weekly" | "monthly" | "category" | "zero_spend" | "tip" | "general";
    text: string;
    value: string;
    trend: "positive" | "negative" | "neutral";
    details?: string;
    recommendation?: string;
    richData?: {
        projection?: {
            current: number;
            projected: number;
            dailyAvg: number;
            daysRemaining: number;
            breakdown?: {
                fixed: number;
                variable: number;
                fixedItems: string[];
                variableItems: string[];
            };
        };
        comparison?: {
            expense: number;
            income: number;
            ratio: number;
        };
        status?: "good" | "warning" | "critical" | "excellent";
    };
}
// ... (rest of interfaces)

// Helper for Status Badge
const getStatusBadge = (status: string) => {
    switch (status) {
        case 'excellent': return <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-2 py-0.5 rounded text-xs font-bold">Excelente</span>;
        case 'good': return <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded text-xs font-bold">Bom</span>;
        case 'warning': return <span className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 px-2 py-0.5 rounded text-xs font-bold">Atenção</span>;
        case 'critical': return <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-2 py-0.5 rounded text-xs font-bold">Crítico</span>;
        default: return null;
    }
}

// ... inside the component DialogContent ...



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
    scope?: 'recent' | 'all'
}

export function FinancialInsight({ userRequestName, profileId, loading = false, compact = false, refreshTrigger, scope = 'recent' }: FinancialInsightProps) {
    const [data, setData] = useState<InsightData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const { checkFeature, openUpgradeModal, currentPlan } = usePlanGate()

    // Static Teaser Data for Free Users
    const teaserData: InsightData = {
        greeting: "Olá",
        dailySummary: { total: 0 },
        insights: [
            {
                id: "teaser-1",
                type: "tip",
                text: "Dica Financeira Exclusiva",
                value: "R$ ???",
                trend: "neutral",
                details: "Essa análise detalhada está disponível apenas para usuários Premium.",
                recommendation: "Atualize para o plano PRO para desbloquear insights personalizados de economia."
            }
        ]
    };

    useEffect(() => {
        const fetchInsights = async () => {
            // Optimization: Do not fetch for FREE users to save API costs
            if (currentPlan === PlanType.FREE) {
                setData(teaserData);
                setIsLoading(false);
                return;
            }

            try {
                const query = new URLSearchParams()
                if (profileId) query.append("profileId", profileId)
                if (scope) query.append("scope", scope)

                const res = await fetch(`/api/insights?${query.toString()}`);
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
    }, [profileId, loading, refreshTrigger, scope, currentPlan])

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
        if (!checkFeature('DEEP_INSIGHTS')) {
            openUpgradeModal("Tenha projeções financeiras detalhadas com Inteligência Artificial no plano MAX.", 'MAX');
            return;
        }
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

                <div className="flex flex-row items-center justify-between p-3 sm:p-4">
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
                <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden rounded-2xl flex flex-col">
                    {/* Header: Sticky Top */}
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0 bg-white dark:bg-gray-900 z-10">
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
                    </div>

                    {/* Body: Scrollable Content if needed */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {currentInsight.richData ? (
                            // --- RICH UI LAYOUT ---
                            // --- RICH UI LAYOUT ---
                            <div className="space-y-3">
                                {/* Top Grid: Projection + Comparison */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* 1. Projection Highlight */}
                                    <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">Projeção Final</p>
                                            {getStatusBadge(currentInsight.richData.status || 'good')}
                                        </div>
                                        <div>
                                            <div className="flex items-baseline gap-2">
                                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(currentInsight.richData.projection?.projected || 0)}
                                                </h2>
                                                <span className="text-[10px] text-gray-400">estimado</span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 leading-tight mt-1">
                                                Baseado no seu histórico e inteligência.
                                            </p>
                                        </div>
                                    </div>

                                    {/* 2. Comparison Card */}
                                    <div className="grid grid-rows-2 gap-2">
                                        <div className="bg-red-50 dark:bg-red-900/10 px-3 py-2 rounded-lg border border-red-100 dark:border-red-900/20 flex items-center justify-between">
                                            <p className="text-[10px] text-red-600 dark:text-red-400 uppercase font-bold">Despesas (Est.)</p>
                                            <p className="text-sm font-bold text-red-700 dark:text-red-300">
                                                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(currentInsight.richData.comparison?.expense || 0)}
                                            </p>
                                        </div>
                                        <div className="bg-green-50 dark:bg-green-900/10 px-3 py-2 rounded-lg border border-green-100 dark:border-green-900/20 flex items-center justify-between">
                                            <p className="text-[10px] text-green-600 dark:text-green-400 uppercase font-bold">Receita (Est.)</p>
                                            <p className="text-sm font-bold text-green-700 dark:text-green-300">
                                                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(currentInsight.richData.comparison?.income || 0)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Modern Projection Graph (Compacted) */}
                                <div className="h-32 sm:h-40 w-full bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col relative">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Evolução Mensal</p>
                                        <div className="flex gap-2 text-[9px]">
                                            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>Real</span>
                                            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-400 opacity-50"></div>Proj.</span>
                                            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>Ideal</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 min-h-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart
                                                data={[
                                                    { day: 'D1', actual: 0, projected: 0, ideal: 0 },
                                                    {
                                                        day: 'Hoje',
                                                        actual: currentInsight.richData.projection?.current || 0,
                                                        projected: currentInsight.richData.projection?.current || 0,
                                                        ideal: ((currentInsight.richData.comparison?.income || 1) / 30) * (data.insights[0].richData?.projection?.daysRemaining ? (30 - data.insights[0].richData.projection.daysRemaining) : 15)
                                                    },
                                                    {
                                                        day: 'D30',
                                                        actual: null,
                                                        projected: currentInsight.richData.projection?.projected || 0,
                                                        ideal: currentInsight.richData.comparison?.income || 0
                                                    }
                                                ]}
                                                margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                                            >
                                                <defs>
                                                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9ca3af' }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9ca3af' }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                                                <Tooltip
                                                    cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '4 4' }}
                                                    contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1f2937', color: '#f3f4f6', fontSize: '10px', padding: '4px 8px' }}
                                                    itemStyle={{ padding: 0 }}
                                                />

                                                <Line type="monotone" dataKey="ideal" stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 4" dot={false} activeDot={false} opacity={0.8} />
                                                <Line type="monotone" dataKey="projected" stroke="#60a5fa" strokeWidth={1.5} strokeDasharray="3 3" dot={{ r: 3, strokeWidth: 1.5 }} />
                                                <Area type="monotone" dataKey="actual" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" dot={{ r: 4, strokeWidth: 1.5, fill: '#fff', stroke: '#2563eb' }} />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Fixed Cost Breakdown (Compacted) */}
                                {currentInsight.richData.projection?.breakdown && currentInsight.richData.projection.breakdown.fixed > 0 && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded border border-gray-100 dark:border-gray-800">
                                            <span className="block text-[9px] text-gray-400 mb-0.5">Custos Fixos</span>
                                            <span className="font-bold text-gray-700 dark:text-gray-200 text-sm">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(currentInsight.richData.projection.breakdown.fixed)}</span>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded border border-gray-100 dark:border-gray-800">
                                            <span className="block text-[9px] text-gray-400 mb-0.5">Variáveis (Est.)</span>
                                            <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(currentInsight.richData.projection.breakdown.variable)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // --- STANDARD LAYOUT ---
                            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-200 mb-1">Análise</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {currentInsight.details || "Baseado nos seus padrões de gastos recentes."}
                                </p>
                            </div>
                        )}

                        {currentInsight.recommendation && (
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/20">
                                <h4 className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1 flex items-center gap-1.5">
                                    <Lightbulb className="w-3.5 h-3.5" /> Recomendação
                                </h4>
                                <p className="text-xs text-blue-700 dark:text-blue-200 leading-relaxed">
                                    {currentInsight.recommendation}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Internal Upsell Removed - Gated on Entry */}

                    {/* Footer: Sticky Bottom */}
                    <DialogFooter className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex flex-row gap-2 flex-shrink-0 sm:justify-between">
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
