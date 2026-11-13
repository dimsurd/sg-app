"use client";

import { onlineManager } from "@tanstack/react-query";
import { WifiOff } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

/** Registers the service worker (production only) and shows an offline banner. */
export function PwaRuntime() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => undefined);
  }, []);

  // React Query pauses requests while offline and resumes them on reconnect;
  // this banner just tells the user why nothing is loading.
  const online = useSyncExternalStore(
    (cb) => onlineManager.subscribe(cb),
    () => onlineManager.isOnline(),
    () => true,
  );
  if (online) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-primary px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] text-sm text-primary-foreground"
    >
      <WifiOff className="size-4 text-accent" />
      You&apos;re offline — we&apos;ll refresh as soon as you&apos;re back.
    </div>
  );
}

/** Call on logout so cached pages from this session are dropped. */
export function clearServiceWorkerPages() {
  navigator.serviceWorker?.controller?.postMessage("clear-pages");
}
