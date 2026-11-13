"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
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
import { EmptyState, ErrorState, LoadingRows, Spinner, StatusBadge } from "@/components/ui-kit";
import { api, unwrap, type Schemas } from "@/lib/api/client";
import { formatDate, formatIDR } from "@/lib/format";

type Invoice = Schemas["Invoice"];

export default function InvoicesPage() {
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

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Invoices</h1>
      {invoices.error ? (
        <ErrorState error={invoices.error} onRetry={() => invoices.refetch()} />
      ) : invoices.isPending ? (
        <LoadingRows rows={3} />
      ) : invoices.data.invoices.length === 0 ? (
        <EmptyState title="No invoices yet" description="When you enroll or buy a package, its invoice appears here." />
      ) : (
        invoices.data.invoices.map((inv) => (
          <Card key={inv.id} className={inv.status === "void" ? "opacity-60" : undefined}>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{inv.className}</p>
                  <p className="text-xs text-muted-foreground">
                    {inv.invoiceNo} · issued {formatDate(inv.createdAt)}
                  </p>
                </div>
                <StatusBadge status={inv.status} />
              </div>
              <div className="flex items-end justify-between">
                <div className="text-sm text-muted-foreground">
                  {inv.hours}h × {formatIDR(inv.ratePerHour)}
                  <p className={inv.isOverdue ? "text-destructive" : undefined}>
                    {inv.status === "paid"
                      ? `Paid ${formatDate(inv.paidAt)}`
                      : inv.status === "unpaid"
                        ? `${inv.isOverdue ? "Overdue since" : "Due"} ${formatDate(inv.dueAt)}`
                        : "Cancelled"}
                  </p>
                </div>
                <p className="text-xl font-semibold tabular-nums">{formatIDR(inv.amount)}</p>
              </div>
              {inv.status === "unpaid" && (
                <Button className="w-full" onClick={() => setPaying(inv)}>
                  Pay {formatIDR(inv.amount)}
                </Button>
              )}
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={!!paying} onOpenChange={(o) => !o && setPaying(null)}>
        {paying && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pay {formatIDR(paying.amount)}?</DialogTitle>
              <DialogDescription>
                This is a simulated payment for this demo — no money moves and no card is needed. In production this step
                would hand over to a payment gateway or bank transfer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPaying(null)}>
                Cancel
              </Button>
              <Button onClick={() => pay.mutate(paying.id)} disabled={pay.isPending}>
                {pay.isPending && <Spinner />}
                Simulate payment
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
