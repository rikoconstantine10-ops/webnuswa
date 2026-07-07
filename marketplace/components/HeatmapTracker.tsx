"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { isTrackedPath } from "@/lib/heatmap";

type ClickPoint = { xPct: number; yPct: number };

export default function HeatmapTracker() {
  const pathname = usePathname();
  const clicksRef = useRef<ClickPoint[]>([]);
  const maxScrollPctRef = useRef(0);
  const sentScrollRef = useRef(0);

  useEffect(() => {
    if (!pathname || !isTrackedPath(pathname)) return;

    clicksRef.current = [];
    maxScrollPctRef.current = 0;
    sentScrollRef.current = 0;

    const device = window.innerWidth < 768 ? "mobile" : "desktop";

    function onClick(e: MouseEvent) {
      const doc = document.documentElement;
      const docWidth = Math.max(doc.scrollWidth, doc.clientWidth, 1);
      const docHeight = Math.max(doc.scrollHeight, doc.clientHeight, 1);
      const xPct = Math.min(100, Math.max(0, (e.clientX / docWidth) * 100));
      const yPct = Math.min(100, Math.max(0, ((window.scrollY + e.clientY) / docHeight) * 100));
      clicksRef.current.push({ xPct, yPct });
      if (clicksRef.current.length >= 200) flush(false);
    }

    let scrollScheduled = false;
    function onScroll() {
      if (scrollScheduled) return;
      scrollScheduled = true;
      requestAnimationFrame(() => {
        scrollScheduled = false;
        const doc = document.documentElement;
        const docHeight = Math.max(doc.scrollHeight, doc.clientHeight, 1);
        const pct = Math.min(100, Math.max(0, ((window.scrollY + window.innerHeight) / docHeight) * 100));
        if (pct > maxScrollPctRef.current) maxScrollPctRef.current = pct;
      });
    }

    function flush(useBeacon: boolean) {
      const clicks = clicksRef.current;
      const scrollDepthPct = Math.round(maxScrollPctRef.current);
      const hasNewScroll = scrollDepthPct > sentScrollRef.current;
      if (clicks.length === 0 && !hasNewScroll) return;

      const payload = JSON.stringify({
        path: pathname,
        device,
        clicks,
        scrollDepthPct: hasNewScroll ? scrollDepthPct : undefined,
      });
      clicksRef.current = [];
      if (hasNewScroll) sentScrollRef.current = scrollDepthPct;

      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon("/api/analytics/heatmap-ingest", new Blob([payload], { type: "application/json" }));
      } else {
        fetch("/api/analytics/heatmap-ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    }

    const interval = setInterval(() => flush(false), 5000);
    function onHide() {
      if (document.visibilityState === "hidden") flush(true);
    }

    document.addEventListener("click", onClick);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", () => flush(true));

    return () => {
      flush(true);
      clearInterval(interval);
      document.removeEventListener("click", onClick);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [pathname]);

  return null;
}
