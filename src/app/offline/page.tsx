import { WifiOff } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-primary text-accent">
        <WifiOff className="size-6" />
      </span>
      <h1 className="text-xl font-semibold">You&apos;re offline</h1>
      <p className="max-w-xs text-sm text-muted-foreground">
        Schedules, hours and logbooks need a connection so you always see the latest. Reconnect and pull to refresh.
      </p>
    </main>
  );
}
