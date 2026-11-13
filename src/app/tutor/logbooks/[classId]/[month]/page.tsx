"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  Info,
  Lightbulb,
  ListChecks,
  Lock,
  MessageSquareWarning,
  PenLine,
  Pencil,
  Send,
  Sparkles,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "cn";
import { ActionSheet, FactRow } from "@/components/action-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState, LoadingRows, Spinner, StatusBadge } from "@/components/ui-kit";
import { api, unwrap, type Schemas } from "@/lib/api/client";
import { SUBJECT_GRADIENT, classMeta } from "@/lib/class-meta";
import { TZ, formatDateTime, formatMonth, formatTime, humanize } from "@/lib/format";
import { useOnce } from "@/lib/use-once";

type MonthLesson = Schemas["TutorLogbookMonth"]["lessons"][number];

const dayNum = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric" });
const weekdayShort = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "short" });
const weekdayLong = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "long", day: "numeric", month: "short" });

export default function LogbookMonthPage() {
  const { classId, month } = useParams<{ classId: string; month: string }>();
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const logbook = useQuery({
    queryKey: ["tutor-logbook", classId, month],
    queryFn: () =>
      unwrap(api.GET("/tutor/classes/{classId}/logbooks/{month}", { params: { path: { classId, month } } })),
  });

  const submit = useMutation({
    mutationFn: () =>
      unwrap(api.POST("/tutor/classes/{classId}/logbooks/{month}/submit", { params: { path: { classId, month } } })),
    onSuccess: () => {
      toast.success("Submitted for review", { description: "You'll be paid for these lessons once it's approved." });
      setConfirmSubmit(false);
    },
  });
  const submitOnce = useOnce(submit.mutate, submit.isPending);

  if (logbook.error) return <ErrorState error={logbook.error} onRetry={() => logbook.refetch()} />;
  if (logbook.isPending) return <LoadingRows rows={5} />;

  const lb = logbook.data.logbook;
  const meta = classMeta(lb.class.name);
  const lastReturn = [...lb.reviews].reverse().find((r) => r.action === "changes_requested");
  const lessons = lb.lessons.filter((l) => l.status === "scheduled"); // newest first (API order)
  const cancelled = lb.lessons.length - lessons.length;
  const logged = lessons.filter((l) => l.entry).length;
  const toWrite = lessons.filter((l) => l.hasEnded && !l.entry).length;
  const upcoming = lessons.filter((l) => !l.hasEnded).length;
  const pct = lessons.length ? Math.round((logged / lessons.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <Link href="/tutor/logbooks" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" /> Logbooks
      </Link>

      {/* Header: month, class, status and progress at a glance */}
      <section className={cn("relative overflow-hidden rounded-card bg-gradient-to-br p-5 text-white", SUBJECT_GRADIENT[meta.subject])}>
        <Image
          src="/brand/star-mark.png"
          alt=""
          width={120}
          height={134}
          aria-hidden
          className="pointer-events-none absolute -right-5 -bottom-6 opacity-20"
        />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">Logbook</p>
            <h1 className="mt-1 text-2xl font-semibold">{formatMonth(lb.month)}</h1>
            <p className="text-sm text-white/80">{lb.class.name}</p>
          </div>
          <StatusBadge status={lb.status} className="bg-white text-foreground" />
        </div>
        <div className="relative mt-4">
          <div className="mb-1.5 flex justify-between text-sm">
            <span>
              <span className="font-semibold">{logged}</span> of {lessons.length} lessons logged
            </span>
            <span className="font-semibold tabular-nums">{pct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {toWrite > 0 && (
              <Badge className="bg-accent text-accent-foreground">
                <PenLine /> {toWrite} to write
              </Badge>
            )}
            {upcoming > 0 && (
              <Badge className="bg-white/15 text-white">
                <Clock /> {upcoming} upcoming
              </Badge>
            )}
            {cancelled > 0 && (
              <Badge className="bg-white/15 text-white">
                <XCircle /> {cancelled} cancelled
              </Badge>
            )}
          </div>
        </div>
      </section>

      {/* What happens next */}
      {lb.status === "changes_requested" && lastReturn && (
        <section className="rounded-card border border-destructive/30 bg-destructive/5 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <MessageSquareWarning className="size-4" /> Sent back by {lastReturn.actorName}
          </p>
          <blockquote className="mt-2 border-l-2 border-destructive/40 pl-3 text-sm">“{lastReturn.comment}”</blockquote>
          <p className="mt-2 text-xs text-muted-foreground">Fix the entries below, then resubmit.</p>
        </section>
      )}
      {lb.status === "submitted" && (
        <section className="flex gap-3 rounded-card border bg-secondary/60 p-4 text-sm">
          <Lock className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-semibold">Waiting for review</p>
            <p className="text-muted-foreground">The admin is reviewing this month. It&apos;s locked until they approve it or send it back.</p>
          </div>
        </section>
      )}
      {lb.status === "approved" && (
        <section className="flex gap-3 rounded-card border border-success/30 bg-success/5 p-4 text-sm">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
          <div>
            <p className="font-semibold">Approved</p>
            <p className="text-muted-foreground">Students can read it now, and these lessons count towards your earnings.</p>
          </div>
        </section>
      )}

      {lb.editable && (
        <section className="space-y-3 rounded-card border bg-card p-4">
          {lb.blockers.length > 0 ? (
            <>
              <p className="flex items-center gap-2 text-sm font-semibold">
                <ListChecks className="size-4" /> Before you can submit
              </p>
              <ul className="space-y-1.5 text-sm">
                {lb.blockers.map((b) => (
                  <li key={b} className="flex gap-2 text-muted-foreground">
                    <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-warning" />
                    {b}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="flex items-center gap-2 text-sm font-semibold text-success">
              <Sparkles className="size-4" /> Every lesson is logged — ready to submit
            </p>
          )}
          <Button className="h-12 w-full rounded-full text-base" disabled={lb.blockers.length > 0} onClick={() => setConfirmSubmit(true)}>
            <Send /> {lb.status === "changes_requested" ? "Resubmit for review" : "Finalise & submit"}
          </Button>
        </section>
      )}

      {/* Lessons, newest first, as a timeline */}
      <section aria-label="Lessons">
        <h2 className="mb-3 text-base font-semibold">Lessons</h2>
        <ol className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[1.4rem] before:w-px before:bg-border">
          {lessons.map((l, i) => (
            <LessonEntry key={l.id} index={lessons.length - i} lesson={l} classId={classId} month={month} />
          ))}
        </ol>
      </section>

      {lb.reviews.length > 0 && (
        <section aria-label="History">
          <h2 className="mb-3 text-base font-semibold">History</h2>
          <ol className="space-y-3">
            {lb.reviews.map((r, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span
                  className={cn(
                    "mt-1 size-2.5 shrink-0 rounded-full",
                    r.action === "approved" ? "bg-success" : r.action === "changes_requested" ? "bg-destructive" : "bg-accent",
                  )}
                />
                <div>
                  <p className="font-medium">{humanize(r.action)}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.actorName} · {formatDateTime(r.createdAt)}
                  </p>
                  {r.comment && <p className="mt-1 rounded-lg bg-muted px-3 py-2">“{r.comment}”</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <ActionSheet
        open={confirmSubmit}
        onOpenChange={setConfirmSubmit}
        title={`Submit ${formatMonth(lb.month)} for review?`}
        description={lb.class.name}
        confirmLabel={lb.status === "changes_requested" ? "Resubmit" : "Submit"}
        cancelLabel="Keep editing"
        onConfirm={() => submitOnce()}
        pending={submit.isPending}
      >
        <div className="divide-y rounded-xl border px-3">
          <FactRow icon={CalendarDays} label="Month" value={formatMonth(lb.month)} />
          <FactRow icon={BookOpenCheck} label="Lessons logged" value={`${logged}`} strong />
        </div>
        <p className="flex gap-2 rounded-xl bg-accent/15 p-3 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-warning" />
          It&apos;s locked while the admin reviews it. Once approved, students and parents can read it and these lessons
          count towards your earnings.
        </p>
      </ActionSheet>
    </div>
  );
}

// ---------------------------------------------------------------------------

const entrySchema = z.object({
  topic: z.string().trim().min(1, "Add a topic").max(200),
  activities: z.string().trim().min(1, "Describe what happened").max(4000),
  tutorObservation: z.string().trim().min(1, "Add your observation").max(4000),
  futureRecommendation: z.string().trim().min(1, "Say what comes next").max(4000),
});
type Entry = z.infer<typeof entrySchema>;

function LessonEntry({ index, lesson, classId, month }: { index: number; lesson: MonthLesson; classId: string; month: string }) {
  const [editing, setEditing] = useState(false);
  const entry = lesson.entry;
  const form = useForm<Entry>({
    resolver: zodResolver(entrySchema),
    values: {
      topic: entry?.topic ?? "",
      activities: entry?.activities ?? "",
      tutorObservation: entry?.tutorObservation ?? "",
      futureRecommendation: entry?.futureRecommendation ?? "",
    },
  });
  const save = useMutation({
    mutationFn: (body: Entry) =>
      unwrap(
        api.PUT("/tutor/classes/{classId}/logbooks/{month}/entries/{lessonId}", {
          params: { path: { classId, month, lessonId: lesson.id } },
          body,
        }),
      ),
    onSuccess: () => {
      toast.success(`Lesson ${index} saved`);
      setEditing(false);
    },
  });
  const saveOnce = useOnce(save.mutate, save.isPending);
  const errors = form.formState.errors;
  const showForm = lesson.canEdit && (editing || !entry);
  const state = !lesson.hasEnded ? "upcoming" : entry ? "logged" : "todo";
  const start = new Date(lesson.startsAt);

  return (
    <li id={`lesson-${lesson.id}`} className="relative flex scroll-mt-20 gap-3">
      {/* date bubble on the timeline */}
      <span
        className={cn(
          "relative z-10 flex size-11 shrink-0 flex-col items-center justify-center rounded-full border-2 bg-background leading-none",
          state === "logged" ? "border-success" : state === "todo" ? "border-accent" : "border-border",
        )}
      >
        <span className="text-sm font-semibold">{dayNum.format(start)}</span>
        <span className="text-[10px] text-muted-foreground uppercase">{weekdayShort.format(start)}</span>
      </span>

      <Card className="min-w-0 flex-1 gap-0 py-0 shadow-sm">
        <div className="flex items-start justify-between gap-2 border-b px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
              Lesson {index} · {weekdayLong.format(start)} · {formatTime(lesson.startsAt)}–{formatTime(lesson.endsAt)} WIB
            </p>
            {entry && !showForm ? (
              <p className="mt-0.5 leading-snug font-semibold">{entry.topic}</p>
            ) : (
              <p className="mt-0.5 font-semibold text-muted-foreground">{state === "upcoming" ? "Upcoming lesson" : "No entry yet"}</p>
            )}
          </div>
          {state === "logged" && !editing && (
            <Badge variant="success">
              <CheckCircle2 /> Logged
            </Badge>
          )}
          {state === "todo" && !showForm && <Badge variant="warning">To write</Badge>}
          {state === "upcoming" && <Badge variant="outline">Upcoming</Badge>}
        </div>

        <div className="p-4">
          {state === "upcoming" ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4" /> You can write this entry once the lesson has ended.
            </p>
          ) : showForm ? (
            <form onSubmit={form.handleSubmit((v) => saveOnce(v))} className="grid gap-4" noValidate>
              <EntryField label="Topic" error={errors.topic?.message} id={`topic-${lesson.id}`}>
                <Input
                  id={`topic-${lesson.id}`}
                  placeholder="e.g. Linear equations"
                  className="h-11"
                  {...form.register("topic")}
                  aria-invalid={!!errors.topic}
                />
              </EntryField>
              <EntryField label="What happened" error={errors.activities?.message} id={`act-${lesson.id}`}>
                <Textarea
                  id={`act-${lesson.id}`}
                  rows={3}
                  placeholder="What did you cover and how?"
                  {...form.register("activities")}
                  aria-invalid={!!errors.activities}
                />
              </EntryField>
              <EntryField label="Your observation" error={errors.tutorObservation?.message} id={`obs-${lesson.id}`}>
                <Textarea
                  id={`obs-${lesson.id}`}
                  rows={3}
                  placeholder="How did the students do? Anything parents should know?"
                  {...form.register("tutorObservation")}
                  aria-invalid={!!errors.tutorObservation}
                />
              </EntryField>
              <EntryField label="What comes next" error={errors.futureRecommendation?.message} id={`rec-${lesson.id}`}>
                <Textarea
                  id={`rec-${lesson.id}`}
                  rows={2}
                  placeholder="Next topic, homework or practice"
                  {...form.register("futureRecommendation")}
                  aria-invalid={!!errors.futureRecommendation}
                />
              </EntryField>
              <div className="grid gap-2">
                <Button type="submit" className="h-12 rounded-full text-base" disabled={save.isPending}>
                  {save.isPending && <Spinner />}
                  Save entry
                </Button>
                {entry && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 rounded-full"
                    onClick={() => (form.reset(), setEditing(false))}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          ) : entry ? (
            <div className="space-y-4">
              <EntrySection icon={BookOpenCheck} label="What happened" text={entry.activities} />
              <EntrySection icon={Eye} label="Your observation" text={entry.tutorObservation} />
              <EntrySection icon={Lightbulb} label="What comes next" text={entry.futureRecommendation} />
              {lesson.canEdit && (
                <Button variant="outline" className="h-11 w-full rounded-full" onClick={() => setEditing(true)}>
                  <Pencil /> Edit
                </Button>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No entry was written for this lesson.</p>
          )}
        </div>
      </Card>
    </li>
  );
}

function EntrySection({
  icon: Icon,
  label,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  text: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground/80">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
        <p className="mt-0.5 text-sm whitespace-pre-line">{text}</p>
      </div>
    </div>
  );
}

function EntryField({ label, id, error, children }: { label: string; id: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
