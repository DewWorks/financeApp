"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/atoms/button";
import { Download, X } from "lucide-react";

export function PWAInstallNudge() {
    const [isInstallable, setIsInstallable] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSPrompt, setShowIOSPrompt] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (localStorage.getItem("pwa-nudge-dismissed") === "true") {
            setDismissed(true);
            return;
        }

        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        const isStandalone = ('standalone' in window.navigator) && (window.navigator as any).standalone;
        
        if (isIosDevice && !isStandalone) {
            setIsIOS(true);
            setIsInstallable(true);
            return;
        }

        // Check global prompt immediately
        if ((window as any).deferredPrompt) {
            setIsInstallable(true);
        }

        const handleInstallable = () => setIsInstallable(true);
        const handleInstalled = () => setIsInstallable(false);

        window.addEventListener("pwa-installable", handleInstallable);
        window.addEventListener("pwa-installed", handleInstalled);

        return () => {
            window.removeEventListener("pwa-installable", handleInstallable);
            window.removeEventListener("pwa-installed", handleInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (isIOS) {
            setShowIOSPrompt(true);
            return;
        }

        const deferredPrompt = (window as any).deferredPrompt;
        if (!deferredPrompt) return;
        
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            (window as any).deferredPrompt = null;
            setIsInstallable(false);
        }
    };

    const handleDismiss = () => {
        setDismissed(true);
        localStorage.setItem("pwa-nudge-dismissed", "true");
    };

    if (!isInstallable) return null;

    if (dismissed) {
        return (
            <button
                onClick={() => setDismissed(false)}
                className="fixed top-20 right-4 z-40 bg-zinc-900 border border-zinc-800 text-white rounded-full p-2 shadow-lg flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
                title="Instalar App"
            >
                <Download className="w-4 h-4" />
            </button>
        );
    }

    return (
        <>
            <div className="fixed top-20 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-4 z-50 bg-zinc-900 border border-zinc-700 shadow-2xl rounded-2xl p-2 pr-1 flex flex-row items-center gap-3 w-[92%] max-w-sm animate-in slide-in-from-top-5 fade-in duration-300">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 ml-1">
                    <Download className="w-5 h-5 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white text-[13px] leading-tight truncate">
                        financePro App
                    </h4>
                    <p className="text-[11px] text-zinc-400 leading-tight truncate">
                        Acesso rápido e notificações
                    </p>
                </div>

                <Button 
                    size="sm"
                    onClick={handleInstallClick}
                    className="h-8 px-4 text-xs bg-white hover:bg-zinc-200 text-zinc-900 rounded-full font-bold shrink-0"
                >
                    Instalar
                </Button>

                <button 
                    onClick={handleDismiss}
                    className="p-2 text-zinc-400 hover:text-white transition-colors shrink-0 flex items-center justify-center"
                    aria-label="Fechar"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {showIOSPrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Instalar no iOS</h3>
                            <button onClick={() => setShowIOSPrompt(false)} className="p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                            Para instalar o app no seu dispositivo:<br/><br/>
                            1. Toque no ícone de <strong>Compartilhar</strong> na barra inferior do Safari.<br/>
                            2. Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.<br/>
                            3. Confirme tocando em <strong>Adicionar</strong>.
                        </p>
                        <Button 
                            className="w-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200" 
                            size="lg"
                            onClick={() => setShowIOSPrompt(false)}
                        >
                            Entendi
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
}
