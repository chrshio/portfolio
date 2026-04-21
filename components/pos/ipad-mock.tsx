"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { DialogContainerProvider } from "@/components/ui/dialog-container-context";

interface IPadMockProps {
  children: ReactNode;
  /** When true, fit within parent instead of min-h-screen (e.g. when content below iPad must stay visible). */
  fillContainer?: boolean;
  /**
   * Pin the device frame to the bottom of the mock and drop bottom padding so the bezel bottom
   * lines up with a sibling (e.g. buyer-facing display) when using flex `items-end`.
   */
  pinDeviceBottom?: boolean;
}

export function IPadMock({ children, fillContainer = false, pinDeviceBottom = false }: IPadMockProps) {
  const screenRef = React.useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = React.useState<{ x: number; y: number } | null>(null);

  React.useEffect(() => {
    const style = document.createElement("style");
    style.id = "ipad-mock-cursor";
    style.textContent = "*, *::before, *::after { cursor: none !important; }";
    document.head.appendChild(style);

    const handleMove = (e: MouseEvent) => setCursor({ x: e.clientX, y: e.clientY });
    const handleLeave = () => setCursor(null);

    window.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseleave", handleLeave);

    return () => {
      document.getElementById("ipad-mock-cursor")?.remove();
      window.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  const cursorEl = cursor && (
    <div
      className="pointer-events-none fixed left-0 top-0 z-[99999] size-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/55 bg-[rgba(80,80,80,0.35)] shadow-[0_0_0_1px_rgba(255,255,255,0.2)]"
      style={{ left: cursor.x, top: cursor.y }}
      aria-hidden
    />
  );

  return (
    <DialogContainerProvider
      value={{ containerRef: screenRef, contained: true }}
    >
      {typeof document !== "undefined" && createPortal(cursorEl ?? null, document.body)}
      <div
        className={[
          "relative flex w-full justify-center bg-[#1a1a1a]",
          pinDeviceBottom
            ? "items-end px-4 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 md:px-8 md:pt-8 md:pb-0"
            : "items-center p-4 sm:p-6 md:p-8",
          fillContainer ? "min-h-0 h-full" : "min-h-screen",
        ].join(" ")}
      >
        {/* iPad device frame - scales responsively */}
        <div
          className="relative w-full max-w-[1100px] aspect-[4/3]"
          data-prototype-device-bounds
          style={{ maxHeight: "calc(100vh - 64px)" }}
        >
          {/* iPad outer bezel */}
          <div className="absolute inset-0 bg-[#080808] text-[#0a0a0a] rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl">
            {/* iPad inner bezel — radius = outer radius − inset so corners meet flush */}
            <div className="absolute inset-[6px] sm:inset-[10px] md:inset-[12px] bg-[#101010] rounded-[calc(2rem-6px)] sm:rounded-[calc(2.5rem-10px)] md:rounded-[calc(2.5rem-12px)] overflow-hidden">
              {/* Screen content area — relative so dialogs portal here and position relative to iPad */}
              <div
                ref={screenRef}
                className="relative w-full h-full bg-[#080808] rounded-[calc(2rem-7px)] sm:rounded-[calc(2.5rem-11px)] md:rounded-[calc(2.5rem-13px)] overflow-hidden"
              >
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DialogContainerProvider>
  );
}
