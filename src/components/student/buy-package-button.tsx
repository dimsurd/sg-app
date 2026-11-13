"use client";

import { useMutation } from "@tanstack/react-query";
import { PackagePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui-kit";
import { api, unwrap } from "@/lib/api/client";

/** "Buy package": issues a new package invoice on the student's existing enrollment (seat is kept). */
export function BuyPackageButton({
  enrollmentId,
  className,
  hours,
  variant = "default",
}: {
  enrollmentId: string;
  className: string;
  hours: number;
  variant?: "default" | "outline";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const buy = useMutation({
    mutationFn: () => unwrap(api.POST("/student/enrollments/{id}/packages", { params: { path: { id: enrollmentId } }, body: {} })),
    onSuccess: (r) => {
      toast.success(`Invoice ${r.invoice.invoiceNo} created`, { description: "Pay it to keep joining lessons." });
      setOpen(false);
      router.push("/student/invoices");
    },
  });

  return (
    <>
      <Button variant={variant} size="sm" onClick={() => setOpen(true)}>
        <PackagePlus /> Buy package
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buy another {hours}-hour package?</DialogTitle>
            <DialogDescription>
              You&apos;ll get an invoice for {className} at the class&apos;s current hourly rate. You keep your seat, and once
              it&apos;s paid you&apos;re added back to upcoming lessons.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Not now
            </Button>
            <Button onClick={() => buy.mutate()} disabled={buy.isPending}>
              {buy.isPending && <Spinner />}
              Create invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
