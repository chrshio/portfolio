"use client";

import { CartHeader } from "./cart-header";
import { CartItems } from "./cart-items";
import { PricingSummary } from "./pricing-summary";
import { CartFooter } from "./cart-footer";
import type { CartItem } from "@/lib/pos-types";

interface CartSectionProps {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  onSave: () => void;
  onPay: () => void;
  editingItemId?: string | null;
  onItemClick?: (id: string) => void;
  onEditCancel?: () => void;
  onEditDone?: () => void;
}

export function CartSection({
  items,
  subtotal,
  tax,
  total,
  onSave,
  onPay,
  editingItemId,
  onItemClick,
  onEditCancel,
  onEditDone,
}: CartSectionProps) {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const isEditMode = editingItemId != null;

  return (
    <div className="flex flex-col h-full bg-white pr-6">
      <CartHeader itemCount={itemCount} />

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4">
          <CartItems
            items={items}
            editingItemId={editingItemId}
            onItemClick={onItemClick}
          />
          <PricingSummary subtotal={subtotal} tax={tax} total={total} />
        </div>
      </div>

      <div className="mt-auto">
        <CartFooter
          onSave={onSave}
          onPay={onPay}
          disabled={items.length === 0}
          isEditMode={isEditMode}
          onCancel={onEditCancel}
          onDone={onEditDone}
        />
      </div>
    </div>
  );
}
