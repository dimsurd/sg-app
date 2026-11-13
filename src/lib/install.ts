"use client";

import { useSyncExternalStore } from "react";

/**
 * "Add to home screen" support.
 *  - Chromium (Android, desktop Chrome/Edge) fires `beforeinstallprompt`; we keep the
 *    event and replay it from our own button.
 *  - iOS has no install API: the only way is Share → Add to Home Screen, so we explain it.
 * The event can fire before React mounts, so it is captured at module load.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallMode = "prompt" | "ios" | "android-manual" | "installed" | "unsupported";

let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // we show our own button instead of the mini-infobar
    deferred = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    installed = true;
    emit();
  });
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac; touch support gives it away.
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

function getMode(): InstallMode {
  if (installed || isStandalone()) return "installed";
  if (deferred) return "prompt";
  if (isIOS()) return "ios";
  if (/Android/i.test(navigator.userAgent)) return "android-manual"; // e.g. Firefox, or prompt not offered yet
  return "unsupported";
}

export function useInstallMode(): InstallMode {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getMode,
    () => "unsupported",
  );
}

/** Opens the native install dialog (Chromium only). Resolves true if the user accepted. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const event = deferred;
  deferred = null; // a prompt event can only be used once
  emit();
  await event.prompt();
  const { outcome } = await event.userChoice;
  return outcome === "accepted";
}

// --- "Not now" remembered per device for two weeks (best-effort; storage may be unavailable).
const DISMISS_KEY = "sg-install-dismissed-at";
const DISMISS_MS = 14 * 24 * 60 * 60 * 1000;

export function wasDismissedRecently(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return Number.isFinite(at) && Date.now() - at < DISMISS_MS;
  } catch {
    return false;
  }
}

export function rememberDismissal() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // private mode etc. — the card just shows again next time
  }
}
