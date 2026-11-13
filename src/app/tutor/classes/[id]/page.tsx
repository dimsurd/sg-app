"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarPlus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { TextPromptDialog } from "@/components/text-prompt-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, ErrorState, LoadingRows, Spinner, StatusBadge } from "@/components/ui-kit";
import { api, unwrap, type Schemas } from "@/lib/api/client";
import { formatIDR, formatLessonSlot, formatMinutes, TZ } from "@/lib/format";
import { useOnce } from "@/lib/use-once";

type Lesson = Schemas["Lesson"];

/** Today's date in WIB as YYYY-MM-DD (for the date picker's default/min). */
const todayWib = () => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());

export default function TutorClassPage() {
  const { id } = useParams<{ id: string }>();
  const [cancelling, setCancelling] = useState<Lesson | null>(null);
  const cls = useQuery({
    queryKey: ["tutor-class", id],
    queryFn: () => unwrap(api.GET("/tutor/classes/{id}", { params: { path: { id } } })),
  });
  const lessons = useQuery({
    queryKey: ["tutor-lessons", id],
    queryFn: () => unwrap(api.GET("/tutor/lessons", { params: { query: { classId: id } } })),
  });

  const fetchedAt = lessons.dataUpdatedAt;
  const { upcoming, past } = useMemo(() => {
    const all = lessons.data?.lessons ?? [];
    return {
      upcoming: all.filter((l) => new Date(l.endsAt).getTime() > fetchedAt),
      past: all.filter((l) => new Date(l.endsAt).getTime() <= fetchedAt).reverse().slice(0, 10),
    };
  }, [lessons.data, fetchedAt]);

  const cancel = useMutation({
    mutationFn: ({ lessonId, reason }: { lessonId: string; reason: string }) =>
      unwrap(api.POST("/tutor/lessons/{id}/cancel", { params: { path: { id: lessonId } }, body: { reason } })),
    onSuccess: () => {
      toast.success("Lesson cancelled — students' hours were released");
      setCancelling(null);
    },
  });

  if (cls.error) return <ErrorState error={cls.error} onRetry={() => cls.refetch()} />;

  return (
    <div className="space-y-5">
      <Link href="/tutor" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" /> Teaching
      </Link>
      {cls.isPending ? (
        <LoadingRows rows={2} />
      ) : (
        <div>
          <h1 className="text-2xl font-semibold">{cls.data.class.name}</h1>
          <p className="text-sm text-muted-foreground">
            You earn {formatIDR(cls.data.class.tutorRatePerHour)} per lesson hour, however many students attend.
          </p>
        </div>
      )}

      <ScheduleForm classId={id} />

      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
        </CardHeader>
        <CardContent>
          {cls.isPending ? (
            <LoadingRows rows={2} />
          ) : cls.data.class.students.length === 0 ? (
            <EmptyState title="No paid students yet" />
          ) : (
            <ul className="divide-y">
              {cls.data.class.students.map((s) => (
                <li key={s.studentId} className="flex items-center justify-between py-2 text-sm">
                  <span>{s.fullName}</span>
                  <span className={s.availableMinutes <= 0 ? "text-destructive" : "text-muted-foreground"}>
                    {formatMinutes(Math.max(0, s.availableMinutes))} free to book
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Students are only added to a lesson if they have enough hours for all of it. Students with 0h free to book
            won&apos;t be added to new lessons until they buy a new package.
          </p>
        </CardContent>
      </Card>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Upcoming</h2>
        {lessons.isPending ? (
          <LoadingRows rows={2} />
        ) : upcoming.length === 0 ? (
          <EmptyState title="No upcoming lessons" />
        ) : (
          <ul className="space-y-2">
            {upcoming.map((l) => (
              <li key={l.id} className="flex items-center gap-3 rounded-card border bg-card p-3">
                <div className="flex-1 text-sm">
                  <p className={l.status === "cancelled" ? "font-medium text-muted-foreground line-through" : "font-medium"}>
                    {formatLessonSlot(l.startsAt, l.endsAt)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {l.status === "cancelled"
                      ? `Cancelled${l.cancelReason ? `: ${l.cancelReason}` : ""}`
                      : `${formatMinutes(l.durationMinutes)} · ${l.participantCount} student(s)`}
                  </p>
                </div>
                {l.status === "scheduled" ? (
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setCancelling(l)}>
                    Cancel
                  </Button>
                ) : (
                  <StatusBadge status="cancelled" />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Recent</h2>
          <ul className="space-y-2">
            {past.map((l) => (
              <li key={l.id} className="flex items-center gap-3 rounded-card border bg-card p-3 text-sm">
                <p className="flex-1">{formatLessonSlot(l.startsAt, l.endsAt)}</p>
                {l.status === "cancelled" ? (
                  <StatusBadge status="cancelled" />
                ) : (
                  <StatusBadge status={l.hasEntry ? "logged" : "not_logged"} />
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <TextPromptDialog
        open={!!cancelling}
        onOpenChange={(o) => !o && setCancelling(null)}
        title="Cancel this lesson?"
        description={
          cancelling
            ? `${formatLessonSlot(cancelling.startsAt, cancelling.endsAt)}. Students get their hours back, and cancelled lessons aren't paid.`
            : undefined
        }
        label="Reason (shown to students)"
        placeholder="e.g. I'm unwell — we'll make it up next week"
        confirmLabel="Cancel lesson"
        destructive
        pending={cancel.isPending}
        onConfirm={(reason) => cancelling && cancel.mutate({ lessonId: cancelling.id, reason })}
      />
    </div>
  );
}

function ScheduleForm({ classId }: { classId: string }) {
  const [date, setDate] = useState(todayWib);
  const [start, setStart] = useState("16:00");
  const [end, setEnd] = useState("17:30");
  const invalid = end <= start;

  const schedule = useMutation({
    // The tutor picks WIB wall-clock times; send them with an explicit +07:00 offset.
    mutationFn: () =>
      unwrap(
        api.POST("/tutor/lessons", {
          body: { classId, startsAt: `${date}T${start}:00+07:00`, endsAt: `${date}T${end}:00+07:00` },
        }),
      ),
    meta: { silent: true },
    onSuccess: (r) => {
      toast.success(`Lesson scheduled with ${r.added} student(s)`, {
        description: r.skipped.length
          ? `Not added (not enough hours): ${r.skipped.map((s) => s.studentName).join(", ")}`
          : undefined,
      });
    },
  });

  const scheduleOnce = useOnce(schedule.mutate, schedule.isPending);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarPlus className="size-4" /> Schedule a lesson
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!invalid) scheduleOnce();
          }}
        >
          {schedule.error && (
            <Alert variant="destructive">
              <AlertDescription>{schedule.error.message}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="h-10" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="start">Starts (WIB)</Label>
              <Input id="start" type="time" step={900} value={start} onChange={(e) => setStart(e.target.value)} required className="h-10" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="end">Ends (WIB)</Label>
              <Input
                id="end"
                type="time"
                step={900}
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
                aria-invalid={invalid}
                className="h-10"
              />
            </div>
          </div>
          {invalid && <p className="text-xs text-destructive">The end time must be after the start time.</p>}
          <Button type="submit" disabled={invalid || schedule.isPending} className="h-10">
            {schedule.isPending && <Spinner />}
            Schedule
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
