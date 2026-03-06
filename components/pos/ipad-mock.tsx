"use client";

import type { ReactNode } from "react";

interface IPadMockProps {
  children: ReactNode;
}

export function IPadMock({ children }: IPadMockProps) {
  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-[#1a1a1a] p-4 sm:p-6 md:p-8">
      {/* iPad device frame - scales responsively */}
      <div
        className="relative w-full max-w-[1100px] aspect-[4/3]"
        style={{
          maxHeight: "calc(100vh - 64px)",
        }}
      >
        {/* iPad outer bezel */}
        <div className="absolute inset-0 bg-[#080808] text-[#0a0a0a] rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl">
          {/* iPad inner bezel with camera — radius = outer radius − inset so corners meet flush */}
          <div className="absolute inset-[6px] sm:inset-[10px] md:inset-[12px] bg-[#101010] rounded-[calc(2rem-6px)] sm:rounded-[calc(2.5rem-10px)] md:rounded-[calc(2.5rem-12px)] overflow-hidden">
            {/* Camera notch area */}
            <div className="absolute left-1/2 -translate-x-1/2 top-[6px] w-2 h-2 rounded-full bg-[#1a1a1a] z-10" />
            
            {/* Screen content area — radius 1px smaller so dark bezel overlaps and hides corner sliver */}
            <div className="w-full h-full bg-[#080808] rounded-[calc(2rem-7px)] sm:rounded-[calc(2.5rem-11px)] md:rounded-[calc(2.5rem-13px)] overflow-hidden">
              {children}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
