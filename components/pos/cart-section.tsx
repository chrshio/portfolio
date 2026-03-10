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
  /** Optional accessories (e.g. customer for retail) rendered below the cart header. */
  accessories?: React.ReactNode;
  /** Order-level fulfillment label (e.g. "In store"); when set with onFulfillmentHeaderClick, shows fulfillment header above cart items (retail). */
  orderFulfillmentLabel?: string;
  /** Called when the fulfillment header is clicked to open fulfillment selection modal. */
  onFulfillmentHeaderClick?: () => void;
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
  accessories,
  orderFulfillmentLabel,
  onFulfillmentHeaderClick,
}: CartSectionProps) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const isEditMode = editingItemId != null;
  const moreDisabled = isEditMode || !!isAddMode;
  const showFulfillmentHeader =
    items.length > 0 && orderFulfillmentLabel != null && onFulfillmentHeaderClick != null;

  if (items.length === 0) {
    return (
      <div className="flex flex-col h-full bg-white pr-6">
        <CartHeader itemCount={0} onMoreClick={() => setActionsOpen(true)} />
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="flex flex-col gap-4">
            {accessories && (
              <div className="flex flex-col gap-4">
                {accessories}
              </div>
            )}
          </div>
        </div>
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

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex flex-col gap-4">
          {accessories && (
            <div className="flex flex-col gap-4">
              {accessories}
            </div>
          )}
          {showFulfillmentHeader ? (
            <div className="rounded-2xl overflow-hidden border border-[#e5e5e5]">
              <div
                role="button"
                tabIndex={0}
                onClick={onFulfillmentHeaderClick}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onFulfillmentHeaderClick?.();
                  }
                }}
                className="flex w-full cursor-pointer items-center justify-between pl-[18px] pr-4 pt-3 pb-1"
                aria-label={`Fulfillment: ${orderFulfillmentLabel}. Select to change.`}
              >
                <span className="text-[14px] font-medium text-[#666666]">
                  {orderFulfillmentLabel}
                </span>
              </div>
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
                bare
              />
            </div>
          ) : (
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
          )}
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
