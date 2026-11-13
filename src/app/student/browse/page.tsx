"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClassCard } from "@/components/student/class-card";
import { EmptyState, ErrorState, LoadingRows, Spinner } from "@/components/ui-kit";
import { api, unwrap, type Schemas } from "@/lib/api/client";
import { formatIDR } from "@/lib/format";
import { matchesQuery } from "@/lib/search";
import { useOnce } from "@/lib/use-once";

type CatalogueClass = Schemas["CatalogueClass"];

export default function BrowsePage() {
  const router = useRouter();
  const [enrolling, setEnrolling] = useState<CatalogueClass | null>(null);
  const [query, setQuery] = useState("");
  const catalogue = useQuery({ queryKey: ["catalogue"], queryFn: () => unwrap(api.GET("/student/classes/available")) });

  const all = useMemo(() => catalogue.data?.classes ?? [], [catalogue.data]);
  const results = useMemo(
    () => all.filter((c) => matchesQuery([c.name, c.description, c.tutorName], query)),
    [all, query],
  );

  const enroll = useMutation({
    mutationFn: (classId: string) => unwrap(api.POST("/student/enrollments", { body: { classId } })),
    onSuccess: (r) => {
      toast.success("You're enrolled — your seat is held", { description: `Invoice ${r.invoice.invoiceNo} is ready to pay.` });
      setEnrolling(null);
      router.push("/student/invoices");
    },
  });

  const enrollOnce = useOnce(enroll.mutate, enroll.isPending);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Browse classes</h1>
        <p className="text-sm text-muted-foreground">Small groups, one tutor. Pay per package of hours.</p>
      </div>

      {all.length > 0 && (
        <div className="space-y-1.5">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search subject, level, day or tutor"
              aria-label="Search classes"
              className="h-11 pr-10 pl-9 [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          {query && (
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {results.length} of {all.length} classes
            </p>
          )}
        </div>
      )}

      {catalogue.error ? (
        <ErrorState error={catalogue.error} onRetry={() => catalogue.refetch()} />
      ) : catalogue.isPending ? (
        <LoadingRows rows={3} />
      ) : catalogue.data.classes.length === 0 ? (
        <EmptyState title="No classes open right now" />
      ) : results.length === 0 ? (
        <div className="text-center">
          <EmptyState title={`No classes match “${query.trim()}”`} description="Try a subject (math, English), a level (SD, SMP, Grade 6) or a day." />
          <Button variant="outline" onClick={() => setQuery("")}>
            Show all classes
          </Button>
        </div>
      ) : (
        results.map((c) => <ClassCard key={c.id} cls={c} onEnroll={setEnrolling} />)
      )}

      <Dialog open={!!enrolling} onOpenChange={(o) => !o && setEnrolling(null)}>
        {enrolling && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enroll in {enrolling.name}?</DialogTitle>
              <DialogDescription>
                We&apos;ll hold your seat and create an invoice for a {enrolling.defaultPackageHours}-hour package (
                {formatIDR(enrolling.studentRatePerHour * enrolling.defaultPackageHours)}). The schedule and logbooks unlock
                once it&apos;s paid.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEnrolling(null)}>
                Cancel
              </Button>
              <Button onClick={() => enrollOnce(enrolling.id)} disabled={enroll.isPending}>
                {enroll.isPending && <Spinner />}
                Enroll & get invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
