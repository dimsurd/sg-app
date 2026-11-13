"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui-kit";

/**
 * Mobile confirmation: slides up from the bottom, big thumb-friendly buttons,
 * facts as short rows instead of a paragraph. Used for money actions in the app.
 */
export function ActionSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel,
  onConfirm,
  pending,
  cancelLabel = "Not now",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  pending?: boolean;
  cancelLabel?: string;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[90dvh] max-w-2xl gap-0 overflow-y-auto rounded-t-3xl pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      >
        <span aria-hidden className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-muted" />
        <SheetHeader className="pt-3 pr-12">
          <SheetTitle className="text-xl leading-snug">{title}</SheetTitle>
          {description && <SheetDescription className="text-sm">{description}</SheetDescription>}
        </SheetHeader>
        {children && <div className="space-y-3 px-4">{children}</div>}
        <div className="mt-5 grid gap-2 px-4">
          <Button className="h-12 rounded-full text-base" onClick={onConfirm} disabled={pending}>
            {pending && <Spinner />}
            {confirmLabel}
          </Button>
          <Button variant="ghost" className="h-12 rounded-full text-base" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** A label/value row inside an ActionSheet. */
export function FactRow({
  icon: Icon,
  label,
  value,
  strong,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground/80">
        <Icon className="size-4" />
      </span>
      <span className="flex-1 text-sm text-muted-foreground">{label}</span>
      <span className={strong ? "text-lg font-semibold tabular-nums" : "text-sm font-medium tabular-nums"}>{value}</span>
    </div>
  );
}
