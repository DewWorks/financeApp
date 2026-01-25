"use client";

import React from "react";
import { Check, X, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import { useUser } from "@/context/UserContext"; // Assuming we want to highlight current plan
import { useRouter } from "next/navigation";

export default function PricingPage() {
    const { currentPlan } = useUser();
    const router = useRouter();

    const handleSubscribe = (plan: string) => {
        // Future Stripe integration hook
        console.log(`Subscribing to ${plan}`);
        // For now, maybe just redirect or show a toast
    };

    return (
        <div className="min-h-screen bg-black text-white py-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center">

            {/* Header */}
            <div className="text-center mb-16 space-y-4">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                    Planos Transparentes
                </h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                    Comece grátis e evolua conforme suas finanças crescem.
                </p>
            </div>

            {/* Pricing Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-7xl">

                {/* 1. STARTER */}
                <div className="relative p-8 rounded-3xl bg-[#111] border border-gray-800 flex flex-col hover:border-gray-700 transition-colors">
                    <div className="mb-4">
                        <h3 className="text-gray-400 font-medium tracking-wide uppercase text-sm">Starter</h3>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-white">R$ 0,00</span>
                            <span className="text-gray-500">/mês</span>
                        </div>
                    </div>

                    <ul className="flex-1 space-y-4 mb-8">
                        <li className="flex items-center gap-3 text-gray-300 text-sm">
                            <div className="w-5 h-5 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-500"><Check className="w-3 h-3" /></div>
                            Dashboard Completo
                        </li>
                        <li className="flex items-center gap-3 text-gray-300 text-sm">
                            <div className="w-5 h-5 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-500"><Check className="w-3 h-3" /></div>
                            50 Lançamentos mensais
                        </li>
                        <li className="flex items-center gap-3 text-gray-300 text-sm">
                            <div className="w-5 h-5 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-500"><Check className="w-3 h-3" /></div>
                            Categorização básica
                        </li>
                        <li className="flex items-center gap-3 text-gray-500 text-sm">
                            <div className="w-5 h-5 rounded-full bg-red-900/20 flex items-center justify-center text-red-500"><X className="w-3 h-3" /></div>
                            Integração WhatsApp
                        </li>
                        <li className="flex items-center gap-3 text-gray-500 text-sm">
                            <div className="w-5 h-5 rounded-full bg-red-900/20 flex items-center justify-center text-red-500"><X className="w-3 h-3" /></div>
                            Sincronização Bancária
                        </li>
                    </ul>

                    <Button variant="outline" className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:text-white rounded-full py-6" onClick={() => handleSubscribe('FREE')}>
                        {currentPlan === 'FREE' ? 'Plano Atual' : 'Começar Grátis'}
                    </Button>
                </div>

                {/* 2. PRO (Popular) */}
                <div className="relative p-8 rounded-3xl bg-[#0F172A] border-2 border-blue-500 flex flex-col shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)] transform scale-105 z-10">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            Mais Popular
                        </span>
                    </div>

                    <div className="mb-4">
                        <h3 className="text-blue-400 font-medium tracking-wide uppercase text-sm">PRO</h3>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-5xl font-bold text-white">R$ 19,90</span>
                            <span className="text-gray-400">/mês</span>
                        </div>
                    </div>

                    <ul className="flex-1 space-y-4 mb-8">
                        <li className="flex items-center gap-3 text-white text-sm">
                            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white"><Check className="w-3 h-3" /></div>
                            Tudo do Grátis
                        </li>
                        <li className="flex items-center gap-3 text-white text-sm">
                            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white"><Check className="w-3 h-3" /></div>
                            Bot de WhatsApp (Áudio/Texto)
                        </li>
                        <li className="flex items-center gap-3 text-white text-sm">
                            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white"><Check className="w-3 h-3" /></div>
                            Insights Semanais Básicos
                        </li>
                        <li className="flex items-center gap-3 text-white text-sm">
                            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white"><Check className="w-3 h-3" /></div>
                            Suporte por Email
                        </li>
                        <li className="flex items-center gap-3 text-gray-500 text-sm">
                            <div className="w-5 h-5 rounded-full bg-red-900/20 flex items-center justify-center text-red-500"><X className="w-3 h-3" /></div>
                            Sincronização Bancária
                        </li>
                    </ul>

                    <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-full py-6 font-bold shadow-lg shadow-blue-500/25" onClick={() => handleSubscribe('PRO')}>
                        {currentPlan === 'PRO' ? 'Plano Atual' : 'Escolher Plano'}
                    </Button>
                </div>

                {/* 3. ULTIMATE */}
                <div className="relative p-8 rounded-3xl bg-[#0c0a1f] border border-purple-500 flex flex-col shadow-[0_0_40px_-10px_rgba(168,85,247,0.3)]">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                            <Zap className="w-3 h-3 fill-current" /> O Mais Completo
                        </span>
                    </div>
                    <div className="absolute top-8 right-8 text-yellow-500">
                        <Star className="w-6 h-6 fill-current" />
                    </div>

                    <div className="mb-4">
                        <h3 className="text-purple-400 font-medium tracking-wide uppercase text-sm">Ultimate</h3>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-5xl font-bold text-white">R$ 39,90</span>
                            <span className="text-gray-400">/mês</span>
                        </div>
                        <p className="text-xs text-purple-300 mt-2 flex items-center gap-1">
                            ✨ Saiba o poder da IA nas finanças
                        </p>
                    </div>

                    <ul className="flex-1 space-y-4 mb-8">
                        <li className="flex items-center gap-3 text-white text-sm">
                            <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white"><Check className="w-3 h-3" /></div>
                            Tudo do Pro
                        </li>
                        <li className="flex items-center gap-3 text-white text-sm">
                            <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white"><Check className="w-3 h-3" /></div>
                            Sincronização Bancária (Open Finance)
                        </li>
                        <li className="flex items-center gap-3 text-white text-sm">
                            <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white"><Check className="w-3 h-3" /></div>
                            IA Avançada (Consultor Gemini)
                        </li>
                        <li className="flex items-center gap-3 text-white text-sm">
                            <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white"><Check className="w-3 h-3" /></div>
                            Análise de Tendências
                        </li>
                        <li className="flex items-center gap-3 text-white text-sm">
                            <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white"><Check className="w-3 h-3" /></div>
                            Suporte VIP Prioritário
                        </li>
                    </ul>

                    <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full py-6 font-bold shadow-lg shadow-purple-500/25" onClick={() => handleSubscribe('MAX')}>
                        {currentPlan === 'MAX' ? 'Plano Atual' : 'Escolher Plano'}
                    </Button>
                </div>

            </div>
        </div>
    );
}
