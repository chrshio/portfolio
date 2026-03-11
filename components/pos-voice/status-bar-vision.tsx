"use client";

import { useState, useEffect } from "react";
import { Signal, Wifi, Battery } from "lucide-react";

/** Single-line system status bar for the Vision prototype. */
export function StatusBarVision() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-between px-4 py-1.5 bg-[#080808] text-[#ffffff]">
      <span className="font-medium text-xs" suppressHydrationWarning>
        {time || "12:00 PM"}
      </span>
      <div className="flex items-center gap-1.5">
        <Signal className="w-4 h-4" />
        <Wifi className="w-4 h-4" />
        <span className="text-xs font-medium">100%</span>
        <Battery className="w-5 h-5 fill-[#ffffff]" />
      </div>
    </div>
  );
}
