"use client";

import { useMutation } from "@tanstack/react-query";
import { Hourglass, Info, PackagePlus, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ActionSheet, FactRow } from "@/components/action-sheet";
import { api, unwrap } from "@/lib/api/client";
import { useOnce } from "@/lib/use-once";

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

  const buyOnce = useOnce(buy.mutate, buy.isPending);

  return (
    <>
      <Button variant={variant} size="sm" onClick={() => setOpen(true)}>
        <PackagePlus /> Buy package
      </Button>
      <ActionSheet
        open={open}
        onOpenChange={setOpen}
        title={`Buy another ${hours}-hour package?`}
        description={className}
        confirmLabel="Create invoice"
        onConfirm={() => buyOnce()}
        pending={buy.isPending}
      >
        <div className="divide-y rounded-xl border px-3">
          <FactRow icon={Hourglass} label="Package" value={`${hours} hours`} />
          <FactRow icon={Wallet} label="Price" value="Current class rate" />
        </div>
        <p className="flex gap-2 rounded-xl bg-accent/15 p-3 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-warning" />
          You keep your seat. Once it&apos;s paid you&apos;re added back to upcoming lessons.
        </p>
      </ActionSheet>
    </>
  );
}
