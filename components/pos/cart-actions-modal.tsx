"use client";

import {
  XCircle,
  FileCheck,
  FileX,
  CreditCard,
  Files,
  UtensilsCrossed,
  FilePlus,
  Tag,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ActionRow {
  id: string;
  label: string;
  icon: React.ElementType;
  destructive?: boolean;
  onClick?: () => void;
}

interface CartActionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClearCart?: () => void;
  /** When provided, clicking "Fulfillment" calls this then closes the actions modal (e.g. open fulfillment method modal). */
  onFulfillmentClick?: () => void;
  /** Retail POS: only "Add discount", "Add service charge", and "Clear cart". */
  variant?: "default" | "retail";
  onAddDiscount?: () => void;
  onAddServiceCharge?: () => void;
}

export function CartActionsModal({
  open,
  onOpenChange,
  onClearCart,
  onFulfillmentClick,
  variant = "default",
  onAddDiscount,
  onAddServiceCharge,
}: CartActionsModalProps) {
  const actions: ActionRow[] =
    variant === "retail"
      ? [
          { id: "add-discount", label: "Add discount", icon: Tag, onClick: onAddDiscount },
          {
            id: "add-service-charge",
            label: "Add service charge",
            icon: FilePlus,
            onClick: onAddServiceCharge,
          },
          {
            id: "clear-cart",
            label: "Clear cart",
            icon: XCircle,
            destructive: true,
            onClick: onClearCart,
          },
        ]
      : [
          {
            id: "clear-cart",
            label: "Clear cart",
            icon: XCircle,
            destructive: true,
            onClick: onClearCart,
          },
          { id: "comp-check", label: "Comp check", icon: FileCheck },
          { id: "void-check", label: "Void check", icon: FileX },
          { id: "pre-authorize", label: "Pre-authorize", icon: CreditCard },
          { id: "split-check", label: "Split check", icon: Files },
          {
            id: "fulfillment",
            label: "Fulfillment",
            icon: UtensilsCrossed,
            onClick: onFulfillmentClick,
          },
          { id: "service-charge", label: "Service charge", icon: FilePlus },
        ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="top-[68px] translate-y-0 w-[664px] max-w-[min(664px,calc(100vw-2rem))] max-h-[calc(100vh-48px)] flex flex-col overflow-hidden rounded-[24px] border-[#e5e5e5] bg-white p-0 shadow-xl"
        showCloseButton={false}
      >
        <div className="px-8 pt-6 pb-0 flex flex-col gap-6">
          <DialogClose
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f0f0f0] text-[#101010] active:bg-[#e5e5e5]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </DialogClose>

          <DialogTitle className="text-[25px] font-semibold leading-8 text-[#101010]">
            Actions
          </DialogTitle>
        </div>

        <div className="px-8 pb-8">
          {actions.map((action, index) => {
            const Icon = action.icon;
            const isFirst = index === 0;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => {
                  action.onClick?.();
                  onOpenChange(false);
                }}
                className={cn(
                  "flex w-full items-center gap-4 py-4 text-left transition-colors active:bg-[#f5f5f5]",
                  !isFirst && "border-t border-[#f0f0f0]"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px]",
                    action.destructive ? "bg-[#fef2f2]" : "bg-[#f0f0f0]"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      action.destructive ? "text-[#bf0020]" : "text-[#101010]"
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-[16px] font-medium leading-6",
                    action.destructive ? "text-[#bf0020]" : "text-[#101010]"
                  )}
                >
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
