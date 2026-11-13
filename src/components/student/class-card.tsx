"use client";

import { CalendarDays, Clock, GraduationCap, MonitorSmartphone, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui-kit";
import type { Schemas } from "@/lib/api/client";
import { classMeta, type Subject } from "@/lib/class-meta";
import { formatIDR } from "@/lib/format";

type CatalogueClass = Schemas["CatalogueClass"];

/** Dark, subject-tinted gradients: white text stays above 4.5:1 on every stop. */
const GRADIENT: Record<Subject, string> = {
  math: "from-[#2F3F5F] to-[#34588F]",
  science: "from-[#1F4B52] to-[#24685F]",
  english: "from-[#3A3366] to-[#5A3F7A]",
  other: "from-[#2F3F5F] to-[#3E4F72]",
};

export function ClassCard({ cls: c, onEnroll }: { cls: CatalogueClass; onEnroll: (c: CatalogueClass) => void }) {
  const meta = classMeta(c.name, c.description);
  const seatsLeft = Math.max(0, c.capacity - c.seatsTaken);
  const full = seatsLeft === 0;
  const almostFull = !full && seatsLeft <= Math.max(1, Math.floor(c.capacity / 3));
  const packagePrice = c.studentRatePerHour * c.defaultPackageHours;
  const filled = Math.min(100, (c.seatsTaken / c.capacity) * 100);

  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-sm">
      {/* Header: subject gradient, title and the main badges */}
      <div className={cn("relative overflow-hidden bg-gradient-to-br p-4 text-white", GRADIENT[meta.subject])}>
        <Image
          src="/brand/star-mark.png"
          alt=""
          width={112}
          height={125}
          aria-hidden
          className="pointer-events-none absolute -top-3 -right-4 opacity-15"
        />
        <div className="relative flex flex-wrap items-center gap-1.5">
          {meta.level && (
            <Badge className="bg-accent font-semibold text-accent-foreground">
              <GraduationCap /> {meta.level}
            </Badge>
          )}
          {meta.program && <Badge className="bg-white/15 text-white">{meta.program}</Badge>}
          {meta.subjectLabel && <Badge className="bg-white/15 text-white">{meta.subjectLabel}</Badge>}
          {c.myEnrollmentStatus && (
            <StatusBadge status={c.myEnrollmentStatus} className="ml-auto bg-white text-foreground" />
          )}
        </div>
        <h2 className="relative mt-3 text-lg leading-snug font-semibold">{c.name}</h2>
        <p className="relative mt-0.5 text-sm text-white/80">with {c.tutorName}</p>
      </div>

      {/* Body: schedule, seats, price, action */}
      <div className="space-y-4 p-4">
        {/* Catalogue descriptions are mostly the schedule, which the badges already show. */}
        {!meta.day && c.description && <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p>}
        {(meta.day || meta.time || meta.mode) && (
          <div className="flex flex-wrap gap-1.5">
            {meta.day && (
              <Badge variant="secondary">
                <CalendarDays /> {meta.day}
              </Badge>
            )}
            {meta.time && (
              <Badge variant="secondary">
                <Clock /> {meta.time}
              </Badge>
            )}
            {meta.mode && (
              <Badge variant="outline">
                <MonitorSmartphone /> {meta.mode}
              </Badge>
            )}
          </div>
        )}

        <div>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5">
              <Users className="size-4 text-muted-foreground" />
              <span className="font-medium">
                {c.seatsTaken} of {c.capacity} students
              </span>
            </span>
            {full ? (
              <Badge variant="destructive">Full</Badge>
            ) : (
              <Badge variant={almostFull ? "warning" : "success"}>
                {seatsLeft} {seatsLeft === 1 ? "seat" : "seats"} left
              </Badge>
            )}
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={`${c.seatsTaken} of ${c.capacity} seats taken`}
          >
            <div
              className={cn("h-full rounded-full", full ? "bg-destructive" : almostFull ? "bg-warning" : "bg-success")}
              style={{ width: `${filled}%` }}
            />
          </div>
        </div>

        <div className="flex items-end justify-between gap-3 rounded-lg bg-secondary/60 p-3">
          <div>
            <p className="text-xs text-muted-foreground">Price</p>
            <p className="text-lg leading-tight font-semibold tabular-nums">
              {formatIDR(c.studentRatePerHour)} <span className="text-sm font-normal text-muted-foreground">/ hour</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{c.defaultPackageHours}h package</p>
            <p className="font-semibold tabular-nums">{formatIDR(packagePrice)}</p>
          </div>
        </div>

        {c.myEnrollmentStatus === "active" ? (
          <Button asChild variant="outline" className="h-10 w-full">
            <Link href={`/student/classes/${c.id}`}>Open class</Link>
          </Button>
        ) : c.myEnrollmentStatus === "pending_payment" ? (
          <Button asChild className="h-10 w-full">
            <Link href="/student/invoices">Pay to unlock</Link>
          </Button>
        ) : (
          <Button className="h-10 w-full" disabled={full} onClick={() => onEnroll(c)}>
            {full ? "Class is full" : "Enroll"}
          </Button>
        )}
      </div>
    </Card>
  );
}
