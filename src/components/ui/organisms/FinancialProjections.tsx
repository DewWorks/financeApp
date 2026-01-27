"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card";
import { IGoal } from "@/interfaces/IGoal";
import { ITransaction } from "@/interfaces/ITransaction";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, AlertTriangle, Calendar, DollarSign, Activity } from 'lucide-react';

interface FinancialProjectionsProps {
    goals: IGoal[];
    transactions: ITransaction[];
    type: 'savings' | 'spending';
}

export function FinancialProjections({ goals, transactions, type }: FinancialProjectionsProps) {
    // 1. Calculate Aggregates
    const relevantGoals = goals.filter(g => (g.type || 'savings') === type);
    const totalTarget = relevantGoals.reduce((acc, g) => acc + g.targetAmount, 0);

    // 2. Prepare Chart Data (Time Series)
    // We'll project 30 days into the future or look back 30 days depending on type
    const generateChartData = () => {
        const data = [];
        const today = new Date();
        const daysToShow = 30;

        if (type === 'savings') {
            // For Savings: Show growth over last 3 months + projection
            // Simplified: Just 30 days history for now
            let currentTotal = 0;
            // Mocking cumulative growth for visualization as we don't have historical snapshots of goals
            // In a real app, we'd query historical balances. 
            // Here we'll simulate a linear progression based on transactions

            // Get all relevant transactions
            const relevantTags = relevantGoals.map(g => g.tag);
            const sortedTransactions = transactions
                .filter(t => t.type === 'income' && relevantTags.includes(t.tag))
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            // Create a map of date -> amount
            const dateMap = new Map<string, number>();
            sortedTransactions.forEach(t => {
                const dateKey = new Date(t.date).toLocaleDateString();
                const current = dateMap.get(dateKey) || 0;
                dateMap.set(dateKey, current + t.amount);
            });

            // Fill last 30 days
            for (let i = 29; i >= 0; i--) {
                const d = new Date();
                d.setDate(today.getDate() - i);
                const dateKey = d.toLocaleDateString();
                const dailyAmount = dateMap.get(dateKey) || 0;
                currentTotal += dailyAmount; // Cumulative
                // If no transaction history, we might start at 0. 
                // Realistically we should start at (Total Current - Transactions in view). 
                // For now, let's just plot the "Ideal" vs "Actual" if possible, or just the curve.
            }
            // Fallback: If no complex history, simpler visualization:
            // Just show "Ideal Pace" vs "Current Total" as a bar? 
            // Let's do a "Projection" based on avg savings.
        }

        // Simpler approach for "Demo":
        // Spending: Burnup Chart (Day 1 to 30/31 of current month)
        if (type === 'spending') {
            const currentMonth = today.getMonth();
            const daysInMonth = new Date(today.getFullYear(), currentMonth + 1, 0).getDate();

            let cumulativeSpend = 0;
            // Filter transactions for this month
            const thisMonthTransactions = transactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate.getMonth() === currentMonth && tDate.getFullYear() === today.getFullYear() && t.type === 'expense' && relevantGoals.some(g => g.tag === t.tag);
            }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            for (let i = 1; i <= daysInMonth; i++) {
                const dateStr = `${i}/${currentMonth + 1}`;

                // Add transactions for this day
                const daysTransactions = thisMonthTransactions.filter(t => new Date(t.date).getDate() === i);
                const dailyTotal = daysTransactions.reduce((sum, t) => sum + t.amount, 0);
                cumulativeSpend += dailyTotal;

                // Projection: If today is active, we valid data. Future days = null (unless we project)
                const isFuture = i > today.getDate();

                data.push({
                    name: dateStr,
                    actual: isFuture ? null : cumulativeSpend,
                    limit: totalTarget, // Flat line
                    ideal: (totalTarget / daysInMonth) * i // Diagonal line
                });
            }
        } else {
            // Savings: Growth (Last 6 Months)
            const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(today.getMonth() - i);

                // Fake data for "Savings Growth" demo if real data is scarce
                // In prod: Aggregate transactions by month
                const monthKey = monthNames[d.getMonth()];

                // Calculate actual savings for that month
                const monthTransactions = transactions.filter(t => {
                    const tDate = new Date(t.date);
                    return tDate.getMonth() === d.getMonth() && tDate.getFullYear() === d.getFullYear() && t.type === 'income' && relevantGoals.some(g => g.tag === t.tag);
                });
                const monthTotal = monthTransactions.reduce((sum, t) => sum + t.amount, 0);

                // Accumulate from previous? Or just monthly contributions?
                // Usually "Patrimony" is cumulative.
                // Let's assume linear growth for demo + variance
                data.push({
                    name: monthKey,
                    value: monthTotal,
                    target: totalTarget / 6 // Arbitrary "Monthly Target" visual
                });
            }
        }
        return data;
    };

    const data = generateChartData();

    // 3. Smart Metrics Logic
    const calculateMetrics = () => {
        if (type === 'spending') {
            const today = new Date();
            const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            const daysRemaining = daysInMonth - today.getDate();

            const currentTotal = relevantGoals.reduce((acc, g) => {
                const spent = transactions
                    .filter(t => t.tag === g.tag && t.type === 'expense' && new Date(t.date).getMonth() === today.getMonth())
                    .reduce((sum, t) => sum + t.amount, 0);
                return acc + spent;
            }, 0);

            const remainingBudget = totalTarget - currentTotal;
            const safeDaily = daysRemaining > 0 ? Math.max(0, remainingBudget / daysRemaining) : 0;
            const projectedSpend = currentTotal + (currentTotal / today.getDate()) * daysRemaining;

            return {
                mainMetric: `R$ ${safeDaily.toFixed(2)}`,
                mainLabel: "Pode gastar por dia",
                subMetric: remainingBudget < 0 ? "Orçamento Estourado" : `R$ ${remainingBudget.toFixed(2)} restantes`,
                status: remainingBudget < 0 ? "danger" : (projectedSpend > totalTarget ? "warning" : "success"),
                avgMonthly: 0,
                aiInsight: "Seu ritmo de gastos está " + (remainingBudget < 0 ? "critico! Considere cortar supérfluos hoje." : "saudável. Mantenha assim para sobrar dinheiro.")
            };
        } else {
            // Savings
            const currentTotal = relevantGoals.reduce((acc, g) => {
                const saved = transactions
                    .filter(t => t.tag === g.tag && t.type === 'income')
                    .reduce((sum, t) => sum + t.amount, 0);
                return acc + saved;
            }, 0);

            const remaining = totalTarget - currentTotal;

            // Get relevant income transactions
            const incomeTransactions = transactions
                .filter(t => t.type === 'income' && relevantGoals.some(g => g.tag === t.tag));

            const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);

            // Calculate active months count (Dynamic Average)
            const uniqueMonths = new Set(
                incomeTransactions.map(t => new Date(t.date).toISOString().slice(0, 7)) // YYYY-MM
            ).size;

            const monthsDivisor = Math.max(uniqueMonths, 1);
            const avgMonthly = totalIncome / monthsDivisor;

            const monthsToGoal = remaining > 0 ? (remaining / avgMonthly) : 0;
            const yearsToGoal = monthsToGoal / 12;

            // Context-aware AI Insight
            let insight = "";
            if (remaining <= 0) {
                insight = "Parabéns! Você atingiu sua meta. Defina um novo objetivo para continuar evoluindo.";
            } else if (uniqueMonths <= 1) {
                insight = "Ótimo começo! O segredo agora é a consistência nos aportes mensais.";
            } else if (avgMonthly < 1) {
                insight = "Comece com qualquer valor. O importante é criar o hábito de investir mensalmente.";
            } else if (monthsToGoal > 60) {
                insight = "Aumentar seus aportes mensais reduziria significativamente o tempo de conquista.";
            } else {
                insight = "Excelente consistência! Mantenha os aportes para atingir a meta no prazo estimado.";
            }

            return {
                mainMetric: remaining <= 0 ? "Objetivo Alcançado!" : (yearsToGoal > 5 ? "> 5 anos" : (monthsToGoal > 0 ? `${Math.ceil(monthsToGoal)} meses` : "Em breve")),
                mainLabel: "Para atingir a meta",
                subMetric: avgMonthly > 0 ? `Média atual: R$ ${avgMonthly.toFixed(2)}/mês` : "Sem histórico recente",
                status: remaining <= 0 ? "success" : (yearsToGoal > 2 ? "warning" : "success"),
                avgMonthly: avgMonthly,
                aiInsight: insight
            };
        }
    };

    const metrics = calculateMetrics();

    return (
        <Card className="border-none shadow-none bg-transparent mt-6">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <Activity className="w-5 h-5" />
                    {type === 'savings' ? 'Projeção de Crescimento' : 'Análise de Gastos'}
                </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Chart Section */}
                    <div className="md:col-span-2 h-64 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                        <ResponsiveContainer width="100%" height="100%">
                            {type === 'spending' ? (
                                <AreaChart data={data}>
                                    <defs>
                                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.2} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#9ca3af' }} minTickGap={30} />
                                    <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#9ca3af' }} tickFormatter={(val) => `R$${val}`} />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#1f2937', color: '#f3f4f6', borderRadius: '8px', border: 'none' }}
                                        itemStyle={{ color: '#f3f4f6' }}
                                        formatter={(value: number) => [`R$ ${value.toFixed(2)}`, '']}
                                    />
                                    <ReferenceLine y={totalTarget} stroke="orange" strokeDasharray="3 3" label={{ value: 'Limite Total', fill: 'orange', fontSize: 10, position: 'insideTopRight' }} />
                                    <Area type="monotone" dataKey="actual" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" name="Gasto Real" />
                                    <Area type="monotone" dataKey="ideal" stroke="#9ca3af" strokeDasharray="5 5" fill="none" name="Pace Ideal" />
                                </AreaChart>
                            ) : (
                                <AreaChart data={data}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.2} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#9ca3af' }} />
                                    <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#9ca3af' }} tickFormatter={(val) => `R$${val}`} />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#1f2937', color: '#f3f4f6', borderRadius: '8px', border: 'none' }}
                                        itemStyle={{ color: '#f3f4f6' }}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" name="Economia Mensal" />
                                </AreaChart>
                            )}
                        </ResponsiveContainer>
                    </div>

                    {/* Metrics Section */}
                    <div className="space-y-4">
                        <div className={`p-6 rounded-xl border ${metrics.status === 'danger' ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800 text-red-900 dark:text-red-200' : (metrics.status === 'warning' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800 text-orange-900 dark:text-orange-200' : 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800 text-green-900 dark:text-green-200')}`}>
                            <h4 className="text-sm font-medium opacity-80 uppercase tracking-wide mb-1 opacity-70">{metrics.mainLabel}</h4>
                            <span className="text-3xl font-bold block mb-2">{metrics.mainMetric}</span>
                            <div className="flex items-center gap-2 text-sm opacity-90">
                                {metrics.status === 'danger' ? <AlertTriangle className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                                <span>{metrics.subMetric}</span>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-indigo-500" /> Insight da IA</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                {metrics.aiInsight}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
