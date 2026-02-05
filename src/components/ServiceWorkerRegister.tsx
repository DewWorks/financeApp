"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            // FORCE UNREGISTER ALL SERVICE WORKERS
            navigator.serviceWorker.getRegistrations().then(function (registrations) {
                for (let registration of registrations) {
                    registration.unregister();
                    console.log("Service Worker unregistered:", registration);
                }
            });

            // Also explicitly remove the controller
            if (window.caches) {
                caches.keys().then(function (names) {
                    for (let name of names)
                        caches.delete(name);
                });
            }
        }
    }, []);

    return null;
}
