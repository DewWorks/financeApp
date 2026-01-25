"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TrendingUp, TrendingDown, Sun, Moon, Lightbulb, CheckCircle, ArrowRight, Info } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/atoms/dialog"
import { Button } from "@/components/ui/atoms/button"
import { usePlanGate } from "@/context/PlanGateContext"

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
    const { checkFeature, openUpgradeModal } = usePlanGate()

    useEffect(() => {
        const fetchInsights = async () => {
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
    }, [profileId, loading, refreshTrigger, scope])

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
                        {currentInsight.richData ? (
                            // --- RICH UI LAYOUT ---
                            <div className="space-y-4">
                                {/* 1. Projection Highlight */}
                                <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-2 right-2">
                                        {getStatusBadge(currentInsight.richData.status || 'good')}
                                    </div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Projeção Final</p>
                                    <div className="flex items-baseline gap-2">
                                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(currentInsight.richData.projection?.projected || 0)}
                                        </h2>
                                        <span className="text-xs text-gray-400">estimado</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Essa é a projeção de gastos, baseado no seu histórico e inteligência
                                    </p>
                                </div>

                                {/* 2. Comparison Card */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/20">
                                        <p className="text-[10px] text-red-600 dark:text-red-400 uppercase font-bold">Despesas (Est.)</p>
                                        <p className="text-lg font-bold text-red-700 dark:text-red-300">
                                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(currentInsight.richData.comparison?.expense || 0)}
                                        </p>
                                    </div>
                                    <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-lg border border-green-100 dark:border-green-900/20">
                                        <p className="text-[10px] text-green-600 dark:text-green-400 uppercase font-bold">Receita (Est.)</p>
                                        <p className="text-lg font-bold text-green-700 dark:text-green-300">
                                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(currentInsight.richData.comparison?.income || 0)}
                                        </p>
                                    </div>
                                </div>

                                {/* 3. Radial Gauge Chart */}
                                {/* 3. Modern Projection Graph */}
                                <div className="h-64 w-full mt-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col relative">
                                    <div className="flex justify-between items-center mb-4">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Evolução Mensal</p>
                                        <div className="flex gap-3 text-[10px]">
                                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-600"></div>Real</span>
                                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-400 opacity-50"></div>Projeção</span>
                                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div>Ideal</span>
                                        </div>
                                    </div>

                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart
                                            data={[
                                                { day: 'Dia 1', actual: 0, projected: 0, ideal: 0 },
                                                {
                                                    day: 'Hoje',
                                                    actual: currentInsight.richData.projection?.current || 0,
                                                    projected: currentInsight.richData.projection?.current || 0,
                                                    ideal: ((currentInsight.richData.comparison?.income || 1) / 30) * (data.insights[0].richData?.projection?.daysRemaining ? (30 - data.insights[0].richData.projection.daysRemaining) : 15)
                                                },
                                                {
                                                    day: 'Dia 30',
                                                    actual: null,
                                                    projected: currentInsight.richData.projection?.projected || 0,
                                                    ideal: currentInsight.richData.comparison?.income || 0
                                                }
                                            ]}
                                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                        >
                                            <defs>
                                                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`} />
                                            <Tooltip
                                                cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '4 4' }}
                                                contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1f2937', color: '#f3f4f6', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                                itemStyle={{ fontSize: '12px', paddingTop: '2px', paddingBottom: '2px' }}
                                                labelStyle={{ fontSize: '10px', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase' }}
                                                formatter={(value: number, name: string) => {
                                                    const formatted = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
                                                    if (name === 'ideal') return [formatted, 'Ritmo Ideal'];
                                                    if (name === 'actual') return [formatted, 'Gasto Real'];
                                                    if (name === 'projected') return [formatted, 'Projeção Final'];
                                                    return [formatted, name];
                                                }}
                                            />

                                            {/* Ideal Line (Green) */}
                                            <Line type="monotone" dataKey="ideal" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={false} opacity={0.8} />

                                            {/* Projected Line (Blue Dashed) - Connects to Actual */}
                                            <Line type="monotone" dataKey="projected" stroke="#60a5fa" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 4, strokeWidth: 2 }} />

                                            {/* Actual Area (Blue Solid) */}
                                            <Area type="monotone" dataKey="actual" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" dot={{ r: 6, strokeWidth: 2, fill: '#fff', stroke: '#2563eb' }} />
                                        </ComposedChart>
                                    </ResponsiveContainer>

                                    {/* Fixed Cost Breakdown */}
                                    {currentInsight.richData.projection?.breakdown && currentInsight.richData.projection.breakdown.fixed > 0 && (
                                        <div className="mt-4 px-2 text-[10px] text-gray-500 flex flex-col gap-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                                            <div className="flex justify-between items-center">
                                                <p className="font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Detalhamento da Projeção</p>
                                                <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full text-[9px] font-bold">Total: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(currentInsight.richData.projection.projected)}</span>
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="flex-1 bg-white dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700 flex flex-col max-h-[80px]">
                                                    <span className="block text-[9px] text-gray-400 mb-0.5">Custos Fixos</span>
                                                    <span className="font-bold text-gray-700 dark:text-gray-200 text-sm block mb-1">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(currentInsight.richData.projection.breakdown.fixed)}</span>
                                                    {currentInsight.richData.projection.breakdown.fixedItems && currentInsight.richData.projection.breakdown.fixedItems.length > 0 && (
                                                        <div className="overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                                                            <p className="text-[9px] text-gray-500 leading-tight">
                                                                {currentInsight.richData.projection.breakdown.fixedItems.join(", ")}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 bg-white dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700 flex flex-col max-h-[80px]">
                                                    <span className="block text-[9px] text-gray-400 mb-0.5">Variáveis (Est.)</span>
                                                    <span className="font-bold text-blue-600 dark:text-blue-400 text-sm block mb-1">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(currentInsight.richData.projection.breakdown.variable)}</span>
                                                    {currentInsight.richData.projection.breakdown.variableItems && currentInsight.richData.projection.breakdown.variableItems.length > 0 && (
                                                        <div className="overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                                                            <p className="text-[9px] text-gray-500 leading-tight">
                                                                {currentInsight.richData.projection.breakdown.variableItems.join(", ")}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
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

                    {!checkFeature('DEEP_INSIGHTS') && (
                        <div className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/40 p-3 rounded-lg border border-purple-200 dark:border-purple-800 mb-2 cursor-pointer transition-transform hover:scale-[1.02]" onClick={() => openUpgradeModal("Tenha projeções financeiras detalhadas com Inteligência Artificial no plano MAX.", 'MAX')}>
                            <div className="flex items-center gap-3">
                                <div className="bg-purple-200 dark:bg-purple-800 p-2 rounded-full">
                                    <Lightbulb className="w-5 h-5 text-purple-700 dark:text-purple-300" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-purple-900 dark:text-purple-100">Desbloquear IA Financeira</h4>
                                    <p className="text-xs text-purple-700 dark:text-purple-300 leading-tight mt-0.5">
                                        Veja projeções futuras e recomendações avançadas.
                                    </p>
                                </div>
                                <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white h-7 text-xs">
                                    Ver MAX
                                </Button>
                            </div>
                        </div>
                    )}

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
