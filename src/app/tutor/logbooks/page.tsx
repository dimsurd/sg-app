"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ChevronRight, Clock, Hourglass, MessageSquareWarning, PenLine, Send } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingRows } from "@/components/ui-kit";
import { api, unwrap, type Schemas } from "@/lib/api/client";
import { SUBJECT_GRADIENT, classMeta } from "@/lib/class-meta";
import { TZ, formatMonth } from "@/lib/format";

type Row = Schemas["TutorLogbookListItem"];
type Filter = "all" | "todo" | "review" | "approved";

const FILTERS: { value: Filter; label: string; match: (r: Row) => boolean }[] = [
  { value: "all", label: "All", match: () => true },
  { value: "todo", label: "To do", match: (r) => ["not_started", "draft", "changes_requested"].includes(r.status) },
  { value: "review", label: "In review", match: (r) => r.status === "submitted" },
  { value: "approved", label: "Approved", match: (r) => r.status === "approved" },
];

const STATUS: Record<Row["status"], { label: string; badge: "outline" | "warning" | "destructive" | "secondary" | "success"; stripe: string }> = {
  not_started: { label: "Not started", badge: "outline", stripe: "bg-muted-foreground/40" },
  draft: { label: "In progress", badge: "warning", stripe: "bg-accent" },
  changes_requested: { label: "Needs changes", badge: "destructive", stripe: "bg-destructive" },
  submitted: { label: "In review", badge: "secondary", stripe: "bg-primary" },
  approved: { label: "Approved", badge: "success", stripe: "bg-success" },
};

/** The one thing to do next for this month, in plain words. */
function nextStep(r: Row): { icon: React.ComponentType<{ className?: string }>; text: string; tone: string } {
  const toWrite = r.endedCount - r.entryCount;
  const upcoming = r.lessonCount - r.endedCount;
  if (r.status === "approved") return { icon: CheckCircle2, text: "Approved · read-only", tone: "text-success" };
  if (r.status === "submitted") return { icon: Hourglass, text: "Waiting for admin review", tone: "text-foreground/75" };
  if (r.status === "changes_requested") return { icon: MessageSquareWarning, text: "Fix & resubmit", tone: "text-destructive" };
  if (toWrite > 0) return { icon: PenLine, text: `${toWrite} ${toWrite === 1 ? "entry" : "entries"} to write`, tone: "text-warning" };
  if (upcoming > 0) return { icon: Clock, text: `${upcoming} lesson${upcoming === 1 ? "" : "s"} still to come`, tone: "text-foreground/75" };
  return { icon: Send, text: "Ready to submit", tone: "text-primary font-semibold" };
}

const thisMonth = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit" }).format(new Date()).slice(0, 7);

export default function TutorLogbooksPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const logbooks = useQuery({ queryKey: ["tutor-logbooks"], queryFn: () => unwrap(api.GET("/tutor/logbooks")) });

  const rows = useMemo(() => logbooks.data?.logbooks ?? [], [logbooks.data]);
  const shown = rows.filter(FILTERS.find((f) => f.value === filter)!.match);
  const byMonth = useMemo(() => {
    const groups = new Map<string, Row[]>();
    for (const r of shown) groups.set(r.month, [...(groups.get(r.month) ?? []), r]);
    return [...groups.entries()].sort(([a], [b]) => b.localeCompare(a)); // newest month first
  }, [shown]);
  const current = thisMonth();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Logbooks</h1>
        <p className="text-sm text-muted-foreground">One per class per month. Log each lesson, then submit the month.</p>
      </div>

      {rows.length > 0 && (
        <div role="group" aria-label="Filter logbooks" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {FILTERS.map((f) => {
            const active = filter === f.value;
            const count = rows.filter(f.match).length;
            return (
              <button
                key={f.value}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground/80 hover:bg-muted",
                )}
              >
                {f.label}
                <span
                  className={cn(
                    "min-w-5 rounded-full px-1.5 text-center text-xs tabular-nums",
                    active ? "bg-accent text-accent-foreground" : "bg-muted text-foreground/80",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {logbooks.error ? (
        <ErrorState error={logbooks.error} onRetry={() => logbooks.refetch()} />
      ) : logbooks.isPending ? (
        <LoadingRows rows={3} />
      ) : rows.length === 0 ? (
        <EmptyState title="No lessons yet" description="Logbooks appear here once you schedule lessons." />
      ) : shown.length === 0 ? (
        <EmptyState title={filter === "todo" ? "Nothing to do ✨" : "Nothing here"} />
      ) : (
        byMonth.map(([month, items]) => (
          <section key={month} aria-label={formatMonth(month)} className="space-y-2.5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              {formatMonth(month)}
              {month === current && <Badge className="bg-accent text-accent-foreground">This month</Badge>}
            </h2>
            <ul className="space-y-2.5">
              {items.map((r) => (
                <li key={`${r.classId}-${r.month}`}>
                  <LogbookCard r={r} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function LogbookCard({ r }: { r: Row }) {
  const status = STATUS[r.status];
  const step = nextStep(r);
  const meta = classMeta(r.className);
  const pct = r.lessonCount ? Math.round((r.entryCount / r.lessonCount) * 100) : 0;

  return (
    <Link href={`/tutor/logbooks/${r.classId}/${r.month}`} className="block rounded-card">
      <Card className="relative gap-0 overflow-hidden py-0 pl-1.5 shadow-sm transition-colors hover:bg-muted/30">
        <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1.5", status.stripe)} />
        <div className="space-y-3 p-4">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-xs font-semibold text-white",
                SUBJECT_GRADIENT[meta.subject],
              )}
            >
              {meta.level?.replace("Grade ", "G") ?? meta.subjectLabel?.slice(0, 3) ?? "SG"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="leading-snug font-semibold">{r.className}</p>
              <p className="text-xs text-muted-foreground">
                {r.lessonCount} lesson{r.lessonCount === 1 ? "" : "s"} in {formatMonth(r.month).split(" ")[0]}
              </p>
            </div>
            <Badge variant={status.badge}>{status.label}</Badge>
          </div>

          <div>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-muted-foreground">
                {r.entryCount} of {r.lessonCount} logged
              </span>
              <span className="font-medium tabular-nums">{pct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full rounded-full", r.status === "approved" ? "bg-success" : "bg-primary")} style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className={cn("flex items-center gap-1.5 text-sm", step.tone)}>
              <step.icon className="size-4" /> {step.text}
            </span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </div>
        </div>
      </Card>
    </Link>
  );
}
