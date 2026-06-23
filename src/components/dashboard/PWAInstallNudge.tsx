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

    if (!isInstallable || dismissed) return null;

    return (
        <>
            <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-8 md:bottom-8 z-40">
                <div className="bg-white dark:bg-zinc-900 border border-blue-100 dark:border-blue-900/50 shadow-2xl rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-center gap-4 max-w-md w-full animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <button 
                        onClick={handleDismiss}
                        className="absolute top-2 right-2 p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-full transition-colors"
                        aria-label="Fechar"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center shrink-0">
                        <Download className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    
                    <div className="flex-1 text-center md:text-left">
                        <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                            Instale o financePro
                        </h4>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-snug">
                            Tenha acesso mais rápido e receba notificações importantes diretamente no seu celular.
                        </p>
                    </div>

                    <Button 
                        onClick={handleInstallClick}
                        className="w-full md:w-auto shrink-0 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/20"
                    >
                        Instalar Agora
                    </Button>
                </div>
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
