"use client";

import { BookOpenCheck, CalendarDays, CalendarPlus, ChevronRight, GraduationCap, Users, Wallet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Schemas } from "@/lib/api/client";
import { SUBJECT_GRADIENT, classMeta } from "@/lib/class-meta";
import { TZ, formatDateTime, formatIDR } from "@/lib/format";

/** Current month in WIB as YYYY-MM (the logbook the tutor is filling right now). */
const thisMonth = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit" }).format(new Date()).slice(0, 7);

export function TutorClassCard({ c }: { c: Schemas["TutorClass"] }) {
  const meta = classMeta(c.name, c.description);
  const filled = c.capacity > 0 ? Math.min(100, (c.activeStudents / c.capacity) * 100) : 0;

  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-sm">
      <Link
        href={`/tutor/classes/${c.id}`}
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
          {c.status === "archived" && <Badge className="bg-white text-foreground">Archived</Badge>}
        </div>
        <div className="relative mt-3 flex items-end justify-between gap-3">
          <p className="text-lg leading-snug font-semibold">{c.name}</p>
          <ChevronRight className="size-5 shrink-0 text-white/80" />
        </div>
      </Link>

      <div className="space-y-4 p-4">
        <div>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5">
              <Users className="size-4 text-muted-foreground" />
              <span className="font-medium">{c.activeStudents} active student(s)</span>
            </span>
            <span className="text-xs text-muted-foreground">
              {c.activeStudents} of {c.capacity} seats
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${c.activeStudents} of ${c.capacity} seats filled`}>
            <div className="h-full rounded-full bg-primary" style={{ width: `${filled}%` }} />
          </div>
        </div>

        <div className="grid gap-2 text-sm">
          <p className="flex items-center gap-2">
            <CalendarDays className="size-4 text-muted-foreground" />
            {c.nextLessonAt ? (
              <>
                Next lesson <span className="font-medium">{formatDateTime(c.nextLessonAt)}</span>
              </>
            ) : (
              <span className="text-muted-foreground">No upcoming lessons</span>
            )}
          </p>
          <p className="flex items-center gap-2">
            <Wallet className="size-4 text-muted-foreground" />
            You earn <span className="font-medium">{formatIDR(c.tutorRatePerHour)}</span> per lesson hour
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button asChild className="h-11 rounded-full">
            <Link href={`/tutor/classes/${c.id}`}>
              <CalendarPlus /> Schedule
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-full">
            <Link href={`/tutor/logbooks/${c.id}/${thisMonth()}`}>
              <BookOpenCheck /> Logbook
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
