"use client";

import { cn } from "@/lib/utils";
import type { CartItem } from "@/lib/pos-types";

interface CartItemsProps {
  items: CartItem[];
  editingItemId?: string | null;
  onItemClick?: (id: string) => void;
}

function CartItemRow({
  item,
  isEditing,
  isFaded,
  onClick,
}: {
  item: CartItem;
  isEditing: boolean;
  isFaded: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border-2 pt-[12px] pb-[12px] px-4 transition-all",
        isEditing ? "border-[#101010]" : "border-transparent",
        isFaded ? "opacity-40" : "opacity-100",
        onClick && "cursor-pointer"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-base text-[#101010] font-medium">{item.name}</p>
          {item.modifiers && item.modifiers.length > 0 && (
            <div className="space-y-0">
              {item.modifiers.map((modifier, index) => (
                <p key={index} className="text-sm text-[#888888]">
                  {modifier}
                </p>
              ))}
            </div>
          )}
        </div>
        <p
          className={cn("text-base text-[#101010]", item.quantity === 1 ? "font-normal" : "font-medium")}
        >
          ${(item.price * item.quantity).toFixed(2)}
        </p>
      </div>
    </div>
  );
}

export function CartItems({ items, editingItemId, onItemClick }: CartItemsProps) {
  const hasEditingItem = editingItemId != null;

  return (
    <div className="rounded-2xl border border-[#e5e5e5] bg-[#ffffff] p-0">
      {items.length === 0 ? (
        <div className="flex items-center justify-center h-20 text-[#959595]">
          No items in cart
        </div>
      ) : (
        <div className="flex flex-col gap-0">
          {items.map((item) => {
            const isEditing = editingItemId === item.id;
            const isFaded = hasEditingItem && !isEditing;
            return (
              <CartItemRow
                key={item.id}
                item={item}
                isEditing={isEditing}
                isFaded={isFaded}
                onClick={onItemClick ? () => onItemClick(item.id) : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
