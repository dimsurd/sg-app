"use client";

import { useQuery } from "@tanstack/react-query";
import { Compass } from "lucide-react";
import Link from "next/link";
import { ClassCard } from "@/components/student/class-card";
import { useEnrollDialog } from "@/components/student/enroll-dialog";
import { ErrorState, LoadingRows } from "@/components/ui-kit";
import { api, unwrap } from "@/lib/api/client";

const FEATURED = 3;

/** A few classes in a horizontal, swipeable row, then a way into Explore. */
export function FeaturedClasses() {
  const { startEnroll, dialog } = useEnrollDialog();
  const featured = useQuery({
    queryKey: ["catalogue", "featured"],
    queryFn: () => unwrap(api.GET("/student/classes/available", { params: { query: { limit: FEATURED } } })),
  });

  if (featured.error) return <ErrorState error={featured.error} onRetry={() => featured.refetch()} />;
  if (featured.isPending) return <LoadingRows rows={2} />;
  const { classes, total } = featured.data;

  return (
    <>
      {/* Bleeds to the screen edge so the next card peeks in, hinting you can swipe. */}
      <ul
        aria-label="Featured classes"
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {classes.map((c) => (
          <li key={c.id} className="w-[85%] max-w-sm shrink-0 snap-start">
            <ClassCard cls={c} onEnroll={startEnroll} className="h-full" />
          </li>
        ))}
        <li className="w-[60%] max-w-[16rem] shrink-0 snap-start">
          <Link
            href="/student/explore"
            className="flex h-full min-h-48 flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed border-accent bg-accent/10 p-4 text-center transition-colors hover:bg-accent/20"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Compass className="size-6" />
            </span>
            <span className="font-semibold">See all {total} classes</span>
            <span className="text-xs text-muted-foreground">Search by subject, level, day or tutor</span>
          </Link>
        </li>
      </ul>
      {dialog}
    </>
  );
}
