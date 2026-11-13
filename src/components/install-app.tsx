"use client";

import { EllipsisVertical, Share, SquarePlus, Star, X } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { promptInstall, rememberDismissal, useInstallMode, wasDismissedRecently, type InstallMode } from "@/lib/install";

/** Runs the right install flow for this device: native prompt, or step-by-step instructions. */
export function useInstallAction() {
  const mode = useInstallMode();
  const [guide, setGuide] = useState<null | "ios" | "android-manual">(null);

  async function install() {
    if (mode === "prompt") {
      if (await promptInstall()) toast.success("Star Generation is on your home screen");
    } else if (mode === "ios" || mode === "android-manual") {
      setGuide(mode);
    }
  }

  const canInstall = mode === "prompt" || mode === "ios" || mode === "android-manual";
  const dialog = <InstallGuide mode={guide} onClose={() => setGuide(null)} />;
  return { mode, canInstall, install, dialog };
}

const noopSubscribe = () => () => {};

/** Dismissible card shown at the top of the home screens until installed or dismissed. */
export function InstallBanner() {
  const { canInstall, install, dialog } = useInstallAction();
  // Server snapshot = dismissed, so nothing flashes before the client reads localStorage.
  const dismissedEarlier = useSyncExternalStore(noopSubscribe, wasDismissedRecently, () => true);
  const [dismissedNow, setDismissedNow] = useState(false);

  if (!canInstall || dismissedEarlier || dismissedNow) return dialog;
  return (
    <>
      <div className="relative mb-5 flex items-center gap-3 rounded-card bg-primary p-3 pr-10 text-primary-foreground shadow-sm">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Star className="size-5 fill-current" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Install the app</p>
          <p className="text-xs text-primary-foreground/70">Add Star Generation to your home screen for one-tap access.</p>
        </div>
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={install}>
          Install
        </Button>
        <button
          onClick={() => {
            rememberDismissal();
            setDismissedNow(true);
          }}
          className="absolute top-2 right-2 rounded-full p-1 text-primary-foreground/60 hover:bg-white/10 hover:text-primary-foreground"
          aria-label="Not now"
        >
          <X className="size-4" />
        </button>
      </div>
      {dialog}
    </>
  );
}

function InstallGuide({ mode, onClose }: { mode: InstallMode | null; onClose: () => void }) {
  const ios = mode === "ios";
  const steps = ios
    ? [
        { icon: Share, text: (<>Tap the <b>Share</b> button in Safari&apos;s toolbar.</>) },
        { icon: SquarePlus, text: (<>Scroll down and choose <b>Add to Home Screen</b>.</>) },
        { icon: Star, text: (<>Tap <b>Add</b>. Star Generation now opens like an app.</>) },
      ]
    : [
        { icon: EllipsisVertical, text: (<>Open your browser&apos;s menu (<b>⋮</b>).</>) },
        { icon: SquarePlus, text: (<>Choose <b>Install app</b> or <b>Add to Home screen</b>.</>) },
        { icon: Star, text: (<>Confirm. Star Generation now opens like an app.</>) },
      ];

  return (
    <Dialog open={mode === "ios" || mode === "android-manual"} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to your home screen</DialogTitle>
          <DialogDescription>
            {ios
              ? "On iPhone and iPad, apps like this are installed from the Share menu."
              : "Your browser installs apps from its menu."}
          </DialogDescription>
        </DialogHeader>
        <ol className="space-y-3">
          {steps.map(({ icon: Icon, text }, i) => (
            <li key={i} className="flex items-center gap-3 text-sm">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                <Icon className="size-4" />
              </span>
              <span>
                <span className="mr-1 font-semibold">{i + 1}.</span>
                {text}
              </span>
            </li>
          ))}
        </ol>
        {ios && (
          <p className="text-xs text-muted-foreground">
            Using Chrome on iPhone? Tap Share in the address bar, then Add to Home Screen.
          </p>
        )}
        <Button onClick={onClose} className="w-full">
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );
}
