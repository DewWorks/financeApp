"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { Card, CardContent, CardTitle, CardHeader, CardDescription, CardFooter } from "@/components/ui/atoms/card";
import { Button } from "@/components/ui/atoms/button";
import { CheckCircle2, AlertCircle, ArrowRight, Loader2, Sparkles, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BillingPage() {
    const { user, currentPlan } = useUser();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleUpgrade = () => {
        router.push("/pricing");
    };

    const getPlanDetails = () => {
        switch (currentPlan) {
            case "MAX":
                return {
                    name: "Plano MAX",
                    icon: <Building2 className="w-8 h-8 text-blue-500" />,
                    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
                    description: "O mais completo. Todas as inteligências e automações ativas.",
                    features: ["Tudo do PRO", "Importação de PDFs ilimitada", "Open Finance Automático", "Consultoria IA Personalizada"]
                };
            case "PRO":
                return {
                    name: "Plano PRO",
                    icon: <Sparkles className="w-8 h-8 text-yellow-500" />,
                    color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                    description: "Perfeito para quem quer mais velocidade usando IA no dia a dia.",
                    features: ["Tudo do FREE", "Importação via Extrato/OFX", "Categorização por Inteligência Artificial", "Dashboard Completo"]
                };
            default:
                return {
                    name: "Plano FREE",
                    icon: <CheckCircle2 className="w-8 h-8 text-gray-500" />,
                    color: "bg-gray-500/10 text-gray-500 border-gray-500/20",
                    description: "Funcionalidades essenciais para controle básico.",
                    features: ["Gestão Manual", "Até 3 Metas Financeiras", "Suporte Básico"]
                };
        }
    };

    const details = getPlanDetails();

    if (!user) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-8">
                
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Assinatura e Faturamento</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Gerencie seu plano atual e veja os benefícios da sua conta.</p>
                </div>

                <Card className="border-0 shadow-xl bg-white dark:bg-gray-800 overflow-hidden relative">
                    {currentPlan === "MAX" && (
                        <div className="absolute top-0 right-0 p-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg">
                                Plano Definitivo
                            </span>
                        </div>
                    )}
                    
                    <CardHeader className="pb-8">
                        <div className="flex items-center space-x-4">
                            <div className={`p-4 rounded-2xl border ${details.color}`}>
                                {details.icon}
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {details.name}
                                </CardTitle>
                                <CardDescription className="text-base mt-1">
                                    {details.description}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">O que está incluído no seu plano atual:</h3>
                            <ul className="space-y-3">
                                {details.features.map((feature, i) => (
                                    <li key={i} className="flex items-center text-gray-600 dark:text-gray-300">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </CardContent>
                    
                    <CardFooter className="bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.subscription?.status === 'ACTIVE' 
                                ? `Sua assinatura está Ativa.`
                                : `Você está no plano gratuito.`}
                        </div>
                        
                        {currentPlan !== "MAX" && (
                            <Button 
                                onClick={handleUpgrade}
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all"
                            >
                                Fazer Upgrade
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        )}
                        {currentPlan !== "FREE" && user.subscription?.status === 'ACTIVE' && (
                            <Button 
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20"
                                onClick={() => window.open('https://www.asaas.com/customer/portal', '_blank')}
                            >
                                Cancelar / Portal Asaas
                            </Button>
                        )}
                    </CardFooter>
                </Card>

                {/* Ajuda */}
                <div className="flex items-start space-x-3 text-sm text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p>
                        Pagamentos via PIX podem levar alguns minutos para serem confirmados. 
                        Qualquer dúvida, entre em contato através do botão do WhatsApp no canto da tela.
                    </p>
                </div>
            </div>
        </div>
    );
}
