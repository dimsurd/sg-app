"use client";

import { EllipsisVertical, Share, SquarePlus, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { promptInstall, useInstallMode, type InstallMode } from "@/lib/install";

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
