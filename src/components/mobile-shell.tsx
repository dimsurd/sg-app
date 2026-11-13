"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpenCheck, Compass, Download, Home, LogOut, ReceiptText, Star, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { useInstallAction } from "@/components/install-app";
import { Button } from "@/components/ui/button";
import { clearServiceWorkerPages } from "@/components/pwa-runtime";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api, unwrap } from "@/lib/api/client";

const NAV = {
  student: [
    { href: "/student", label: "My classes", icon: Home },
    { href: "/student/browse", label: "Browse", icon: Compass },
    { href: "/student/invoices", label: "Invoices", icon: ReceiptText },
  ],
  tutor: [
    { href: "/tutor", label: "Teaching", icon: Home },
    { href: "/tutor/logbooks", label: "Logbooks", icon: BookOpenCheck },
    { href: "/tutor/earnings", label: "Earnings", icon: Wallet },
  ],
} as const;

function isActive(pathname: string, href: string, root: string) {
  return href === root ? pathname === root || (pathname.startsWith(`${root}/classes`)) : pathname.startsWith(href);
}

export function MobileShell({ role, children }: { role: "student" | "tutor"; children: React.ReactNode }) {
  const pathname = usePathname();
  const me = useQuery({ queryKey: ["me"], queryFn: () => unwrap(api.GET("/auth/me")) });
  const root = `/${role}`;
  const installer = useInstallAction();
  const name = me.data?.user.fullName ?? "";
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  async function logout() {
    await api.POST("/auth/logout");
    clearServiceWorkerPages();
    // Full reload on purpose: clears all cached data and lets the proxy see the cookie is gone.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/login";
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b bg-background/90 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur">
        <Link href={root} className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-accent">
            <Star className="size-3.5 fill-current" />
          </span>
          <span className="text-xs font-semibold tracking-[0.2em]">STAR GENERATION</span>
        </Link>
        <div className="flex items-center gap-2">
          {installer.canInstall && (
            <Button size="sm" variant="outline" onClick={installer.install} className="rounded-full">
              <Download /> Install app
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
              aria-label="Account"
            >
              {initials || "…"}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>
                <p className="truncate">{name}</p>
                <p className="text-xs font-normal text-muted-foreground capitalize">{role}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={logout}>
                <LogOut /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 px-4 pt-5 pb-28">
        {children}
      </main>
      {installer.dialog}

      {/* Floating pill nav, lifted above the home indicator on phones. */}
      <nav
        aria-label="Main"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <ul className="pointer-events-auto mx-auto grid max-w-sm grid-cols-3 gap-1 rounded-full bg-primary/95 p-1.5 shadow-xl shadow-primary/25 ring-1 ring-white/10 backdrop-blur-md">
          {NAV[role].map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href, root);
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
