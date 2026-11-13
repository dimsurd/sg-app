"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarClock, ChevronRight, MessageSquareWarning, PenLine, Users } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingRows } from "@/components/ui-kit";
import { api, unwrap } from "@/lib/api/client";
import { formatDateTime, formatLessonSlot, formatMonth, TZ } from "@/lib/format";

/** "YYYY-MM" of a timestamp in WIB — the logbook month a lesson belongs to. */
const wibMonth = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit" }).format(new Date(iso)).slice(0, 7);

export default function TutorHome() {
  const classes = useQuery({ queryKey: ["tutor-classes"], queryFn: () => unwrap(api.GET("/tutor/classes")) });
  const lessons = useQuery({ queryKey: ["tutor-lessons"], queryFn: () => unwrap(api.GET("/tutor/lessons")) });
  const logbooks = useQuery({ queryKey: ["tutor-logbooks"], queryFn: () => unwrap(api.GET("/tutor/logbooks")) });

  const fetchedAt = lessons.dataUpdatedAt;
  const { toLog, upcoming } = useMemo(() => {
    const all = (lessons.data?.lessons ?? []).filter((l) => l.status === "scheduled");
    return {
      toLog: all.filter((l) => l.hasEnded && !l.hasEntry),
      upcoming: all.filter((l) => new Date(l.endsAt).getTime() > fetchedAt).slice(0, 5),
    };
  }, [lessons.data, fetchedAt]);
  const sentBack = logbooks.data?.logbooks.filter((l) => l.status === "changes_requested") ?? [];

  const error = classes.error ?? lessons.error ?? logbooks.error;
  if (error) return <ErrorState error={error} onRetry={() => (classes.refetch(), lessons.refetch(), logbooks.refetch())} />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Teaching</h1>

      {(sentBack.length > 0 || toLog.length > 0) && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Needs your attention</h2>
          {sentBack.map((lb) => (
            <Link
              key={`${lb.classId}-${lb.month}`}
              href={`/tutor/logbooks/${lb.classId}/${lb.month}`}
              className="flex items-center gap-3 rounded-card border border-destructive/30 bg-destructive/5 p-3"
            >
              <MessageSquareWarning className="size-5 shrink-0 text-destructive" />
              <div className="flex-1 text-sm">
                <p className="font-medium">
                  {lb.className} · {formatMonth(lb.month)} was sent back
                </p>
                <p className="text-muted-foreground">Read the admin&apos;s comment, fix it and resubmit.</p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
          {toLog.map((l) => (
            <Link
              key={l.id}
              href={`/tutor/logbooks/${l.classId}/${wibMonth(l.startsAt)}#lesson-${l.id}`}
              className="flex items-center gap-3 rounded-card border border-accent bg-accent/10 p-3"
            >
              <PenLine className="size-5 shrink-0 text-warning" />
              <div className="flex-1 text-sm">
                <p className="font-medium">Log {l.className}</p>
                <p className="text-muted-foreground">{formatLessonSlot(l.startsAt, l.endsAt)}</p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Upcoming lessons</h2>
        {lessons.isPending ? (
          <LoadingRows rows={3} />
        ) : upcoming.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState title="Nothing scheduled" description="Open a class below to schedule its next lessons." />
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((l) => (
              <li key={l.id} className="flex items-center gap-3 rounded-card border bg-card p-3">
                <CalendarClock className="size-4 text-muted-foreground" />
                <div className="flex-1 text-sm">
                  <p className="font-medium">{formatLessonSlot(l.startsAt, l.endsAt)}</p>
                  <p className="text-xs text-muted-foreground">
                    {l.className} · {l.participantCount} student(s)
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">My classes</h2>
        {!classes.data ? (
          <LoadingRows rows={2} />
        ) : classes.data.classes.length === 0 ? (
          <EmptyState title="No classes assigned yet" description="An admin assigns classes to you." />
        ) : (
          classes.data.classes.map((c) => (
            <Link key={c.id} href={`/tutor/classes/${c.id}`} className="block">
              <Card className="transition-colors hover:bg-muted/40">
                <CardContent className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-semibold">{c.name}</p>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="size-3.5" /> {c.activeStudents} active student(s)
                      {c.nextLessonAt && <> · next {formatDateTime(c.nextLessonAt)}</>}
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
