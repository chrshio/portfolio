"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const PAPER_OPTIONS = [
  { value: "58mm wide", label: "58mm" },
  { value: "80mm wide", label: "80mm" },
];

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

interface PaperSizeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paperSize: string;
  onSelect: (paperSize: string) => void;
}

export function PaperSizeSheet({
  open,
  onOpenChange,
  paperSize,
  onSelect,
}: PaperSizeSheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="top-auto bottom-4 left-1/2 translate-x-[-50%] translate-y-0 w-[464px] max-w-[min(464px,calc(100%-2rem))] flex flex-col items-center gap-0 border-0 p-0 shadow-xl bg-transparent z-[100] data-[state=open]:opacity-100 data-[state=open]:zoom-in-100"
        showCloseButton={false}
      >
        {/* Handle — sheet grabber */}
        <div className="flex flex-col items-center justify-center pb-2 shrink-0">
          <div className="w-14 h-1.5 rounded-full bg-black/20" />
        </div>

        {/* Sheet content */}
        <div className="flex flex-col gap-4 px-6 pb-6 pt-6 w-full rounded-[12px] bg-white shadow-xl">
          <DialogTitle className="text-[25px] font-semibold leading-8 text-[#101010]">
            Paper size
          </DialogTitle>

          <div className="flex flex-col">
            {PAPER_OPTIONS.map((option, index) => {
              const isSelected = paperSize === option.value;
              const isLast = index === PAPER_OPTIONS.length - 1;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onSelect(option.value);
                    onOpenChange(false);
                  }}
                  className={cn(
                    "flex items-center justify-between gap-4 py-4 w-full text-left",
                    !isLast && "border-b border-black/5"
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
