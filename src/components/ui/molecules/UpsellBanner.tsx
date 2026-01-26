"use client";

import { usePlanGate } from "@/context/PlanGateContext";
import { PlanType } from "@/interfaces/IUser";
import { Button } from "@/components/ui/atoms/button";
import { Card } from "@/components/ui/atoms/card";
import { motion } from "framer-motion";
import { Sparkles, Zap, Building2, ArrowRight, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function UpsellBanner() {
    const { currentPlan } = usePlanGate();
    const router = useRouter();

    if (currentPlan === PlanType.MAX) {
        return null;
    }

    const isFree = currentPlan === PlanType.FREE;

    // Content configuration based on plan
    const content = isFree ? {
        title: "Desbloqueie a IA Financeira 🚀",
        description: "Automatize seus gastos via WhatsApp e receba insights semanais com o plano PRO.",
        buttonText: "Ver planos PRO",
        gradient: "from-blue-600 to-purple-600",
        icon: <Sparkles className="w-6 h-6 text-yellow-300" />,
        features: ["Bot de WhatsApp", "Insights IA", "Lançamentos Ilimitados"]
    } : {
        title: "Conecte seus Bancos com Open Finance 🏦",
        description: "Sincronize automaticamente saldos e faturas de todos os seus bancos com o plano Ultimate.",
        buttonText: "Fazer Upgrade para Ultimate",
        gradient: "from-slate-900 to-slate-800 border-purple-500/30",
        icon: <Building2 className="w-6 h-6 text-purple-400" />,
        features: ["Sincronização Bancária", "Consultor IA Avançado", "Suporte Prioritário"]
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
