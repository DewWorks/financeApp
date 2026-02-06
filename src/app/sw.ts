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
});
