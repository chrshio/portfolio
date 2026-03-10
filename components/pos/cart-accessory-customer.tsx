"use client";

import { Star } from "lucide-react";
import type { Customer } from "@/lib/pos-types";

/**
 * Customer accessory for the cart — retail variant only.
 * Shows "Add customer" when none set; shows customer name + loyalty stars when attached.
 */
export function CartAccessoryCustomer({
  customer,
  onAddCustomer,
}: {
  customer?: Customer | null;
  onAddCustomer?: () => void;
}) {
  if (customer) {
    return (
      <div className="flex w-full items-center gap-4 rounded-xl border border-[#e5e5e5] bg-white px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-[16px] leading-6 text-[#101010]">
            {customer.name}
          </p>
        </div>
        {customer.stars != null && customer.stars > 0 && (
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-[#e5f0ff] px-2 py-0.5">
            <Star className="h-4 w-4 text-[#005ad9]" />
            <span className="text-[12px] font-medium leading-[18px] text-[#005ad9]">
              {customer.stars} stars
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onAddCustomer}
      className="flex w-full items-center gap-4 rounded-xl border border-[#e5e5e5] bg-white px-4 py-4 text-left active:bg-[#fafafa]"
    >
      <span className="font-medium text-[16px] leading-6 text-[#101010]">
        Add customer
      </span>
    </button>
  );
}
