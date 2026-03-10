"use client";

import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface CartHeaderProps {
  itemCount: number;
  /** When set (e.g. FSR), show this label instead of item count */
  orderLabel?: string;
  /** Secondary line under the label (e.g. "4 covers") */
  subtitle?: string;
  disabled?: boolean;
  onMoreClick?: () => void;
}

export function CartHeader({ itemCount, orderLabel, subtitle, disabled, onMoreClick }: CartHeaderProps) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex flex-col justify-center">
        <h2 className="text-[19px] font-semibold text-[#101010] leading-7">
          {orderLabel ?? (itemCount === 0
            ? "No items"
            : `${itemCount} ${itemCount === 1 ? "item" : "items"}`)}
        </h2>
        {subtitle && (
          <p className="text-[16px] text-[#666] leading-5">{subtitle}</p>
        )}
      </div>
      <button
        disabled={disabled}
        onClick={onMoreClick}
        className={cn(
          "w-14 h-14 flex flex-col justify-center items-center p-4 rounded-full bg-[#f0f0f0] transition-colors",
          disabled && "opacity-40 cursor-default",
          !disabled && "active:bg-[#e5e5e5]"
        )}
      >
        <MoreHorizontal className="w-5 h-5 text-[#101010]" />
      </button>
    </div>
  );
}
