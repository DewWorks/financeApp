"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/atoms/button";
import { Download } from "lucide-react";
import { Tooltip } from "@/components/ui/atoms/tooltip";

export function PWAInstallButton({ className }: { className?: string }) {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setIsInstallable(true);
        };

        window.addEventListener("beforeinstallprompt", handler);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        // We've used the prompt, so it can't be used again, discard it
        setDeferredPrompt(null);
        setIsInstallable(false);
    };

    // DEBUG: Force visible for verification
    // if (!isInstallable) return null;

    if (!isInstallable) return null;

    return (
        <Tooltip title="Instalar Aplicativo" arrow>
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
    );
}
