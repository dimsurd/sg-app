"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarClock, ChevronRight, GraduationCap, ReceiptText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "cn";
import { BuyPackageButton } from "@/components/student/buy-package-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState, HoursMeter, LoadingRows, StatusBadge } from "@/components/ui-kit";
import { api, unwrap, type Schemas } from "@/lib/api/client";
import { balanceFlag } from "@/lib/balance";
import { SUBJECT_GRADIENT, classMeta } from "@/lib/class-meta";
import { formatDateTime, formatIDR, formatMinutes } from "@/lib/format";

export default function MyClassesPage() {
  const classes = useQuery({ queryKey: ["my-classes"], queryFn: () => unwrap(api.GET("/student/classes")) });
  const invoices = useQuery({ queryKey: ["my-invoices"], queryFn: () => unwrap(api.GET("/student/invoices")) });
  const unpaid = invoices.data?.invoices.filter((i) => i.status === "unpaid") ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">My classes</h1>
        <p className="text-sm text-muted-foreground">Your hours, next lessons and tutor notes.</p>
      </div>

      {unpaid.length > 0 && (
        <Link
          href="/student/invoices"
          className="flex items-center gap-3 rounded-card border border-accent bg-accent/15 p-4 transition-colors hover:bg-accent/25"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/30 text-warning">
            <ReceiptText className="size-4.5" />
          </span>
          <div className="flex-1 text-sm">
            <p className="font-medium">
              {unpaid.length === 1 ? "1 invoice to pay" : `${unpaid.length} invoices to pay`} ·{" "}
              {formatIDR(unpaid.reduce((s, i) => s + i.amount, 0))}
            </p>
            <p className="text-muted-foreground">Pay to unlock the class schedule and logbooks.</p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
      )}

      {classes.error ? (
        <ErrorState error={classes.error} onRetry={() => classes.refetch()} />
      ) : classes.isPending ? (
        <LoadingRows rows={3} />
      ) : classes.data.classes.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              title="No paid classes yet"
              description="Enroll in a group class and pay its first package to see the schedule, logbooks and your hours here."
            />
            <Button asChild className="w-full">
              <Link href="/student/explore">Explore classes</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        classes.data.classes.map((c) => <MyClassCard key={c.id} c={c} />)
      )}
    </div>
  );
}

function MyClassCard({ c }: { c: Schemas["StudentClass"] }) {
  const meta = classMeta(c.name, c.description);
  const flag = balanceFlag(c);
  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-sm">
      <Link
        href={`/student/classes/${c.id}`}
        className={cn("relative block overflow-hidden bg-gradient-to-br p-4 text-white", SUBJECT_GRADIENT[meta.subject])}
      >
        <Image
          src="/brand/star-mark.png"
          alt=""
          width={96}
          height={107}
          aria-hidden
          className="pointer-events-none absolute -top-2 -right-3 opacity-15"
        />
        <div className="relative flex flex-wrap items-center gap-1.5">
          {meta.level && (
            <Badge className="bg-accent font-semibold text-accent-foreground">
              <GraduationCap /> {meta.level}
            </Badge>
          )}
          {meta.subjectLabel && <Badge className="bg-white/15 text-white">{meta.subjectLabel}</Badge>}
          {flag !== "ok" && <StatusBadge status={flag} className="bg-white text-foreground" />}
        </div>
        <div className="relative mt-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-lg leading-snug font-semibold">{c.name}</p>
            <p className="text-sm text-white/80">with {c.tutorName}</p>
          </div>
          <ChevronRight className="size-5 shrink-0 text-white/80" />
        </div>
      </Link>

      <div className="space-y-4 p-4">
        <div>
          <div className="mb-2 flex items-end justify-between">
            <p>
              <span className="text-3xl font-semibold tabular-nums">{formatMinutes(c.remainingMinutes)}</span>
              <span className="ml-1 text-sm text-muted-foreground">left of {formatMinutes(c.paidMinutes)}</span>
            </p>
          </div>
          <HoursMeter
            paidMinutes={c.paidMinutes}
            usedMinutes={c.usedMinutes}
            awaitingMinutes={c.awaitingMinutes}
            reservedMinutes={c.reservedMinutes}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            {formatMinutes(c.usedMinutes)} used · {formatMinutes(c.reservedMinutes)} booked for upcoming lessons
            {c.awaitingMinutes > 0 && ` · ${formatMinutes(c.awaitingMinutes)} awaiting tutor notes`}
          </p>
        </div>

        {c.nextLessonAt && (
          <p className="flex items-center gap-2 rounded-lg bg-secondary/60 p-3 text-sm">
            <CalendarClock className="size-4 text-muted-foreground" />
            Next lesson <span className="font-medium">{formatDateTime(c.nextLessonAt)}</span>
          </p>
        )}

        {flag !== "ok" &&
          (c.hasUnpaidPackage ? (
            <p className="rounded-lg bg-muted p-3 text-sm">
              Your new package invoice is waiting.{" "}
              <Link href="/student/invoices" className="font-medium underline underline-offset-4">
                Pay it
              </Link>{" "}
              to keep joining lessons.
            </p>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted p-3">
              <p className="text-sm">
                {flag === "out"
                  ? "You're out of hours — new lessons won't include you."
                  : "Running low on hours. Buy a new package before your next lessons."}
              </p>
              <BuyPackageButton enrollmentId={c.enrollmentId} className={c.name} hours={c.defaultPackageHours} />
            </div>
          ))}
      </div>
    </Card>
  );
}
