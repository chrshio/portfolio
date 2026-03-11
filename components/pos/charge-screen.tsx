"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface ChargeScreenProps {
  total: number;
  onClose?: () => void;
}

export function ChargeScreen({ total, onClose }: ChargeScreenProps) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div
      className={`relative flex flex-1 items-center justify-center bg-white min-h-0 transition-transform duration-300 ease-out ${
        entered ? "translate-y-0" : "translate-y-full"
      }`}
    >
      {onClose && (
        <div className="absolute top-0 right-0 flex shrink-0 p-4">
          <button
            type="button"
            onClick={onClose}
            className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-full bg-[#f0f0f0] active:bg-[#e5e5e5]"
            aria-label="Close"
          >
            <X className="h-6 w-6 text-[#101010]" />
          </button>
        </div>
      )}
      <div className="flex flex-col items-center gap-2">
        <p className="text-[48px] font-semibold text-[#101010] leading-[110%]">
          Charge ${total.toFixed(2)}
        </p>
        <p className="text-[16px] font-normal text-[#666666]">
          Tap or insert card
        </p>
      </div>
    </div>
  );
}
