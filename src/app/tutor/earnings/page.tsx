"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingRows, StatusBadge } from "@/components/ui-kit";
import { api, unwrap } from "@/lib/api/client";
import { formatDate, formatIDR, formatMinutes, formatMonth } from "@/lib/format";

export default function TutorEarningsPage() {
  const earnings = useQuery({ queryKey: ["tutor-earnings"], queryFn: () => unwrap(api.GET("/tutor/earnings")) });
  if (earnings.error) return <ErrorState error={earnings.error} onRetry={() => earnings.refetch()} />;
  const d = earnings.data;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Earnings</h1>
        <p className="text-sm text-muted-foreground">
          Your tutor rate × lesson hours, for every lesson in an approved logbook.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="gap-1 bg-primary py-4 text-primary-foreground ring-0">
          <CardContent className="px-4">
            <p className="text-xs tracking-wide text-primary-foreground/70 uppercase">Approved</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{d ? formatIDR(d.totals.approved) : "—"}</p>
            <p className="text-xs text-primary-foreground/70">{d ? formatMinutes(d.totals.approvedMinutes) : " "}</p>
          </CardContent>
        </Card>
        <Card className="gap-1 py-4">
          <CardContent className="px-4">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">Pending approval</p>
            <p className="mt-1 text-xl font-semibold text-warning tabular-nums">{d ? formatIDR(d.totals.pending) : "—"}</p>
            <p className="text-xs text-muted-foreground">{d ? formatMinutes(d.totals.pendingMinutes) : " "}</p>
          </CardContent>
        </Card>
      </div>

      {!d ? (
        <LoadingRows rows={4} />
      ) : d.lines.length === 0 ? (
        <EmptyState title="No lessons taught yet" />
      ) : (
        d.months.map((m) => (
          <section key={m.month} className="space-y-2">
            <div className="flex items-baseline justify-between">
              <h2 className="font-semibold">{formatMonth(m.month)}</h2>
              <p className="text-sm tabular-nums">
                {formatIDR(m.approved + m.pending)}
                {m.pending > 0 && <span className="ml-1 text-xs text-warning">({formatIDR(m.pending)} pending)</span>}
              </p>
            </div>
            <ul className="divide-y rounded-card border bg-card">
              {d.lines
                .filter((l) => l.month === m.month)
                .map((l) => (
                  <li key={l.lessonId} className="flex items-center gap-3 p-3 text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{l.className}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(l.startsAt)} · {formatMinutes(l.minutes)} × {formatIDR(l.ratePerHour)}/h
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium tabular-nums">{formatIDR(l.amount)}</p>
                      <StatusBadge status={l.status} className="mt-0.5" />
                    </div>
                  </li>
                ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
