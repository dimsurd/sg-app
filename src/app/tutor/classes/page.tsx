"use client";

import { useQuery } from "@tanstack/react-query";
import { TutorClassCard } from "@/components/tutor/tutor-class-card";
import { EmptyState, ErrorState, LoadingRows } from "@/components/ui-kit";
import { api, unwrap } from "@/lib/api/client";

export default function TutorClassesPage() {
  const classes = useQuery({ queryKey: ["tutor-classes"], queryFn: () => unwrap(api.GET("/tutor/classes")) });
  const total = classes.data?.classes.reduce((s, c) => s + c.activeStudents, 0) ?? 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">My classes</h1>
        <p className="text-sm text-muted-foreground">
          {classes.data
            ? `${classes.data.classes.length} class${classes.data.classes.length === 1 ? "" : "es"} · ${total} active student${total === 1 ? "" : "s"}`
            : "Your classes, students and next lessons."}
        </p>
      </div>
      {classes.error ? (
        <ErrorState error={classes.error} onRetry={() => classes.refetch()} />
      ) : classes.isPending ? (
        <LoadingRows rows={3} />
      ) : classes.data.classes.length === 0 ? (
        <EmptyState title="No classes assigned yet" description="An admin assigns classes to you." />
      ) : (
        <ul className="space-y-3">
          {classes.data.classes.map((c) => (
            <li key={c.id}>
              <TutorClassCard c={c} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
