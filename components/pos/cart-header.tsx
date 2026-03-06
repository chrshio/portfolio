"use client";

import { MoreHorizontal } from "lucide-react";

interface CartHeaderProps {
  itemCount: number;
}

export function CartHeader({ itemCount }: CartHeaderProps) {
  return (
    <div className="flex items-center justify-between py-4">
      <h2 className="text-[19px] font-semibold text-[#101010]">
        {itemCount} {itemCount === 1 ? "item" : "items"}
      </h2>
      <button className="w-14 h-14 flex flex-col justify-center items-center p-4 rounded-full bg-[#f0f0f0] transition-colors">
        <MoreHorizontal className="w-5 h-5 text-[#101010]" />
      </button>
    </div>
  );
}
