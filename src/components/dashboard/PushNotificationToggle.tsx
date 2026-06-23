"use client"

import React, { useEffect, useState } from "react"
import { Bell, BellOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/atoms/button"

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function PushNotificationToggle() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            checkSubscription();
        } else {
            setLoading(false);
        }
    }, []);

    const checkSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        } catch (error) {
            console.error("Error checking subscription", error);
        } finally {
            setLoading(false);
        }
    };

    const subscribeUser = async () => {
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const applicationServerKey = urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '');
            
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey
            });

            // Send subscription to our server
            await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(subscription),
            });

            setIsSubscribed(true);
        } catch (error) {
            console.error('Failed to subscribe the user: ', error);
            alert("Não foi possível ativar as notificações. Verifique as permissões do seu navegador.");
        } finally {
            setLoading(false);
        }
    };

    const testNotification = async () => {
        try {
            await fetch('/api/notifications/test-nudge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: "Teste do Fin 🤖",
                    message: "Esta é uma notificação de teste. Tudo está funcionando perfeitamente!"
                })
            });
        } catch (error) {
            console.error('Error sending test notification', error);
        }
    };

    if (!isSupported) {
        return null; // Don't show if push is not supported
    }

    return (
        <div className="flex items-center space-x-2">
            <Button 
                variant="outline" 
                size="sm" 
                onClick={isSubscribed ? undefined : subscribeUser}
                disabled={loading || isSubscribed}
                className={`transition-all ${isSubscribed ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30' : ''}`}
            >
                {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : isSubscribed ? (
                    <Bell className="w-4 h-4 mr-2" />
                ) : (
                    <BellOff className="w-4 h-4 mr-2" />
                )}
                {isSubscribed ? 'Dicas Ativadas' : 'Ativar Dicas Proativas'}
            </Button>
            {isSubscribed && (
                <Button variant="ghost" size="sm" onClick={testNotification} title="Testar Notificação">
                    Testar
                </Button>
            )}
        </div>
    );
}
