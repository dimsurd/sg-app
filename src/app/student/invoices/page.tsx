"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Ban, CalendarClock, CheckCircle2, GraduationCap, Hourglass, Info, ReceiptText, Sparkles, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ActionSheet, FactRow } from "@/components/action-sheet";
import { EmptyState, ErrorState, LoadingRows, StatusBadge } from "@/components/ui-kit";
import { api, unwrap, type Schemas } from "@/lib/api/client";
import { SUBJECT_GRADIENT, classMeta } from "@/lib/class-meta";
import { formatDate, formatIDR } from "@/lib/format";
import { useOnce } from "@/lib/use-once";

type Invoice = Schemas["Invoice"];
type Filter = "all" | "unpaid" | "paid" | "void";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unpaid", label: "Unpaid" },
  { value: "paid", label: "Paid" },
  { value: "void", label: "Void" },
];

const DAY = 86_400_000;

export default function InvoicesPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [paying, setPaying] = useState<Invoice | null>(null);
  const invoices = useQuery({ queryKey: ["my-invoices"], queryFn: () => unwrap(api.GET("/student/invoices")) });

  const pay = useMutation({
    mutationFn: (id: string) => unwrap(api.POST("/student/invoices/{id}/pay", { params: { path: { id } } })),
    onSuccess: (r) => {
      toast.success("Payment received — thank you!", {
        description: r.lessonsJoined ? `You've been added to ${r.lessonsJoined} upcoming lesson(s).` : undefined,
      });
      setPaying(null);
    },
  });
  const payOnce = useOnce(pay.mutate, pay.isPending);

  const all = useMemo(() => invoices.data?.invoices ?? [], [invoices.data]);
  const counts = useMemo(
    () => ({
      all: all.length,
      unpaid: all.filter((i) => i.status === "unpaid").length,
      paid: all.filter((i) => i.status === "paid").length,
      void: all.filter((i) => i.status === "void").length,
    }),
    [all],
  );
  const shown = filter === "all" ? all : all.filter((i) => i.status === filter);
  const outstanding = all.filter((i) => i.status === "unpaid").reduce((s, i) => s + i.amount, 0);
  const now = invoices.dataUpdatedAt; // "now" = when the data was fetched (keeps render pure)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <p className="text-sm text-muted-foreground">One invoice for every package of hours you buy.</p>
      </div>

      {invoices.data && all.length > 0 && (
        <section
          aria-label="Outstanding"
          className={cn(
            "flex items-center gap-3 rounded-card p-4",
            outstanding > 0 ? "bg-gradient-to-br from-[#2F3F5F] to-[#3E5A8A] text-white" : "border border-success/30 bg-success/5",
          )}
        >
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full",
              outstanding > 0 ? "bg-accent text-accent-foreground" : "bg-success/10 text-success",
            )}
          >
            {outstanding > 0 ? <ReceiptText className="size-5" /> : <Sparkles className="size-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className={cn("text-xs", outstanding > 0 ? "text-white/80" : "text-muted-foreground")}>
              {outstanding > 0 ? `${counts.unpaid} unpaid ${counts.unpaid === 1 ? "invoice" : "invoices"}` : "Nothing to pay"}
            </p>
            <p className="text-xl font-semibold tabular-nums">{outstanding > 0 ? formatIDR(outstanding) : "All paid ✨"}</p>
          </div>
        </section>
      )}

      {invoices.data && all.length > 0 && (
        <div role="group" aria-label="Filter invoices" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground/80 hover:bg-muted",
                )}
              >
                {f.label}
                <span
                  className={cn(
                    "min-w-5 rounded-full px-1.5 text-center text-xs tabular-nums",
                    active ? "bg-accent text-accent-foreground" : "bg-muted text-foreground/80",
                  )}
                >
                  {counts[f.value]}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {invoices.error ? (
        <ErrorState error={invoices.error} onRetry={() => invoices.refetch()} />
      ) : invoices.isPending ? (
        <LoadingRows rows={3} />
      ) : all.length === 0 ? (
        <EmptyState title="No invoices yet" description="When you enroll or buy a package, its invoice appears here." />
      ) : shown.length === 0 ? (
        <EmptyState
          title={`No ${filter} invoices`}
          description={filter === "unpaid" ? "You're all paid up ✨" : undefined}
        />
      ) : (
        <ul className="space-y-3">
          {shown.map((inv) => (
            <li key={inv.id}>
              <InvoiceCard inv={inv} now={now} onPay={() => setPaying(inv)} />
            </li>
          ))}
        </ul>
      )}

      <ActionSheet
        open={!!paying}
        onOpenChange={(o) => !o && setPaying(null)}
        title={paying ? `Pay ${formatIDR(paying.amount)}?` : ""}
        description={paying ? `${paying.className} · ${paying.invoiceNo}` : undefined}
        confirmLabel="Simulate payment"
        onConfirm={() => paying && payOnce(paying.id)}
        pending={pay.isPending}
      >
        {paying && (
          <>
            <div className="divide-y rounded-xl border px-3">
              <FactRow icon={Hourglass} label="Package" value={`${paying.hours} hours`} />
              <FactRow icon={Wallet} label="Per hour" value={formatIDR(paying.ratePerHour)} />
              <FactRow icon={Wallet} label="Total" value={formatIDR(paying.amount)} strong />
            </div>
            <p className="flex gap-2 rounded-xl bg-accent/15 p-3 text-sm">
              <Info className="mt-0.5 size-4 shrink-0 text-warning" />
              Demo payment: no money moves and no card is needed. In production this hands over to a payment gateway or
              bank transfer.
            </p>
          </>
        )}
      </ActionSheet>
    </div>
  );
}

function InvoiceCard({ inv, now, onPay }: { inv: Invoice; now: number; onPay: () => void }) {
  const meta = classMeta(inv.className);
  const overdue = inv.status === "unpaid" && inv.isOverdue;
  const daysToDue = Math.ceil((new Date(inv.dueAt).getTime() - now) / DAY);
  const daysOverdue = Math.max(1, Math.floor((now - new Date(inv.dueAt).getTime()) / DAY));
  const stripe =
    inv.status === "paid" ? "bg-success" : inv.status === "void" ? "bg-muted-foreground/40" : overdue ? "bg-destructive" : "bg-accent";

  return (
    <Card className={cn("relative gap-0 overflow-hidden py-0 pl-1.5 shadow-sm", inv.status === "void" && "opacity-75")}>
      <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1.5", stripe)} />
      <div className="space-y-4 p-4">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white",
              SUBJECT_GRADIENT[meta.subject],
            )}
          >
            <GraduationCap className="size-5 text-accent" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="leading-snug font-semibold">{inv.className}</p>
            <p className="text-xs text-muted-foreground">
              {inv.invoiceNo} · issued {formatDate(inv.createdAt)}
            </p>
          </div>
          {overdue ? <Badge variant="destructive">Overdue</Badge> : <StatusBadge status={inv.status} />}
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Package</p>
            <p className="text-sm font-medium tabular-nums">
              {inv.hours}h × {formatIDR(inv.ratePerHour)}
            </p>
          </div>
          <p className={cn("text-2xl font-semibold tabular-nums", inv.status === "void" && "line-through decoration-1")}>
            {formatIDR(inv.amount)}
          </p>
        </div>

        <div
          className={cn(
            "flex items-center gap-2 rounded-lg p-3 text-sm",
            inv.status === "paid" ? "bg-success/10" : overdue ? "bg-destructive/10" : "bg-secondary/60",
          )}
        >
          {inv.status === "paid" ? (
            <>
              <CheckCircle2 className="size-4 shrink-0 text-success" />
              <span className="min-w-0 flex-1">
                Paid {formatDate(inv.paidAt)}
                {inv.paymentReference && (
                  <span className="block truncate text-xs text-muted-foreground">Ref {inv.paymentReference}</span>
                )}
              </span>
            </>
          ) : inv.status === "void" ? (
            <>
              <Ban className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                Cancelled
                {inv.voidReason && <span className="block truncate text-xs text-muted-foreground">{inv.voidReason}</span>}
              </span>
            </>
          ) : (
            <>
              <CalendarClock className={cn("size-4 shrink-0", overdue ? "text-destructive" : "text-muted-foreground")} />
              <span className={cn("flex-1", overdue && "font-medium text-destructive")}>
                {overdue ? `Overdue by ${daysOverdue} day${daysOverdue === 1 ? "" : "s"}` : `Due ${formatDate(inv.dueAt)}`}
              </span>
              {!overdue && (
                <span className="text-xs text-muted-foreground">
                  {daysToDue <= 0 ? "today" : `in ${daysToDue} day${daysToDue === 1 ? "" : "s"}`}
                </span>
              )}
            </>
          )}
        </div>

        {inv.status === "unpaid" && (
          <Button className="h-11 w-full rounded-full" onClick={onPay}>
            Pay {formatIDR(inv.amount)}
          </Button>
        )}
      </div>
    </Card>
  );
}
