"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpenCheck, Compass, Download, GraduationCap, Home, LogOut, ReceiptText, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "cn";
import { firstName } from "@/components/home/home-kit";
import { useInstallAction } from "@/components/install-app";
import { clearServiceWorkerPages } from "@/components/pwa-runtime";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui-kit";
import { api, unwrap } from "@/lib/api/client";

type Role = "student" | "tutor";

const NAV: Record<Role, { href: string; label: string; icon: React.ComponentType<{ className?: string }>; match: (p: string) => boolean }[]> = {
  student: [
    { href: "/student", label: "Home", icon: Home, match: (p) => p === "/student" },
    { href: "/student/explore", label: "Explore", icon: Compass, match: (p) => p.startsWith("/student/explore") },
    { href: "/student/classes", label: "My classes", icon: GraduationCap, match: (p) => p.startsWith("/student/classes") },
    { href: "/student/invoices", label: "Invoices", icon: ReceiptText, match: (p) => p.startsWith("/student/invoices") },
  ],
  tutor: [
    { href: "/tutor", label: "Home", icon: Home, match: (p) => p === "/tutor" },
    { href: "/tutor/classes", label: "My classes", icon: GraduationCap, match: (p) => p.startsWith("/tutor/classes") },
    { href: "/tutor/logbooks", label: "Logbooks", icon: BookOpenCheck, match: (p) => p.startsWith("/tutor/logbooks") },
    { href: "/tutor/earnings", label: "Earnings", icon: Wallet, match: (p) => p.startsWith("/tutor/earnings") },
  ],
};

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
}

function Avatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground ring-2 ring-accent ring-offset-2 ring-offset-background",
        size === "lg" ? "size-16 text-xl" : "size-11 text-sm",
      )}
    >
      {initialsOf(name) || "…"}
    </span>
  );
}

export function MobileShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const pathname = usePathname();
  const me = useQuery({ queryKey: ["me"], queryFn: () => unwrap(api.GET("/auth/me")) });
  const installer = useInstallAction();
  const [leaving, setLeaving] = useState(false);
  const user = me.data?.user;
  const name = user?.fullName ?? "";

  async function logout() {
    setLeaving(true);
    await api.POST("/auth/logout");
    clearServiceWorkerPages();
    // Full reload on purpose: clears all cached data and lets the proxy see the cookie is gone.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/login";
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col">
      {/* App bar: avatar (opens profile) + greeting, install on the right. */}
      <header className="sticky top-0 z-30 flex items-center gap-3 bg-background/85 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur-md">
        <Sheet>
          <SheetTrigger aria-label="Account" className="rounded-full transition-transform active:scale-95">
            <Avatar name={name} />
          </SheetTrigger>
          <SheetContent side="bottom" className="mx-auto max-w-2xl rounded-t-3xl pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <span aria-hidden className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-muted" />
            <SheetHeader className="items-center pt-2 text-center">
              <Avatar name={name} size="lg" />
              <SheetTitle className="mt-3 text-lg">{name}</SheetTitle>
              <SheetDescription>{user?.email}</SheetDescription>
              <Badge className="mt-1 bg-accent text-accent-foreground capitalize">{role}</Badge>
            </SheetHeader>
            <div className="space-y-2 px-4">
              {installer.canInstall && (
                <Button variant="outline" className="h-11 w-full justify-start rounded-full" onClick={installer.install}>
                  <Download /> Install the app on this phone
                </Button>
              )}
              <p className="pt-2 text-center text-sm text-muted-foreground">
                {role === "student" ? "Taking a break? See you next lesson ✨" : "Done for today? Thanks for teaching ✨"}
              </p>
              <Button className="h-11 w-full rounded-full" onClick={logout} disabled={leaving}>
                {leaving ? <Spinner /> : <LogOut />} Log out
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-xs text-muted-foreground">{role === "student" ? "Ready to learn?" : "Welcome back,"}</p>
          <p className="truncate text-base font-semibold">{user ? `Hi, ${firstName(name)} 👋` : " "}</p>
        </div>

        {installer.canInstall && (
          <Button
            variant="outline"
            size="icon-lg"
            onClick={installer.install}
            aria-label="Install app"
            title="Install app"
            className="rounded-full"
          >
            <Download />
          </Button>
        )}
      </header>

      <main className="flex-1 px-4 pt-2 pb-28">{children}</main>
      {installer.dialog}

      {/* Floating pill nav, lifted above the home indicator on phones. */}
      <nav
        aria-label="Main"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <ul
          className={cn(
            "pointer-events-auto mx-auto grid max-w-md gap-1 rounded-full bg-primary/95 p-1.5 shadow-xl shadow-primary/25 ring-1 ring-white/10 backdrop-blur-md",
            NAV[role].length === 4 ? "grid-cols-4" : "grid-cols-3",
          )}
        >
          {NAV[role].map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-12 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-medium transition-all duration-200",
                    active
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "text-primary-foreground/70 hover:bg-white/10 hover:text-primary-foreground",
                  )}
                >
                  <Icon className="size-4.5" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
