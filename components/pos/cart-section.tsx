"use client";

import { useState } from "react";
import { CartHeader } from "./cart-header";
import { CartItems } from "./cart-items";
import { PricingSummary } from "./pricing-summary";
import { CartFooter } from "./cart-footer";
import { CartActionsModal } from "./cart-actions-modal";
import type { CartItem, MenuItem, ComboDefinition } from "@/lib/pos-types";

interface CartSectionProps {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  onSave: () => void;
  onPay: () => void;
  editingItemId?: string | null;
  activeComboSlotId?: string | null;
  onItemClick?: (id: string) => void;
  onRequirementClick?: (itemId: string, groupId: string) => void;
  onEditCancel?: () => void;
  onEditDone?: () => void;
  isAddMode?: boolean;
  addingItemId?: string | null;
  onAddCancel?: () => void;
  onAdd?: () => void;
  addDisabled?: boolean;
  isAddSlotDetailMode?: boolean;
  onAddSlotCancel?: () => void;
  onAddSlotDone?: () => void;
  onRemoveItem?: (id: string) => void;
  onClearCart?: () => void;
  /** Resolve menu item name for combo selection display in cart rows. */
  getMenuItemById?: (id: string) => MenuItem | undefined;
  /** Combo definition lookup; when provided, combo line items are shown in slot order. */
  getComboDefinition?: (menuItemId: string) => ComboDefinition | null;
  voiceMode?: boolean;
  onVoiceToggle?: () => void;
}

export function CartSection({
  items,
  subtotal,
  tax,
  total,
  onSave,
  onPay,
  editingItemId,
  activeComboSlotId,
  onItemClick,
  onRequirementClick,
  onEditCancel,
  onEditDone,
  isAddMode,
  addingItemId,
  onAddCancel,
  onAdd,
  addDisabled,
  isAddSlotDetailMode,
  onAddSlotCancel,
  onAddSlotDone,
  onRemoveItem,
  onClearCart,
  getMenuItemById,
  getComboDefinition,
  voiceMode,
  onVoiceToggle,
}: CartSectionProps) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const isEditMode = editingItemId != null;
  const moreDisabled = isEditMode || !!isAddMode;

  if (items.length === 0) {
    return (
      <div className="flex flex-col h-full bg-white pr-6">
        <CartHeader itemCount={0} onMoreClick={() => setActionsOpen(true)} />
        <div className="flex-1 min-h-0" />
        {onVoiceToggle && (
          <div className="mt-auto">
            <CartFooter
              onSave={onSave}
              onPay={onPay}
              disabled
              voiceMode={voiceMode}
              onVoiceToggle={onVoiceToggle}
              cartEmpty
            />
          </div>
        )}
        <CartActionsModal
          open={actionsOpen}
          onOpenChange={setActionsOpen}
          onClearCart={onClearCart}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white pr-6">
      <CartHeader
        itemCount={itemCount}
        disabled={moreDisabled}
        onMoreClick={moreDisabled ? undefined : () => setActionsOpen(true)}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4">
          <CartItems
            items={items}
            editingItemId={editingItemId}
            addingItemId={addingItemId}
            activeComboSlotId={activeComboSlotId}
            onItemClick={onItemClick}
            onRequirementClick={onRequirementClick}
            onRemoveItem={onRemoveItem}
            getMenuItemById={getMenuItemById}
            getComboDefinition={getComboDefinition}
          />
          <PricingSummary subtotal={subtotal} tax={tax} total={total} isFaded={isEditMode || isAddMode} />
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
          isAddMode={isAddMode}
          onAddCancel={onAddCancel}
          onAdd={onAdd}
          addDisabled={addDisabled}
          isAddSlotDetailMode={isAddSlotDetailMode}
          onAddSlotCancel={onAddSlotCancel}
          onAddSlotDone={onAddSlotDone}
          voiceMode={voiceMode}
          onVoiceToggle={onVoiceToggle}
          cartEmpty={false}
        />
      </div>

      <CartActionsModal
        open={actionsOpen}
        onOpenChange={setActionsOpen}
        onClearCart={onClearCart}
      />
    </div>
  );
}
