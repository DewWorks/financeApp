"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/atoms/button";
import { Download } from "lucide-react";
import { Tooltip } from "@/components/ui/atoms/tooltip";

export function PWAInstallButton({ className }: { className?: string }) {
    const [isInstallable, setIsInstallable] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSPrompt, setShowIOSPrompt] = useState(false);

    useEffect(() => {
        // Universal Standalone Check
        const isStandaloneMatch = window.matchMedia('(display-mode: standalone)').matches;
        const isIOSStandalone = ('standalone' in window.navigator) && (window.navigator as any).standalone;
        
        if (isStandaloneMatch || isIOSStandalone) {
            setIsInstallable(false);
            return;
        }

        // Detect iOS for manual instruction prompt
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        
        if (isIosDevice) {
            setIsIOS(true);
            setIsInstallable(true);
            // No need to listen to beforeinstallprompt on iOS since it doesn't support it
            return;
        }

        // Check global prompt immediately in case it fired before React hydration
        if ((window as any).deferredPrompt) {
            setIsInstallable(true);
        }

        const handleInstallable = (e: any) => {
            (window as any).deferredPrompt = e.detail || e;
            setIsInstallable(true);
        };
        
        const handleInstalled = () => {
            (window as any).deferredPrompt = null;
            setIsInstallable(false);
        };

        window.addEventListener("pwa-installable", handleInstallable);
        window.addEventListener("pwa-installed", handleInstalled);
        window.addEventListener("appinstalled", handleInstalled);
        window.addEventListener("beforeinstallprompt", (e) => {
            e.preventDefault();
            handleInstallable(e);
        });

        // Listen for display-mode changes (e.g., user installed app)
        const mediaQuery = window.matchMedia('(display-mode: standalone)');
        const handleMediaChange = (e: MediaQueryListEvent) => {
            if (e.matches) handleInstalled();
        };
        mediaQuery.addEventListener('change', handleMediaChange);

        return () => {
            window.removeEventListener("pwa-installable", handleInstallable);
            window.removeEventListener("pwa-installed", handleInstalled);
            window.removeEventListener("appinstalled", handleInstalled);
            mediaQuery.removeEventListener('change', handleMediaChange);
        };
    }, []);

    const handleInstallClick = async () => {
        if (isIOS) {
            setShowIOSPrompt(true);
            return;
        }

        const deferredPrompt = (window as any).deferredPrompt;
        if (!deferredPrompt) {
            console.warn("No deferredPrompt available");
            return;
        }
        
        try {
            // Show the install prompt
            await deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            
            // We've used the prompt, so it can't be used again, discard it
            if (outcome === 'accepted') {
                (window as any).deferredPrompt = null;
                setIsInstallable(false);
            }
        } catch (err) {
            console.error("Error showing PWA prompt:", err);
        }
    };

    if (!isInstallable) return null;

    return (
        <>
            <Tooltip title={isIOS ? "Como Instalar" : "Instalar Aplicativo"} arrow>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleInstallClick}
                    className={`flex items-center text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 ${className || ''}`}
                >
                    <Download className="mr-2 h-4 w-4" />
                    <span className="font-medium">Instalar App</span>
                </Button>
            </Tooltip>

            {showIOSPrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl max-w-sm w-full shadow-2xl">
                        <h3 className="text-lg font-bold mb-4 text-zinc-900 dark:text-zinc-100">Instalar financePro no iOS</h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                            Para instalar o app no seu iPhone ou iPad:<br/><br/>
                            1. Toque no ícone de <strong>Compartilhar</strong> na barra inferior do Safari.<br/>
                            2. Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.<br/>
                            3. Confirme tocando em <strong>Adicionar</strong> no canto superior direito.
                        </p>
                        <Button 
                            className="w-full" 
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
