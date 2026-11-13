"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpenCheck, Compass, Home, LogOut, ReceiptText, Star, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
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
      </header>

      <main className="flex-1 px-4 pt-5 pb-28">{children}</main>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <ul className="mx-auto grid max-w-2xl grid-cols-3">
          {NAV[role].map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href, root);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                      active && "bg-accent text-accent-foreground",
                    )}
                  >
                    <Icon className="size-4.5" />
                  </span>
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
