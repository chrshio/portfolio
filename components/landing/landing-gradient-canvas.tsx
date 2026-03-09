"use client";

import { useEffect, useRef } from "react";

const COLORS = {
  cyan: "#04DCFF",
  blue: "#475ACB",
  yellow: "#FFF991",
  warm: "#EADFD9",
} as const;

export function LandingGradientCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;
    let start = performance.now();

    const setSize = () => {
      if (!container || !canvas) return;
      const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      if (!container || !canvas || !ctx) return;
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const t = (performance.now() - start) * 0.0004;

      ctx.clearRect(0, 0, w, h);

      const cx = w * 0.5;
      const cy = h * 0.4;
      const drift = 0.12;
      const radiusScale = Math.max(w, h) * 0.6;

      // Blob 1: cyan–blue gradient (top, drifting)
      const x1 = cx + Math.sin(t) * w * drift;
      const y1 = cy - h * 0.1 + Math.cos(t * 0.7) * h * 0.08;
      const g1 = ctx.createRadialGradient(x1, y1, 0, x1, y1, radiusScale * 0.7);
      g1.addColorStop(0, COLORS.cyan);
      g1.addColorStop(0.5, COLORS.blue);
      g1.addColorStop(1, "rgba(71, 90, 203, 0)");
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      // Blob 2: yellow (mid, different phase)
      const x2 = cx + Math.cos(t * 1.1 + 1) * w * drift;
      const y2 = cy + h * 0.25 + Math.sin(t * 0.8) * h * 0.1;
      const g2 = ctx.createRadialGradient(x2, y2, 0, x2, y2, radiusScale * 0.8);
      g2.addColorStop(0, COLORS.yellow);
      g2.addColorStop(0.6, "rgba(255, 249, 145, 0.4)");
      g2.addColorStop(1, "rgba(255, 249, 145, 0)");
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      // Blob 3: warm gray (lower, slow drift)
      const x3 = cx + Math.sin(t * 0.6 + 2) * w * drift;
      const y3 = cy + h * 0.45 + Math.cos(t * 0.5) * h * 0.06;
      const g3 = ctx.createRadialGradient(x3, y3, 0, x3, y3, radiusScale * 0.75);
      g3.addColorStop(0, COLORS.warm);
      g3.addColorStop(0.5, "rgba(234, 223, 217, 0.5)");
      g3.addColorStop(1, "rgba(234, 223, 217, 0)");
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = g3;
      ctx.fillRect(0, 0, w, h);

      // Extra small blobs for more mixing
      const x4 = cx + Math.cos(t * 1.3) * w * 0.25;
      const y4 = cy + Math.sin(t * 0.9 + 0.5) * h * 0.2;
      const g4 = ctx.createRadialGradient(x4, y4, 0, x4, y4, radiusScale * 0.4);
      g4.addColorStop(0, COLORS.cyan);
      g4.addColorStop(1, "rgba(4, 220, 255, 0)");
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = g4;
      ctx.fillRect(0, 0, w, h);

      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(draw);
    };

    setSize();
    draw();

    const ro = new ResizeObserver(setSize);
    ro.observe(container);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 left-[10%] right-[10%] overflow-hidden"
      style={{ filter: "blur(32px)" }}
      aria-hidden
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ display: "block" }}
      />
    </div>
  );
}
