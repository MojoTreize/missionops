"use client";

import { useEffect } from "react";

/**
 * Enregistre le service worker (B4.1). En développement, il est désactivé
 * pour ne pas masquer les modifications derrière le cache.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production" && !process.env.NEXT_PUBLIC_ENABLE_SW) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
  }, []);
  return null;
}
