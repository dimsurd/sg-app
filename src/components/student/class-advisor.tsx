"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowUp, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "cn";
import { ClassCard } from "@/components/student/class-card";
import { useEnrollDialog } from "@/components/student/enroll-dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { api, unwrap, type Schemas } from "@/lib/api/client";

type CatalogueClass = Schemas["CatalogueClass"];
type Turn =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; classes: CatalogueClass[]; suggestions: string[] };

const STARTERS = [
  "Grade 8, olympiad math",
  "Help with school English",
  "Something on Friday evening",
  "What fits grade 6?",
];
const MAX_TURNS = 20;
export const ADVISOR_STORAGE_PREFIX = "sg-advisor:";

/** Chat survives closing the sheet and moving between Home and Explore (this tab only). */
function useStoredChat(userId: string | undefined) {
  const key = userId ? ADVISOR_STORAGE_PREFIX + userId : null;
  const [turns, setTurns] = useState<Turn[]>([]);
  const loaded = useRef<string | null>(null);

  useEffect(() => {
    if (!key || loaded.current === key) return;
    loaded.current = key;
    try {
      const raw = sessionStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from storage
      if (raw) setTurns(JSON.parse(raw) as Turn[]);
    } catch {
      /* storage unavailable: start fresh */
    }
  }, [key]);

  useEffect(() => {
    if (!key || loaded.current !== key) return;
    try {
      sessionStorage.setItem(key, JSON.stringify(turns));
    } catch {
      /* ignore */
    }
  }, [key, turns]);

  return [turns, setTurns] as const;
}

/**
 * Floating "Ask AI" button above the bottom nav + the advisor chat in a tall bottom sheet.
 * Shrinks to an icon while scrolling down so it doesn't cover cards.
 * Renders nothing when the API has no LLM configured.
 */
export function ClassAdvisor() {
  const status = useQuery({
    queryKey: ["assistant-status"],
    queryFn: () => unwrap(api.GET("/student/assistant")),
    staleTime: 5 * 60_000,
  });
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY) > 8) setCollapsed(y > lastY && y > 80);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!status.data?.enabled) return null;

  return (
    <>
      {/* Room at the end of the page so the button never hides the last card. */}
      <div aria-hidden className="h-14" />
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(max(1rem,env(safe-area-inset-bottom))+4.75rem)] z-30 px-4">
        <div className="mx-auto flex max-w-md justify-end">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Ask AI class advisor"
            className={cn(
              "pointer-events-auto relative flex h-13 items-center gap-2 overflow-hidden rounded-full bg-gradient-to-br from-[#2F3F5F] via-[#3E5A8A] to-[#2F3F5F] font-semibold text-white shadow-xl shadow-primary/30 ring-2 ring-accent/70 transition-all duration-300 outline-none focus-visible:ring-4 focus-visible:ring-ring/60 active:scale-95",
              collapsed ? "w-13 justify-center px-0" : "px-4",
            )}
          >
            {/* soft shimmer so it reads as "AI" at a glance */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -translate-x-full animate-[advisor-shimmer_3.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />
            <Sparkles className="relative size-5 shrink-0 text-accent" />
            {!collapsed && <span className="relative text-sm whitespace-nowrap">Ask AI</span>}
          </button>
        </div>
      </div>
      <AdvisorSheet open={open} onOpenChange={setOpen} />
    </>
  );
}

function AdvisorSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const me = useQuery({ queryKey: ["me"], queryFn: () => unwrap(api.GET("/auth/me")) });
  const firstName = me.data?.user.fullName.split(" ")[0];
  const [turns, setTurns] = useStoredChat(me.data?.user.id);
  const [draft, setDraft] = useState("");
  const { startEnroll, dialog } = useEnrollDialog();
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const ask = useMutation({
    meta: { silent: true, readOnly: true }, // errors are shown in the chat; nothing to refetch
    mutationFn: (history: Turn[]) =>
      unwrap(
        api.POST("/student/assistant", {
          body: {
            messages: history.map((t) =>
              t.role === "user"
                ? { role: "user" as const, content: t.content }
                : { role: "assistant" as const, content: t.content, classIds: t.classes.map((c) => c.id) },
            ),
          },
        }),
      ),
    onSuccess: (r) =>
      setTurns((prev) => [
        ...prev,
        { role: "assistant", content: r.reply, classes: r.classes, suggestions: r.suggestions },
      ]),
  });

  const full = turns.length >= MAX_TURNS - 1;
  function send(text: string) {
    const content = text.trim().slice(0, 1000);
    if (!content || ask.isPending || full) return;
    const next: Turn[] = [...turns, { role: "user", content }];
    setTurns(next);
    setDraft("");
    ask.mutate(next);
  }
  function retry() {
    if (turns.at(-1)?.role === "user") ask.mutate(turns);
  }
  function reset() {
    ask.reset();
    setTurns([]);
    inputRef.current?.focus();
  }

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [open, turns.length, ask.isPending, ask.isError]);

  const last = turns.at(-1);
  const chips = turns.length === 0 ? STARTERS : last?.role === "assistant" ? last.suggestions : [];

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="mx-auto max-w-2xl data-[side=bottom]:h-[92dvh] gap-0 rounded-t-3xl pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          <span aria-hidden className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-muted" />
          {/* Header */}
          <div className="flex items-center gap-3 border-b px-4 pt-2 pb-3 pr-14">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-accent">
              <Sparkles className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <SheetTitle className="flex items-center gap-1.5 text-base leading-tight">
                Class advisor
                <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-accent-foreground">AI</span>
              </SheetTitle>
              <SheetDescription className="text-xs">AI suggestions from our live classes. Check the details before you enroll.</SheetDescription>
            </div>
            {turns.length > 0 && (
              <Button variant="ghost" size="sm" className="shrink-0 rounded-full" onClick={reset}>
                <RotateCcw /> New chat
              </Button>
            )}
          </div>

          {/* Conversation */}
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite">
            <Bubble from="assistant">
              Hi{firstName ? ` ${firstName}` : ""}! 👋 I&apos;ll help you find a class that fits. What grade are you in,
              what would you like to learn, and which days work for you?
            </Bubble>

            {turns.map((t, i) =>
              t.role === "user" ? (
                <Bubble key={i} from="user">
                  {t.content}
                </Bubble>
              ) : (
                <div key={i} className="space-y-3">
                  <Bubble from="assistant">{t.content}</Bubble>
                  {t.classes.length > 0 && (
                    <ul
                      aria-label="Suggested classes"
                      className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                      {t.classes.map((c) => (
                        <li
                          key={c.id}
                          className={cn("shrink-0 snap-start", t.classes.length === 1 ? "w-full max-w-sm" : "w-[85%] max-w-sm")}
                        >
                          <ClassCard cls={c} onEnroll={startEnroll} className="h-full" />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ),
            )}

            {ask.isPending && (
              <Bubble from="assistant">
                <span className="flex gap-1 py-1" aria-label="Thinking">
                  {[0, 150, 300].map((d) => (
                    <span
                      key={d}
                      className="size-2 animate-bounce rounded-full bg-muted-foreground/60"
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                </span>
              </Bubble>
            )}
            {ask.isError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
                <p className="text-destructive">{ask.error.message}</p>
                <Button variant="outline" size="sm" className="mt-2 rounded-full" onClick={retry}>
                  Try again
                </Button>
              </div>
            )}
            {full && (
              <p className="text-center text-sm text-muted-foreground">
                This chat is full. Tap <span className="font-medium">New chat</span> to keep going.
              </p>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick replies + composer */}
          <div className="space-y-2 border-t px-4 pt-3">
            {chips.length > 0 && !ask.isPending && !full && (
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
                {chips.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="shrink-0 rounded-full border border-primary/25 bg-background px-3.5 py-2 text-sm font-medium text-primary transition-colors outline-none hover:bg-primary/5 focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <form
              className="flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                send(draft);
              }}
            >
              <label htmlFor="advisor-input" className="sr-only">
                Message the class advisor
              </label>
              <textarea
                id="advisor-input"
                ref={inputRef}
                rows={1}
                value={draft}
                maxLength={1000}
                disabled={full}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    send(draft);
                  }
                }}
                placeholder="e.g. Grade 9, physics, weekday evenings"
                className="field-sizing-content max-h-32 min-h-11 flex-1 resize-none rounded-3xl border border-input bg-background px-4 py-2.5 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
              />
              <Button
                type="submit"
                size="icon"
                className="size-11 shrink-0 rounded-full"
                disabled={!draft.trim() || ask.isPending || full}
                aria-label="Send"
              >
                <ArrowUp className="size-5" />
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
      {dialog}
    </>
  );
}

function Bubble({ from, children }: { from: "user" | "assistant"; children: React.ReactNode }) {
  return (
    <div className={cn("flex", from === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
          from === "user" ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-secondary text-foreground",
        )}
      >
        {children}
      </div>
    </div>
  );
}
