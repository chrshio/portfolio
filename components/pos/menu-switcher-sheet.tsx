"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { MenuId } from "@/lib/pos-types";

function RadioButton({ selected }: { selected: boolean }) {
  return (
    <div className="shrink-0 w-5 h-5 flex items-center justify-center">
      {selected ? (
        <div className="w-5 h-5 rounded-full border-[6px] border-[#101010]" />
      ) : (
        <div className="w-5 h-5 rounded-full border-2 border-[#959595]" />
      )}
    </div>
  );
}

const MENU_OPTIONS: { id: MenuId; label: string }[] = [
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
];

interface MenuSwitcherSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMenuId: MenuId;
  onSelect: (menuId: MenuId) => void;
}

export function MenuSwitcherSheet({
  open,
  onOpenChange,
  selectedMenuId,
  onSelect,
}: MenuSwitcherSheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="top-auto bottom-4 left-1/2 translate-x-[-50%] translate-y-0 w-[464px] max-w-[min(464px,calc(100%-2rem))] flex flex-col items-center gap-0 border-0 p-0 shadow-xl bg-transparent"
        showCloseButton={false}
      >
        {/* Handle — outside sheet, above (Figma: sheet grabber) */}
        <div className="flex flex-col items-center justify-center pb-2 shrink-0">
          <div className="w-14 h-1.5 rounded-full bg-black/20" />
        </div>

        {/* Sheet content (Figma: white container, rounded-[20px], 24px padding) */}
        <div className="flex flex-col gap-6 px-6 pb-6 pt-6 w-full rounded-[20px] bg-white shadow-xl">
          <DialogTitle className="text-[25px] font-semibold leading-8 text-[#101010]">
            Menus
          </DialogTitle>

          <div className="flex flex-col">
            {MENU_OPTIONS.map((option, index) => {
              const isSelected = selectedMenuId === option.id;
              const isLast = index === MENU_OPTIONS.length - 1;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onSelect(option.id)}
                  className={cn(
                    "flex items-center justify-between gap-4 py-4 w-full text-left",
                    !isLast && "border-b border-[#f0f0f0]"
                  )}
                >
                  <span className="font-medium text-[16px] leading-6 text-[#101010]">
                    {option.label}
                  </span>
                  <RadioButton selected={isSelected} />
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
