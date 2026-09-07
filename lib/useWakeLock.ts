"use client";

import { useEffect } from "react";

/**
 * Hold a screen wake lock while `active`. Without it the phone dims and sleeps
 * mid-session, and iOS suspends the timer — and the audio cues with it — as
 * soon as it does. Unsupported browsers and a refused lock are both no-ops.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    async function acquire() {
      try {
        const held = await navigator.wakeLock.request("screen");
        if (cancelled) {
          void held.release();
          return;
        }
        sentinel = held;
        // The system drops the lock on its own terms; forget it so a later
        // visibilitychange knows to ask again.
        held.addEventListener("release", () => {
          if (sentinel === held) sentinel = null;
        });
      } catch {
        // Refused (low power mode, no user activation) — the session still runs.
      }
    }

    // Backgrounding the app always releases the lock; take it back on return.
    function onVisibilityChange() {
      if (document.visibilityState === "visible" && !sentinel) void acquire();
    }

    void acquire();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      void sentinel?.release();
      sentinel = null;
    };
  }, [active]);
}
