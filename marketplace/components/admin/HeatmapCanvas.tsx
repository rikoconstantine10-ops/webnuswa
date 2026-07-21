"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

// heatmap.js (pa7/heatmap.js, MIT) via CDN — dipilih karena ringan, tanpa dependency,
// dan tidak butuh instalasi npm baru.
const HEATMAPJS_SRC = "https://cdn.jsdelivr.net/npm/heatmap.js@2.0.5/build/heatmap.min.js";

declare global {
  interface Window {
    h337?: {
      create: (config: {
        container: HTMLElement;
        radius?: number;
        maxOpacity?: number;
        minOpacity?: number;
        blur?: number;
      }) => {
        setData: (data: { max: number; data: { x: number; y: number; value: number }[] }) => void;
      };
    };
  }
}

type Point = { xPct: number; yPct: number };

export default function HeatmapCanvas({ path, points, width }: { path: string; points: Point[]; width: number }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  function handleIframeLoad() {
    try {
      const h = iframeRef.current?.contentDocument?.documentElement.scrollHeight;
      setContentHeight(h && h > 100 ? h : 1600);
    } catch {
      setContentHeight(1600);
    }
  }

  useEffect(() => {
    if (!scriptReady || !contentHeight || !overlayRef.current || !window.h337) return;
    overlayRef.current.innerHTML = "";
    const heat = window.h337.create({
      container: overlayRef.current,
      radius: 30,
      maxOpacity: 0.65,
      minOpacity: 0,
      blur: 0.85,
    });
    const data = points.map((p) => ({
      x: Math.round((p.xPct / 100) * width),
      y: Math.round((p.yPct / 100) * contentHeight),
      value: 1,
    }));
    heat.setData({ max: Math.max(3, Math.ceil(data.length / 25)), data });
  }, [scriptReady, contentHeight, points, width]);

  const height = contentHeight ?? 1600;

  return (
    <div className="border border-slate-200 rounded-xl overflow-auto max-h-[75vh]">
      <Script src={HEATMAPJS_SRC} strategy="afterInteractive" onLoad={() => setScriptReady(true)} />
      <div className="relative" style={{ width, height }}>
        <iframe
          key={path}
          ref={iframeRef}
          src={path}
          onLoad={handleIframeLoad}
          title={`Pratinjau ${path}`}
          style={{ width, height, border: 0, pointerEvents: "none" }}
        />
        <div ref={overlayRef} className="absolute inset-0" style={{ width, height }} />
      </div>
      {!contentHeight && <p className="text-xs text-slate-400 p-3">Memuat pratinjau halaman...</p>}
    </div>
  );
}
