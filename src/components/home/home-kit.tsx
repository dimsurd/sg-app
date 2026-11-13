"use client";

import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "cn";
import { Card } from "@/components/ui/card";

/** Navy→blue banner at the top of Home: one friendly line plus the next useful action. */
export function WelcomeBanner({
  eyebrow,
  title,
  body,
  action,
}: {
  eyebrow: string;
  title: React.ReactNode;
  body?: React.ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <section className="relative overflow-hidden rounded-card bg-gradient-to-br from-[#2F3F5F] via-[#34466B] to-[#3E5A8A] p-5 text-white shadow-sm">
      <Image
        src="/brand/star-mark.png"
        alt=""
        width={150}
        height={168}
        aria-hidden
        className="pointer-events-none absolute -right-6 -bottom-8 opacity-25"
      />
      <span aria-hidden className="pointer-events-none absolute -top-10 -left-10 size-32 rounded-full bg-accent/20 blur-2xl" />
      <div className="relative max-w-[80%]">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">{eyebrow}</p>
        <h1 className="mt-1.5 text-2xl leading-tight font-semibold">{title}</h1>
        {body && <p className="mt-2 text-sm text-white/85">{body}</p>}
        {action && (
          <Link
            href={action.href}
            className="mt-4 inline-flex items-center gap-1 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition-transform active:scale-95"
          >
            {action.label} <ChevronRight className="size-4" />
          </Link>
        )}
      </div>
    </section>
  );
}

type Tone = "navy" | "gold" | "green" | "red";
const TONE: Record<Tone, string> = {
  navy: "bg-primary/10 text-primary",
  gold: "bg-accent/25 text-warning",
  green: "bg-success/10 text-success",
  red: "bg-destructive/10 text-destructive",
};

/** Small stat card: icon bubble, value, label. Optionally a link. */
export function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  tone = "navy",
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: Tone;
  href?: string;
}) {
  const body = (
    <Card className="h-full gap-0 p-3.5 transition-colors hover:bg-muted/40">
      <span className={cn("mb-3 flex size-9 items-center justify-center rounded-full", TONE[tone])}>
        <Icon className="size-4.5" />
      </span>
      <p className="text-lg leading-tight font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      {hint && <p className="mt-1 text-xs font-medium text-foreground/80">{hint}</p>}
    </Card>
  );
  return href ? (
    <Link href={href} className="block h-full rounded-card">
      {body}
    </Link>
  ) : (
    body
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: { href: string; label: string } }) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between">
      <h2 className="text-base font-semibold">{children}</h2>
      {action && (
        <Link href={action.href} className="text-sm font-medium text-foreground/75 hover:text-foreground">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export const firstName = (fullName?: string) => fullName?.split(" ")[0] ?? "";
