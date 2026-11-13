"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Lock, MessageSquareWarning, Pencil, Send } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState, LoadingRows, Spinner, StatusBadge } from "@/components/ui-kit";
import { api, unwrap, type Schemas } from "@/lib/api/client";
import { formatDateTime, formatLessonSlot, formatMonth, humanize } from "@/lib/format";

type MonthLesson = Schemas["TutorLogbookMonth"]["lessons"][number];

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

  if (logbook.error) return <ErrorState error={logbook.error} onRetry={() => logbook.refetch()} />;
  if (logbook.isPending) return <LoadingRows rows={5} />;

  const lb = logbook.data.logbook;
  const lastReturn = [...lb.reviews].reverse().find((r) => r.action === "changes_requested");
  const lessons = lb.lessons.filter((l) => l.status === "scheduled");
  const cancelled = lb.lessons.length - lessons.length;

  return (
    <div className="space-y-5">
      <Link href="/tutor/logbooks" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" /> Logbooks
      </Link>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{formatMonth(lb.month)}</h1>
          <p className="text-sm text-muted-foreground">{lb.class.name}</p>
        </div>
        <StatusBadge status={lb.status} />
      </div>

      {lb.status === "changes_requested" && lastReturn && (
        <Alert variant="destructive">
          <MessageSquareWarning />
          <AlertTitle>Sent back by {lastReturn.actorName}</AlertTitle>
          <AlertDescription>
            “{lastReturn.comment}”<br />
            Fix the entries below, then submit again.
          </AlertDescription>
        </Alert>
      )}
      {lb.status === "submitted" && (
        <Alert>
          <Lock />
          <AlertTitle>Waiting for review</AlertTitle>
          <AlertDescription>The admin is reviewing this month. It&apos;s locked until they approve it or send it back.</AlertDescription>
        </Alert>
      )}
      {lb.status === "approved" && (
        <Alert className="border-success/40 bg-success/5">
          <CheckCircle2 className="text-success" />
          <AlertTitle>Approved</AlertTitle>
          <AlertDescription>Students can read it now, and these lessons count towards your earnings.</AlertDescription>
        </Alert>
      )}

      <ol className="space-y-3">
        {lessons.map((l, i) => (
          <LessonEntry key={l.id} index={i + 1} lesson={l} classId={classId} month={month} />
        ))}
      </ol>
      {cancelled > 0 && (
        <p className="text-xs text-muted-foreground">{cancelled} cancelled lesson(s) this month don&apos;t need an entry.</p>
      )}

      {lb.editable && (
        <div className="space-y-2">
          {lb.blockers.length > 0 && (
            <ul className="space-y-1 text-sm text-muted-foreground">
              {lb.blockers.map((b) => (
                <li key={b}>• {b}</li>
              ))}
            </ul>
          )}
          <Button className="h-11 w-full" disabled={lb.blockers.length > 0} onClick={() => setConfirmSubmit(true)}>
            <Send /> {lb.status === "changes_requested" ? "Resubmit for review" : "Finalise & submit"}
          </Button>
        </div>
      )}

      {lb.reviews.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">History</h2>
          <ol className="space-y-2">
            {lb.reviews.map((r, i) => (
              <li key={i} className="border-l-2 border-accent pl-3 text-sm">
                <p className="font-medium">{humanize(r.action)}</p>
                <p className="text-xs text-muted-foreground">
                  {r.actorName} · {formatDateTime(r.createdAt)}
                </p>
                {r.comment && <p className="mt-0.5">“{r.comment}”</p>}
              </li>
            ))}
          </ol>
        </section>
      )}

      <Dialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit {formatMonth(lb.month)} for review?</DialogTitle>
            <DialogDescription>
              The logbook is locked while the admin reviews it. Once approved, students and parents can read it and your
              {" "}
              {lessons.length} lesson(s) are added to your earnings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmSubmit(false)}>
              Keep editing
            </Button>
            <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
              {submit.isPending && <Spinner />}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  const errors = form.formState.errors;
  const showForm = lesson.canEdit && (editing || !entry);

  return (
    <li id={`lesson-${lesson.id}`} className="scroll-mt-20">
      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">
                Lesson {index} · {formatLessonSlot(lesson.startsAt, lesson.endsAt)}
              </p>
              {entry && !showForm && <p className="font-semibold">{entry.topic}</p>}
            </div>
            {entry && lesson.canEdit && !editing && (
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                <Pencil /> Edit
              </Button>
            )}
          </div>

          {!lesson.hasEnded ? (
            <p className="text-sm text-muted-foreground">You can write this entry once the lesson has ended.</p>
          ) : showForm ? (
            <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="grid gap-3" noValidate>
              <EntryField label="Topic" error={errors.topic?.message} id={`topic-${lesson.id}`}>
                <Input id={`topic-${lesson.id}`} {...form.register("topic")} aria-invalid={!!errors.topic} />
              </EntryField>
              <EntryField label="What happened" error={errors.activities?.message} id={`act-${lesson.id}`}>
                <Textarea id={`act-${lesson.id}`} rows={3} {...form.register("activities")} aria-invalid={!!errors.activities} />
              </EntryField>
              <EntryField label="Your observation" error={errors.tutorObservation?.message} id={`obs-${lesson.id}`}>
                <Textarea
                  id={`obs-${lesson.id}`}
                  rows={2}
                  {...form.register("tutorObservation")}
                  aria-invalid={!!errors.tutorObservation}
                />
              </EntryField>
              <EntryField label="What comes next" error={errors.futureRecommendation?.message} id={`rec-${lesson.id}`}>
                <Textarea
                  id={`rec-${lesson.id}`}
                  rows={2}
                  {...form.register("futureRecommendation")}
                  aria-invalid={!!errors.futureRecommendation}
                />
              </EntryField>
              <div className="flex justify-end gap-2">
                {entry && (
                  <Button type="button" variant="outline" onClick={() => (form.reset(), setEditing(false))}>
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={save.isPending}>
                  {save.isPending && <Spinner />}
                  Save entry
                </Button>
              </div>
            </form>
          ) : entry ? (
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">What happened</dt>
                <dd className="whitespace-pre-line">{entry.activities}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Your observation</dt>
                <dd className="whitespace-pre-line">{entry.tutorObservation}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">What comes next</dt>
                <dd className="whitespace-pre-line">{entry.futureRecommendation}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">No entry was written for this lesson.</p>
          )}
        </CardContent>
      </Card>
    </li>
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
