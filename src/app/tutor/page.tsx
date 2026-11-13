"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronRight, MessageSquareWarning, PenLine, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { SectionTitle, StatTile, WelcomeBanner } from "@/components/home/home-kit";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingRows } from "@/components/ui-kit";
import { api, unwrap } from "@/lib/api/client";
import { formatDateTime, formatIDR, formatLessonSlot, formatMonth, formatTime, TZ } from "@/lib/format";

/** "YYYY-MM" of a timestamp in WIB — the logbook month a lesson belongs to. */
const wibMonth = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit" }).format(new Date(iso)).slice(0, 7);
const dayNum = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric" });
const monthShort = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, month: "short" });
const weekday = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "long" });

export default function TutorHome() {
  const classes = useQuery({ queryKey: ["tutor-classes"], queryFn: () => unwrap(api.GET("/tutor/classes")) });
  const lessons = useQuery({ queryKey: ["tutor-lessons"], queryFn: () => unwrap(api.GET("/tutor/lessons")) });
  const logbooks = useQuery({ queryKey: ["tutor-logbooks"], queryFn: () => unwrap(api.GET("/tutor/logbooks")) });
  const earnings = useQuery({ queryKey: ["tutor-earnings"], queryFn: () => unwrap(api.GET("/tutor/earnings")) });

  const fetchedAt = lessons.dataUpdatedAt;
  const { toLog, upcoming, thisWeek } = useMemo(() => {
    const all = (lessons.data?.lessons ?? []).filter((l) => l.status === "scheduled");
    const future = all.filter((l) => new Date(l.endsAt).getTime() > fetchedAt);
    return {
      toLog: all.filter((l) => l.hasEnded && !l.hasEntry),
      upcoming: future.slice(0, 5),
      thisWeek: future.filter((l) => new Date(l.startsAt).getTime() < fetchedAt + 7 * 86_400_000).length,
    };
  }, [lessons.data, fetchedAt]);
  const sentBack = logbooks.data?.logbooks.filter((l) => l.status === "changes_requested") ?? [];
  const students = (classes.data?.classes ?? []).reduce((s, c) => s + c.activeStudents, 0);

  const error = classes.error ?? lessons.error ?? logbooks.error;
  if (error) return <ErrorState error={error} onRetry={() => (classes.refetch(), lessons.refetch(), logbooks.refetch())} />;

  const next = upcoming[0];
  const banner =
    sentBack.length > 0
      ? { title: "A logbook needs a quick fix", body: "The admin left a comment. Update it and resubmit.", action: { href: `/tutor/logbooks/${sentBack[0]!.classId}/${sentBack[0]!.month}`, label: "Open logbook" } }
      : toLog.length > 0
        ? { title: `${toLog.length} lesson${toLog.length === 1 ? "" : "s"} to log`, body: "Students' hours are only counted once you log the lesson — and parents read these.", action: { href: `/tutor/logbooks/${toLog[0]!.classId}/${wibMonth(toLog[0]!.startsAt)}`, label: "Write entry" } }
        : next
          ? { title: `Next up: ${next.className}`, body: `${formatDateTime(next.startsAt)} · ${next.participantCount} student(s).`, action: { href: `/tutor/classes/${next.classId}`, label: "Open class" } }
          : { title: "All caught up ✨", body: "No lessons scheduled. Open a class to plan the next ones." };

  return (
    <div className="space-y-6">
      <WelcomeBanner eyebrow="Teaching" title={banner.title} body={banner.body} action={banner.action} />

      <section aria-label="Summary" className="grid grid-cols-2 gap-3">
        <StatTile icon={CalendarDays} tone="navy" label="Lessons this week" value={lessons.data ? thisWeek : "—"} />
        <StatTile
          icon={PenLine}
          tone={toLog.length ? "gold" : "green"}
          label="To log"
          value={lessons.data ? toLog.length : "—"}
          href="/tutor/logbooks"
        />
        <StatTile
          icon={Wallet}
          tone="gold"
          label="Pending approval"
          value={earnings.data ? formatIDR(earnings.data.totals.pending) : "—"}
          hint={earnings.data ? `${formatIDR(earnings.data.totals.approved)} approved` : undefined}
          href="/tutor/earnings"
        />
        <StatTile icon={Users} tone="green" label="Active students" value={classes.data ? students : "—"} href="/tutor/classes" />
      </section>

      {(sentBack.length > 0 || toLog.length > 0) && (
        <section>
          <SectionTitle>Needs your attention</SectionTitle>
          <div className="space-y-2">
            {sentBack.map((lb) => (
              <Link
                key={`${lb.classId}-${lb.month}`}
                href={`/tutor/logbooks/${lb.classId}/${lb.month}`}
                className="flex items-center gap-3 rounded-card border border-destructive/30 bg-destructive/5 p-3"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <MessageSquareWarning className="size-4.5" />
                </span>
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
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/30 text-warning">
                  <PenLine className="size-4.5" />
                </span>
                <div className="flex-1 text-sm">
                  <p className="font-medium">Log {l.className}</p>
                  <p className="text-muted-foreground">{formatLessonSlot(l.startsAt, l.endsAt)}</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionTitle>Upcoming lessons</SectionTitle>
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
              <li key={l.id}>
                <Link
                  href={`/tutor/classes/${l.classId}`}
                  className="flex items-center gap-3 rounded-card border bg-card p-3 transition-colors hover:bg-muted/40"
                >
                  <span className="flex w-12 shrink-0 flex-col items-center rounded-lg bg-primary py-1.5 text-primary-foreground">
                    <span className="text-lg leading-none font-semibold">{dayNum.format(new Date(l.startsAt))}</span>
                    <span className="text-[10px] tracking-wide text-accent uppercase">{monthShort.format(new Date(l.startsAt))}</span>
                  </span>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="truncate font-medium">{l.className}</p>
                    <p className="text-muted-foreground">
                      {weekday.format(new Date(l.startsAt))} · {formatTime(l.startsAt)}–{formatTime(l.endsAt)} WIB
                    </p>
                  </div>
                  <Badge variant="secondary">
                    <Users /> {l.participantCount}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
