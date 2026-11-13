"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { EmptyState, ErrorState, LoadingRows, StatusBadge } from "@/components/ui-kit";
import { api, unwrap } from "@/lib/api/client";
import { formatMonth } from "@/lib/format";

export default function TutorLogbooksPage() {
  const logbooks = useQuery({ queryKey: ["tutor-logbooks"], queryFn: () => unwrap(api.GET("/tutor/logbooks")) });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Logbooks</h1>
        <p className="text-sm text-muted-foreground">
          One logbook per class per month. Write an entry after each lesson, then submit the month for review.
        </p>
      </div>
      {logbooks.error ? (
        <ErrorState error={logbooks.error} onRetry={() => logbooks.refetch()} />
      ) : logbooks.isPending ? (
        <LoadingRows rows={3} />
      ) : logbooks.data.logbooks.length === 0 ? (
        <EmptyState title="No lessons yet" description="Logbooks appear here once you schedule lessons." />
      ) : (
        <ul className="space-y-2">
          {logbooks.data.logbooks.map((lb) => {
            const missing = lb.endedCount - lb.entryCount;
            return (
              <li key={`${lb.classId}-${lb.month}`}>
                <Link
                  href={`/tutor/logbooks/${lb.classId}/${lb.month}`}
                  className="flex items-center gap-3 rounded-card border bg-card p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex-1">
                    <p className="font-semibold">{formatMonth(lb.month)}</p>
                    <p className="text-sm text-muted-foreground">
                      {lb.className} · {lb.entryCount}/{lb.lessonCount} logged
                      {missing > 0 && lb.status !== "approved" && <span className="text-warning"> · {missing} to write</span>}
                    </p>
                  </div>
                  <StatusBadge status={lb.status} />
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
