"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ClassCard } from "@/components/student/class-card";
import { useEnrollDialog } from "@/components/student/enroll-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState, LoadingRows, Spinner } from "@/components/ui-kit";
import { api, unwrap } from "@/lib/api/client";

const PAGE_SIZE = 10;

/** Waits until the user stops typing before searching on the server. */
function useDebounced<T>(value: T, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/**
 * Explore: server-side search + lazy loading. The next page loads when the
 * sentinel under the list scrolls into view (with a button as a fallback).
 */
export function ClassCatalogue() {
  const [query, setQuery] = useState("");
  const q = useDebounced(query.trim());
  const { startEnroll, dialog } = useEnrollDialog();

  const catalogue = useInfiniteQuery({
    queryKey: ["catalogue", q],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      unwrap(
        api.GET("/student/classes/available", {
          params: { query: { limit: PAGE_SIZE, offset: pageParam, ...(q ? { q } : {}) } },
        }),
      ),
    getNextPageParam: (last) => last.nextOffset ?? undefined,
    placeholderData: (prev) => prev, // keep showing results while a new search loads
  });

  const classes = catalogue.data?.pages.flatMap((p) => p.classes) ?? [];
  const total = catalogue.data?.pages[0]?.total ?? 0;
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = catalogue;

  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting) && !isFetchingNextPage) fetchNextPage();
    }, { rootMargin: "400px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <section aria-label="Class catalogue" className="space-y-4">
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
        {catalogue.data && (
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {q ? `${total} ${total === 1 ? "class matches" : "classes match"} “${q}”` : `${total} classes`}
            {catalogue.isFetching && !isFetchingNextPage && <Spinner className="ml-1 inline size-3" />}
          </p>
        )}
      </div>

      {catalogue.error && !catalogue.data ? (
        <ErrorState error={catalogue.error} onRetry={() => catalogue.refetch()} />
      ) : catalogue.isPending ? (
        <LoadingRows rows={3} />
      ) : classes.length === 0 ? (
        q ? (
          <div className="text-center">
            <EmptyState title={`No classes match “${q}”`} description="Try a subject (math, English), a level (SD, SMP, Grade 6) or a day." />
            <Button variant="outline" onClick={() => setQuery("")}>
              Show all classes
            </Button>
          </div>
        ) : (
          <EmptyState title="No classes open right now" />
        )
      ) : (
        <>
          {classes.map((c) => (
            <ClassCard key={c.id} cls={c} onEnroll={startEnroll} />
          ))}
          <div ref={sentinel} aria-hidden />
          {hasNextPage ? (
            <Button variant="outline" className="w-full" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? (
                <>
                  <Spinner /> Loading more…
                </>
              ) : (
                "Load more classes"
              )}
            </Button>
          ) : (
            classes.length > PAGE_SIZE && (
              <p className="py-2 text-center text-xs text-muted-foreground">You&apos;ve seen all {total} classes ✨</p>
            )
          )}
        </>
      )}
      {dialog}
    </section>
  );
}
