"use client";

import { usePlanGate } from "@/context/PlanGateContext";
import { PlanType } from "@/interfaces/IUser";
import { Button } from "@/components/ui/atoms/button";
import { Card } from "@/components/ui/atoms/card";
import { motion } from "framer-motion";
import { Sparkles, Zap, Building2, ArrowRight, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function UpsellBanner() {
    const { currentPlan, isLoading } = usePlanGate();
    const router = useRouter();

    // Prevent flicker: Don't show anything while determining plan
    if (isLoading) return null;

    // User requested to show ONLY to FREE users (PlanType.FREE)
    // If user is PRO or MAX, do not show this banner.
    if (currentPlan !== PlanType.FREE) {
        return null;
    }

    const isFree = true; // effectively always true here now

    const content = isFree ? {
        title: "Desbloqueie a IA Financeira 🚀",
        description: "Fale com o Fin AI por áudio ou texto e receba insights semanais com o plano PRO.",
        buttonText: "Ver planos PRO",
        gradient: "from-blue-900 via-indigo-900 to-slate-900 border border-blue-800",
        icon: <Sparkles className="w-6 h-6 text-blue-400" />,
        features: ["Fin AI por Voz e Texto", "Insights IA", "Lançamentos Ilimitados"]
    } : {
        title: "Desbloqueie o Consultor IA Avançado 🧠",
        description: "Receba planejamento financeiro automatizado e análises profundas com o plano Ultimate.",
        buttonText: "Fazer Upgrade para Ultimate",
        gradient: "from-slate-950 to-blue-950 border border-blue-900",
        icon: <Sparkles className="w-6 h-6 text-cyan-400" />,
        features: ["Consultor IA Avançado", "Análise Profunda", "Suporte Prioritário"]
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
        >
            <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${content.gradient} shadow-lg`}>
                {/* Abstract Shapes */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-black/20 rounded-full blur-3xl"></div>

                <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex-1 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-medium mb-3 border border-white/10">
                            {content.icon}
                            <span>Recomendado para você</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                            {content.title}
                        </h3>
                        <p className="text-blue-100/80 mb-6 max-w-xl text-sm sm:text-base">
                            {content.description}
                        </p>

                        {/* Mini Feature List (Desktop) */}
                        <div className="hidden sm:flex gap-4 mb-2 justify-center md:justify-start">
                            {content.features.map((feat, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-xs text-blue-100">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                    {feat}
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button
                        onClick={() => router.push('/pricing')}
                        className="bg-white text-blue-900 hover:bg-blue-50 font-bold px-8 py-6 rounded-xl shadow-xl transition-transform active:scale-95 group border-0"
                    >
                        {content.buttonText}
                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
