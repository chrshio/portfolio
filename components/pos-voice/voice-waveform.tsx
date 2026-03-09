"use client";

import { useRef, useEffect } from "react";

interface VoiceWaveformProps {
  isActive: boolean;
  analyserNode?: AnalyserNode | null;
}

const COLS = 48;
const MAX_DOT_ROWS = 7;
const DOT_RADIUS = 2.5;
const COL_GAP = 4.5;
const ROW_GAP = 3.5;

export function VoiceWaveform({ isActive, analyserNode }: VoiceWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const heights = useRef(new Float32Array(COLS));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;

    function render() {
      if (!running || !canvas || !ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const hArr = heights.current;
      const t = Date.now() / 1000;

      if (analyserNode) {
        const data = new Uint8Array(analyserNode.frequencyBinCount);
        analyserNode.getByteFrequencyData(data);
        const step = Math.max(1, Math.floor(data.length / COLS));
        for (let i = 0; i < COLS; i++) {
          const target = (data[i * step] / 255) * MAX_DOT_ROWS;
          hArr[i] += (target - hArr[i]) * 0.25;
        }
      } else if (isActive) {
        for (let i = 0; i < COLS; i++) {
          const center = COLS / 2;
          const dist = Math.abs(i - center) / center;
          const envelope = Math.max(0, 1 - dist * 1.25);
          const w1 = Math.sin(t * 2.5 + i * 0.35) * 0.3;
          const w2 = Math.sin(t * 4.2 + i * 0.6) * 0.2;
          const w3 = Math.sin(t * 1.4 + i * 0.18) * 0.15;
          const target =
            Math.max(0.08, envelope + (w1 + w2 + w3) * envelope) *
            MAX_DOT_ROWS;
          hArr[i] += (target - hArr[i]) * 0.1;
        }
      } else {
        for (let i = 0; i < COLS; i++) {
          hArr[i] *= 0.88;
          if (hArr[i] < 0.05) hArr[i] = 0;
        }
      }

      const colW = DOT_RADIUS * 2 + COL_GAP;
      const totalW = COLS * colW - COL_GAP;
      const startX = (w - totalW) / 2;
      const centerY = h / 2;

      for (let col = 0; col < COLS; col++) {
        const numDots = Math.max(0, Math.round(hArr[col]));
        if (numDots === 0) continue;

        const x = startX + col * colW + DOT_RADIUS;

        for (let row = 0; row < numDots; row++) {
          const offset =
            (row - (numDots - 1) / 2) * (DOT_RADIUS * 2 + ROW_GAP);
          const y = centerY + offset;

          ctx.beginPath();
          ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
          ctx.fillStyle = "#1a1a1a";
          ctx.fill();
        }
      }

      frameRef.current = requestAnimationFrame(render);
    }

    frameRef.current = requestAnimationFrame(render);
    return () => {
      running = false;
      cancelAnimationFrame(frameRef.current);
    };
  }, [isActive, analyserNode]);

  return <canvas ref={canvasRef} className="w-full h-16" />;
}
