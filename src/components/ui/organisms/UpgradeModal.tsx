import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/atoms/dialog";
import { Button } from "@/components/ui/atoms/button";
import { Check, Rocket, Zap, Crown } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    message?: string;
    requiredPlan?: 'PRO' | 'MAX';
}

export function UpgradeModal({ isOpen, onClose, message, requiredPlan = 'PRO' }: UpgradeModalProps) {
    const router = useRouter();
    const isMax = requiredPlan === 'MAX';
    const hasTriggeredRef = React.useRef(false);

    // Trigger Upsell Email on Open (Once per session/mount)
    React.useEffect(() => {
        if (isOpen && !hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            fetch('/api/user/notify-upsell', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: requiredPlan })
            }).catch(err => console.error("Upsell trigger failed:", err));
        }
    }, [isOpen, requiredPlan]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-900 border-2 border-indigo-500/20">
                <DialogHeader>
                    <div className="mx-auto bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full mb-4 w-fit">
                        {isMax ? <Crown className="w-8 h-8 text-cyan-600 dark:text-cyan-400" /> : <Rocket className="w-8 h-8 text-blue-600 dark:text-blue-400" />}
                    </div>
                    <DialogTitle className="text-2xl text-center font-bold dark:text-white">
                        {isMax ? "Desbloqueie o Poder Máximo" : "Faça Upgrade para o PRO"}
                    </DialogTitle>
                    <DialogDescription className="text-center text-gray-500 dark:text-gray-400 text-base mt-2">
                        {message || "Você atingiu o limite do seu plano atual. Dê o próximo passo na sua gestão financeira!"}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
                        <div className="font-semibold text-gray-900 dark:text-white mb-2">
                            O que você ganha no {isMax ? 'MAX' : 'PRO'}:
                        </div>
                        <ul className="space-y-2">
                            <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <Check className="w-4 h-4 text-green-500" /> Transações Ilimitadas
                            </li>
                            <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <Check className="w-4 h-4 text-green-500" /> Bot de WhatsApp Inteligente
                            </li>
                            {isMax && (
                                <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <Check className="w-4 h-4 text-cyan-500" /> Sincronização Bancária Automática (Open Finance)
                                </li>
                            )}
                            {isMax && (
                                <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <Check className="w-4 h-4 text-cyan-500" /> Análise Profunda com IA
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                        Talvez depois
                    </Button>
                    <Button
                        onClick={() => {
                            onClose();
                            router.push('/pricing');
                        }}
                        className={`w-full sm:w-auto font-bold text-white shadow-lg ${isMax ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700' : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700'}`}
                    >
                        {isMax ? <Crown className="w-4 h-4 mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                        Assinar {isMax ? 'MAX' : 'PRO'} Agora
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
