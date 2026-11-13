"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, CalendarX2, Clock } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { cn } from "cn";
import { BuyPackageButton } from "@/components/student/buy-package-button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, ErrorState, HoursMeter, LoadingRows, StatusBadge } from "@/components/ui-kit";
import { api, unwrap } from "@/lib/api/client";
import { balanceFlag } from "@/lib/balance";
import { formatLessonSlot, formatMinutes, formatMonth } from "@/lib/format";

export default function StudentClassPage() {
  const { id } = useParams<{ id: string }>();
  const classes = useQuery({ queryKey: ["my-classes"], queryFn: () => unwrap(api.GET("/student/classes")) });
  const schedule = useQuery({
    queryKey: ["schedule", id],
    queryFn: () => unwrap(api.GET("/student/classes/{id}/schedule", { params: { path: { id } } })),
  });
  const logbooks = useQuery({
    queryKey: ["student-logbooks", id],
    queryFn: () => unwrap(api.GET("/student/classes/{id}/logbooks", { params: { path: { id } } })),
  });

  const cls = classes.data?.classes.find((c) => c.id === id);
  const fetchedAt = schedule.dataUpdatedAt;
  const { upcoming, past } = useMemo(() => {
    const lessons = schedule.data?.lessons ?? [];
    return {
      upcoming: lessons.filter((l) => new Date(l.endsAt).getTime() > fetchedAt),
      // Only lessons this student actually took part in (not ones held before they joined).
      past: lessons.filter((l) => new Date(l.endsAt).getTime() <= fetchedAt && l.isParticipant).reverse(),
    };
  }, [schedule.data, fetchedAt]);

  if (schedule.error) return <ErrorState error={schedule.error} onRetry={() => schedule.refetch()} />;

  return (
    <div className="space-y-5">
      <Link href="/student/classes" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" /> My classes
      </Link>

      {cls ? (
        <Card className="bg-primary text-primary-foreground ring-0">
          <CardContent className="space-y-3">
            <div>
              <h1 className="text-xl font-semibold">{cls.name}</h1>
              <p className="text-sm text-primary-foreground/70">with {cls.tutorName}</p>
            </div>
            <div className="flex items-end justify-between">
              <p>
                <span className="text-3xl font-semibold tabular-nums">{formatMinutes(cls.remainingMinutes)}</span>
                <span className="ml-1 text-sm text-primary-foreground/70">left of {formatMinutes(cls.paidMinutes)}</span>
              </p>
              {balanceFlag(cls) !== "ok" && !cls.hasUnpaidPackage && (
                <BuyPackageButton
                  enrollmentId={cls.enrollmentId}
                  className={cls.name}
                  hours={cls.defaultPackageHours}
                  variant="outline"
                />
              )}
            </div>
            <HoursMeter
              inverse
              paidMinutes={cls.paidMinutes}
              usedMinutes={cls.usedMinutes}
              awaitingMinutes={cls.awaitingMinutes}
              reservedMinutes={cls.reservedMinutes}
            />
            <p className="text-xs text-primary-foreground/70">
              {formatMinutes(cls.usedMinutes)} used · {formatMinutes(cls.reservedMinutes)} booked for upcoming lessons
              {cls.awaitingMinutes > 0 && ` · ${formatMinutes(cls.awaitingMinutes)} awaiting tutor notes`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <LoadingRows rows={2} />
      )}

      <Tabs defaultValue="schedule">
        <TabsList className="w-full">
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="logbooks">
            Logbooks{logbooks.data?.logbooks.length ? ` (${logbooks.data.logbooks.length})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="mt-4 space-y-6">
          {schedule.isPending ? (
            <LoadingRows rows={3} />
          ) : (
            <>
              <section>
                <h2 className="mb-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Upcoming</h2>
                {upcoming.length === 0 ? (
                  <EmptyState title="No upcoming lessons yet" description="Your tutor adds lessons here as they're scheduled." />
                ) : (
                  <ul className="space-y-2">{upcoming.map((l) => <LessonRow key={l.id} lesson={l} />)}</ul>
                )}
              </section>
              {past.length > 0 && (
                <section>
                  <h2 className="mb-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Past</h2>
                  <ul className="space-y-2">{past.map((l) => <LessonRow key={l.id} lesson={l} />)}</ul>
                </section>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="logbooks" className="mt-4 space-y-4">
          {logbooks.isPending ? (
            <LoadingRows rows={3} />
          ) : logbooks.data?.logbooks.length === 0 ? (
            <EmptyState
              title="No logbooks yet"
              description="After each month your tutor writes up every lesson. You'll see it here once it's been reviewed."
            />
          ) : (
            logbooks.data?.logbooks.map((lb) => (
              <Card key={lb.id}>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="size-4 text-muted-foreground" />
                    <h3 className="font-semibold">{formatMonth(lb.month)}</h3>
                  </div>
                  <ol className="space-y-4">
                    {lb.entries.map((e) => (
                      <li key={e.lessonId} className="border-l-2 border-accent pl-3">
                        <p className="text-xs text-muted-foreground">{formatLessonSlot(e.startsAt, e.endsAt)}</p>
                        <p className="font-medium">{e.topic}</p>
                        <dl className="mt-2 space-y-2 text-sm">
                          <div>
                            <dt className="text-xs font-medium text-muted-foreground">What we did</dt>
                            <dd>{e.activities}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-muted-foreground">Tutor&apos;s notes</dt>
                            <dd>{e.tutorObservation}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-muted-foreground">Next steps</dt>
                            <dd>{e.futureRecommendation}</dd>
                          </div>
                        </dl>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LessonRow({
  lesson: l,
}: {
  lesson: { startsAt: string; endsAt: string; durationMinutes: number; status: string; cancelReason?: string | null; isParticipant: boolean; hasEnded: boolean };
}) {
  const cancelled = l.status === "cancelled";
  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-card border bg-card p-3",
        (cancelled || !l.isParticipant) && "text-muted-foreground",
      )}
    >
      {cancelled ? <CalendarX2 className="mt-0.5 size-4" /> : <Clock className="mt-0.5 size-4 text-muted-foreground" />}
      <div className="flex-1 text-sm">
        <p className={cn("font-medium", cancelled && "line-through")}>{formatLessonSlot(l.startsAt, l.endsAt)}</p>
        <p className="text-xs">
          {formatMinutes(l.durationMinutes)}
          {cancelled && l.cancelReason ? ` · Cancelled: ${l.cancelReason}` : ""}
          {!cancelled && !l.isParticipant ? " · Not included — not enough hours when it was scheduled" : ""}
        </p>
      </div>
      {cancelled && <StatusBadge status="cancelled" />}
    </li>
  );
}
