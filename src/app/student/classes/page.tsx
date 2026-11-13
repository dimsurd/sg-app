"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarClock, ChevronRight, ReceiptText } from "lucide-react";
import Link from "next/link";
import { BuyPackageButton } from "@/components/student/buy-package-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState, HoursMeter, LoadingRows, StatusBadge } from "@/components/ui-kit";
import { api, unwrap } from "@/lib/api/client";
import { balanceFlag } from "@/lib/balance";
import { formatDateTime, formatIDR, formatMinutes } from "@/lib/format";

export default function StudentHome() {
  const classes = useQuery({ queryKey: ["my-classes"], queryFn: () => unwrap(api.GET("/student/classes")) });
  const invoices = useQuery({ queryKey: ["my-invoices"], queryFn: () => unwrap(api.GET("/student/invoices")) });
  const unpaid = invoices.data?.invoices.filter((i) => i.status === "unpaid") ?? [];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">My classes</h1>

      {unpaid.length > 0 && (
        <Link
          href="/student/invoices"
          className="flex items-center gap-3 rounded-card border border-accent bg-accent/15 p-4 transition-colors hover:bg-accent/25"
        >
          <ReceiptText className="size-5 shrink-0 text-warning" />
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
              <Link href="/student/browse">Browse classes</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        classes.data.classes.map((c) => {
          const flag = balanceFlag(c);
          return (
            <Card key={c.id} className="gap-4">
              <CardContent className="space-y-4">
                <Link href={`/student/classes/${c.id}`} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{c.name}</p>
                    <p className="text-sm text-muted-foreground">with {c.tutorName}</p>
                  </div>
                  <ChevronRight className="mt-1 size-5 text-muted-foreground" />
                </Link>

                <div>
                  <div className="mb-2 flex items-end justify-between">
                    <p>
                      <span className="text-3xl font-semibold tabular-nums">{formatMinutes(c.remainingMinutes)}</span>
                      <span className="ml-1 text-sm text-muted-foreground">left of {formatMinutes(c.paidMinutes)}</span>
                    </p>
                    {flag !== "ok" && <StatusBadge status={flag} />}
                  </div>
                  <HoursMeter paidMinutes={c.paidMinutes} usedMinutes={c.usedMinutes} reservedMinutes={c.reservedMinutes} />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {formatMinutes(c.usedMinutes)} used · {formatMinutes(c.reservedMinutes)} booked for upcoming lessons
                  </p>
                </div>

                {c.nextLessonAt && (
                  <p className="flex items-center gap-2 text-sm">
                    <CalendarClock className="size-4 text-muted-foreground" />
                    Next lesson {formatDateTime(c.nextLessonAt)}
                  </p>
                )}

                {flag !== "ok" &&
                  (c.hasUnpaidPackage ? (
                    <p className="rounded-md bg-muted p-3 text-sm">
                      Your new package invoice is waiting.{" "}
                      <Link href="/student/invoices" className="font-medium underline underline-offset-4">
                        Pay it
                      </Link>{" "}
                      to keep joining lessons.
                    </p>
                  ) : (
                    <div className="flex items-center justify-between gap-3 rounded-md bg-muted p-3">
                      <p className="text-sm">
                        {flag === "out"
                          ? "You're out of hours — new lessons won't include you."
                          : "Running low on hours. Buy a new package before your next lessons."}
                      </p>
                      <BuyPackageButton enrollmentId={c.enrollmentId} className={c.name} hours={c.defaultPackageHours} />
                    </div>
                  ))}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
