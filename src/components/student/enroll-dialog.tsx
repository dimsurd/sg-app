"use client";

import { useMutation } from "@tanstack/react-query";
import { CalendarDays, Clock, Hourglass, Info, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ActionSheet, FactRow } from "@/components/action-sheet";
import { api, unwrap, type Schemas } from "@/lib/api/client";
import { classMeta } from "@/lib/class-meta";
import { formatIDR } from "@/lib/format";
import { useOnce } from "@/lib/use-once";

type CatalogueClass = Schemas["CatalogueClass"];

/** Enroll confirmation (bottom sheet), shared by the Home carousel and Explore. */
export function useEnrollDialog() {
  const router = useRouter();
  const [enrolling, setEnrolling] = useState<CatalogueClass | null>(null);
  const enroll = useMutation({
    mutationFn: (classId: string) => unwrap(api.POST("/student/enrollments", { body: { classId } })),
    onSuccess: (r) => {
      toast.success("You're enrolled — your seat is held", { description: `Invoice ${r.invoice.invoiceNo} is ready to pay.` });
      setEnrolling(null);
      router.push("/student/invoices");
    },
  });
  const enrollOnce = useOnce(enroll.mutate, enroll.isPending);

  const c = enrolling;
  const meta = c ? classMeta(c.name, c.description) : null;
  const dialog = (
    <ActionSheet
      open={!!c}
      onOpenChange={(o) => !o && setEnrolling(null)}
      title={c ? `Enroll in ${c.name}?` : ""}
      description={c ? `with ${c.tutorName}` : undefined}
      confirmLabel="Enroll & get invoice"
      onConfirm={() => c && enrollOnce(c.id)}
      pending={enroll.isPending}
    >
      {c && meta && (
        <>
          <div className="divide-y rounded-xl border px-3">
            {meta.day && <FactRow icon={CalendarDays} label="Every" value={meta.day} />}
            {meta.time && <FactRow icon={Clock} label="Time" value={meta.time} />}
            <FactRow icon={Hourglass} label="Package" value={`${c.defaultPackageHours} hours`} />
            <FactRow icon={Wallet} label="Per hour" value={formatIDR(c.studentRatePerHour)} />
            <FactRow icon={Wallet} label="Total" value={formatIDR(c.studentRatePerHour * c.defaultPackageHours)} strong />
          </div>
          <p className="flex gap-2 rounded-xl bg-accent/15 p-3 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-warning" />
            Your seat is held right away. The schedule and tutor notes unlock once the invoice is paid.
          </p>
        </>
      )}
    </ActionSheet>
  );

  return { startEnroll: setEnrolling, dialog };
}
