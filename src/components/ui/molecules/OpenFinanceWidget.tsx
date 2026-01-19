"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/atoms/card";
import { Button } from "@/components/ui/atoms/button";
import { Wallet, DollarSign, TrendingUp, ChevronDown, ChevronUp, Eye, EyeOff, Landmark } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getBankDetails } from "@/lib/utils";

export function OpenFinanceWidget() {
    const router = useRouter();
    const [bankConnections, setBankConnections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(true);

    // Carregar preferência do usuário (opcional - persistência)
    useEffect(() => {
        const savedVisibility = localStorage.getItem("open-finance-visible");
        if (savedVisibility !== null) {
            setIsVisible(savedVisibility === "true");
        }
    }, []);

    const toggleVisibility = () => {
        const newState = !isVisible;
        setIsVisible(newState);
        localStorage.setItem("open-finance-visible", String(newState));
    };

    useEffect(() => {
        const fetchBankConnections = async () => {
            try {
                const response = await fetch("/api/bank-connections");
                if (response.ok) {
                    const data = await response.json();
                    setBankConnections(data);
                }
            } catch (error) {
                console.error("Erro ao buscar conexões bancárias:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBankConnections();
    }, []);



    // Processamento de Contas
    const allAccounts = bankConnections.flatMap((conn) => {
        const accounts = conn.accounts || [];
        if (accounts.length === 0) return [];

        const representativeAccount = accounts.find((acc: any) => {
            const name = (acc.name || "").toLowerCase();
            return (
                name.includes("nubank") ||
                name.includes("nu pagamentos") ||
                name.includes("itaú") ||
                name.includes("bradesco") ||
                name.includes("santander") ||
                name.includes("inter") ||
                name.includes("brasil") ||
                name.includes("caixa") ||
                name.includes("btg") ||
                name.includes("xp") ||
                name.includes("c6")
            );
        }) || accounts[0];

        const connectionBrand = representativeAccount ? getBankDetails(representativeAccount.name || "") : getBankDetails("");

        return accounts.map((acc: any) => ({
            ...acc,
            brand: connectionBrand,
        }));
    });

    const checkingTypes = ["CHECKING_ACCOUNT", "SAVINGS_ACCOUNT", "PAYMENT_ACCOUNT", "BANK"];

    const checkingAccounts = allAccounts.filter((acc: any) =>
        acc.type && checkingTypes.includes(acc.type.toUpperCase())
    );

    const creditAccounts = allAccounts.filter((acc: any) =>
        acc.type && (acc.type.toUpperCase() === "CREDIT_CARD" || acc.type.toUpperCase() === "CREDIT")
    );

    const otherAccounts = allAccounts.filter((acc: any) => {
        const type = acc.type ? acc.type.toUpperCase() : "";
        return !checkingTypes.includes(type) && type !== "CREDIT_CARD" && type !== "CREDIT";
    });

    const totalCheckingBalance = checkingAccounts.reduce((sum: number, acc: any) => sum + acc.balance, 0);

    if (!loading && bankConnections.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
        >
            {/* Header Interativo */}
            <div
                className="px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                onClick={toggleVisibility}
            >
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl">
                        <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            Minhas Contas
                            {!isVisible && (
                                <span className="text-xs font-normal px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full dark:bg-blue-900 dark:text-blue-300">
                                    {allAccounts.length} conta(s)
                                </span>
                            )}
                        </h2>
                        {isVisible && <p className="text-xs text-gray-500 dark:text-gray-400">Open Finance Integrado</p>}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {isVisible && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push("/bank");
                            }}
                            className="text-white bg-blue-600 hover:bg-blue-50 dark:hover:bg-blue-800 h-8 px-3 text-xs font-medium uppercase tracking-wide"
                        >
                            Gerenciar
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" className="text-gray-400 h-8 w-8">
                        {isVisible ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

            {/* Conteúdo Expansível */}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 pb-6 pt-2">
                            {loading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="h-32 rounded-2xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
                                    <div className="h-32 rounded-2xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

                                    {/* Coluna Esquerda: Saldo */}
                                    {checkingAccounts.length > 0 && (
                                        <div className="flex flex-col gap-4">
                                            {/* Card Saldo Consolidado */}
                                            <div className="rounded-2xl p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 flex flex-col justify-between min-h-[160px] relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                                                <div className="flex justify-between items-start mb-4 relative z-10">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-green-100 dark:bg-green-900/30 p-2.5 rounded-xl">
                                                            <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Saldo em Conta</p>
                                                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                                                                R$ {totalCheckingBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                                            </h3>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Lista de Contas Compacta */}
                                                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-1 space-y-2 relative z-10">
                                                    {checkingAccounts.map((acc: any, idx: number) => (
                                                        <div key={idx} className="flex justify-between items-center text-sm group/item">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full ring-2 ring-white dark:ring-gray-800" style={{ backgroundColor: acc.brand.color }}></div>
                                                                <span className="text-gray-600 dark:text-gray-300 font-medium group-hover/item:text-gray-900 dark:group-hover/item:text-white transition-colors">
                                                                    {acc.name}
                                                                </span>
                                                            </div>
                                                            <span className="text-gray-900 dark:text-gray-100 font-semibold opacity-80 group-hover/item:opacity-100">
                                                                {acc.currency} {acc.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Coluna Direita: Cartões (Scroll Horizontal Responsivo) */}
                                    {creditAccounts.length > 0 && (
                                        <div className="min-w-0"> {/* Fix grid overflow */}
                                            <div className="flex overflow-x-auto pb-4 gap-4 -mx-2 px-2 sm:mx-0 sm:px-0 scrollbar-hide snap-x">
                                                {creditAccounts.map((acc: any, idx: number) => (
                                                    <div
                                                        key={`${acc.accountId}-${idx}`}
                                                        className="min-w-[280px] sm:min-w-[320px] w-full h-40 rounded-2xl p-5 flex flex-col justify-between text-white shadow-lg snap-center relative overflow-hidden transition-transform hover:scale-[1.01]"
                                                        style={{ background: acc.brand.color }}
                                                    >
                                                        <div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                                                        <div className="absolute left-0 bottom-0 w-32 h-32 bg-black/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

                                                        <div className="flex justify-between items-start z-10 relative">
                                                            <div className="flex items-center gap-2">
                                                                <div className="bg-white/95 p-1.5 rounded-md shadow-sm">
                                                                    <img src={acc.brand.logo} alt={acc.name} className="h-5 w-5 object-contain" />
                                                                </div>
                                                                <span className="font-bold text-base tracking-wide text-white/95 drop-shadow-md truncate max-w-[120px]">
                                                                    {acc.name}
                                                                </span>
                                                            </div>
                                                            <div className="w-8 h-6 bg-gradient-to-br from-yellow-200 to-yellow-500 rounded sm:rounded-md opacity-90" />
                                                        </div>

                                                        <div className="z-10 relative flex justify-between items-end">
                                                            <div>
                                                                <p className="text-[10px] text-white/80 uppercase tracking-wider font-medium mb-0.5">Limite Atual</p>
                                                                <h3 className="text-2xl font-bold text-white drop-shadow-md">
                                                                    {acc.currency} {acc.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                                                </h3>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[10px] text-white/60">Final</p>
                                                                <p className="font-mono text-sm text-white/90">
                                                                    {acc.number ? acc.number.slice(-4) : "0000"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Fallback - Nenhuma conta categorizada */}
                                    {checkingAccounts.length === 0 && creditAccounts.length === 0 && otherAccounts.length === 0 && (
                                        <div className="col-span-1 xl:col-span-2 p-6 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-800 rounded-xl flex items-center gap-4">
                                            <div className="bg-yellow-100 dark:bg-yellow-900/40 p-3 rounded-full">
                                                <TrendingUp className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-yellow-800 dark:text-yellow-200 font-bold text-sm">Contas Conectadas</h3>
                                                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">
                                                    Recebemos dados do banco, mas não conseguimos identificar contas correntes ou cartões.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
