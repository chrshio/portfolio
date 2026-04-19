"use client";

import { useRef } from "react";
import { IPadMock } from "@/components/pos/ipad-mock";
import { POSScreenRetail } from "@/components/pos-retail/pos-screen";
import { ScanLine } from "lucide-react";

export function RetailPageClient() {
  const addScannedItemRef = useRef<() => void>(() => {});

  return (
    <main className="relative h-full min-h-0 bg-[#1a1a1a]">
      <div className="flex h-full items-center justify-center">
        <IPadMock fillContainer>
          <POSScreenRetail
            onRegisterAddScannedItem={(fn) => {
              addScannedItemRef.current = fn;
            }}
          />
        </IPadMock>
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex justify-center pt-3 pb-4">
        <button
          type="button"
          onClick={() => addScannedItemRef.current()}
          className="flex items-center gap-2 rounded-full border border-white/20 bg-black/50 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition-colors active:bg-white/10"
        >
          <ScanLine className="h-4 w-4" />
          Simulate barcode scan
        </button>
      </div>
    </main>
  );
}
