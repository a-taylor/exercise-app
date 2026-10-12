"use client";

import { useEffect } from "react";

/**
 * Force a full repaint once a rotation (or any resize) settles. iOS home-screen
 * apps sometimes keep stale tiles from the old orientation, so the screen shows
 * two copies of the buttons until something — a scroll, or a few seconds —
 * makes WebKit redraw everything. The session timer makes it worse: it repaints
 * its own small region every second while the rest stays stale.
 */
export function useRepaintOnResize(): void {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let frame = 0;

    function repaint() {
      const root = document.documentElement;
      window.scrollTo(0, 0);
      root.classList.add("repaint");
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => root.classList.remove("repaint"));
      });
    }

    function onResize() {
      clearTimeout(timer);
      timer = setTimeout(repaint, 150);
    }

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      document.documentElement.classList.remove("repaint");
    };
  }, []);
}
