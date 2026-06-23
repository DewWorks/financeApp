"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";

export function FeatureDiscoveryBanner() {
    const [isVisible, setIsVisible] = useState(false);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        // Check if browser supports Web Push
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            
            // Check if user has already granted/denied permission, or dismissed the banner
            const hasSeenBanner = localStorage.getItem("hasSeenPushBanner");
            if (Notification.permission === "default" && !hasSeenBanner) {
                // Show banner after 3 seconds of opening the app to not overwhelm the user
                const timer = setTimeout(() => {
                    setIsVisible(true);
                }, 3000);
                return () => clearTimeout(timer);
            }
        }
    }, []);

    const dismissBanner = () => {
        setIsVisible(false);
        localStorage.setItem("hasSeenPushBanner", "true");
    };

    const activatePush = async () => {
        setIsVisible(false);
        localStorage.setItem("hasSeenPushBanner", "true");
        
        try {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                // Refresh the page or let the PushNotificationToggle component pick up the state
                // This triggers the service worker registration flow indirectly if they click the actual button later
                // Or we can just alert them to click the header button.
                // Actually, just asking for permission is 90% of the friction. The toggle in the header will now be green!
                window.location.reload(); 
            }
        } catch (error) {
            console.error("Erro ao pedir permissão de notificação:", error);
        }
    };

    if (!isSupported) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.95 }}
                    className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-blue-100 dark:border-gray-700 p-5 z-50 overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                    
                    <button 
                        onClick={dismissBanner}
                        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-start gap-4 mt-1">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full flex-shrink-0">
                            <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                                Novidade: Alertas Inteligentes! 🤖
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                                O Fin agora pode te enviar dicas e alertas de limites direto na sua tela. Fique no controle sem esforço!
                            </p>
                            
                            <div className="flex gap-2">
                                <Button 
                                    onClick={activatePush}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all active:scale-95"
                                >
                                    Ativar Agora
                                </Button>
                                <Button 
                                    onClick={dismissBanner}
                                    variant="outline"
                                    className="px-4 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    Depois
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
