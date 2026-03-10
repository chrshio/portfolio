"use client";

import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { RETAIL_ORDER_FULFILLMENTS } from "@/lib/pos-types";
import { cn } from "@/lib/utils";

interface FulfillmentMethodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedId: string;
  onSelect: (fulfillmentId: string) => void;
}

export function FulfillmentMethodModal({
  open,
  onOpenChange,
  selectedId,
  onSelect,
}: FulfillmentMethodModalProps) {
  const handleSelect = (id: string) => {
    onSelect(id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex w-[664px] max-w-[min(664px,calc(100vw-2rem))] sm:max-w-[min(664px,calc(100vw-2rem))] flex-col gap-6 rounded-xl border-0 px-8 py-6 shadow-xl"
        showCloseButton={false}
      >
        {/* Header: close button then title below (per Figma) */}
        <div className="flex shrink-0 flex-col gap-6">
          <div className="flex shrink-0 w-[56px]">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f0f0f0] active:bg-[#e5e5e5]"
              aria-label="Close"
            >
              <X className="h-6 w-6 text-[#101010]" />
            </button>
          </div>
          <DialogTitle className="text-left font-semibold text-[25px] leading-8 text-[#101010]">
            Fulfillment method
          </DialogTitle>
        </div>

        <div className="flex flex-col">
          {RETAIL_ORDER_FULFILLMENTS.map((fulfillment, index) => {
            const isSelected = selectedId === fulfillment.id;
            const isLast = index === RETAIL_ORDER_FULFILLMENTS.length - 1;
            return (
              <button
                key={fulfillment.id}
                type="button"
                onClick={() => handleSelect(fulfillment.id)}
                className={cn(
                  "flex w-full items-center justify-between py-4 text-left transition-colors active:bg-[#f5f5f5]",
                  !isLast && "border-b border-[#f0f0f0]"
                )}
              >
                <span className="text-[16px] font-medium leading-6 text-[#101010]">
                  {fulfillment.label}
                </span>
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                    isSelected ? "border-[#101010]" : "border-[#959595]"
                  )}
                  aria-hidden
                >
                  {isSelected && (
                    <span className="h-2 w-2 rounded-full bg-[#101010]" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
