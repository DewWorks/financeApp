/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import { installSerwist } from "@serwist/sw";
import type { PrecacheEntry as PrecacheEntryType } from "@serwist/precaching";

declare const self: ServiceWorkerGlobalScope & {
    __SW_MANIFEST: (PrecacheEntryType | string)[] | undefined;
};

installSerwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: defaultCache,
    fallbacks: {
        entries: [
            {
                url: "/~offline",
                revision: "offline-v1",
                matcher({ request }) {
                    return request.destination === "document";
                },
            },
        ],
    },
});

// Listener para receber as notificações Push do Servidor
self.addEventListener("push", (event) => {
    let data = { title: "FinancePro 🤖", body: "Você tem uma nova dica financeira personalizada!" };
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: "FinancePro 🤖", body: event.data.text() };
        }
    }

    const options = {
        body: data.body,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-192x192.png",
        vibrate: [100, 50, 100],
        data: {
            url: (data as any).url || "/"
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Listener para abrir/focar o app ao clicar na notificação
self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const targetUrl = event.notification.data?.url || "/";

    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].url.includes(targetUrl)) {
                        return clientList[i].focus();
                    }
                }
                return client.focus();
            }
            return self.clients.openWindow(targetUrl);
        })
    );
});
