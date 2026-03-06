"use client";

interface PricingSummaryProps {
  subtotal: number;
  tax: number;
  total: number;
}

export function PricingSummary({ subtotal, tax, total }: PricingSummaryProps) {
  return (
    <div className="bg-[#ffffff] border border-[#e5e5e5] rounded-2xl py-3 px-4">
      <div className="space-y-4">
        <div className="flex justify-between text-[#101010]">
          <span className="font-medium text-base">Subtotal</span>
          <span className="text-base">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[#101010]">
          <span className="font-medium text-base">Tax</span>
          <span className="text-base">${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[#101010]">
          <span className="font-medium text-base">Total</span>
          <span className="text-base">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
