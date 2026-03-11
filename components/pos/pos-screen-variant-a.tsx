"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { AlertCircle, Minus, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBar } from "./status-bar";
import { MenuGrid } from "./menu-grid";
import { ItemEditPanel, type DraftItemOptions } from "./item-edit-panel";
import { ItemAddPanel } from "./item-add-panel";
import { CartSection } from "./cart-section";
import { BottomNavigation } from "./bottom-navigation";
import { SettingsPage } from "./settings-page";
import { ChargeScreen } from "./charge-screen";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { CartItem, MenuItem, NavItem } from "@/lib/pos-types";
import {
  itemRequiresSelection,
  getDefaultModifiers,
  getModifierPriceDelta,
} from "@/lib/modifiers";
import { cartHasIncompleteItems } from "@/lib/cart-validation";

const TAX_RATE = 0.05;
const ADD_DRAFT_ID = "__draft_add__";

/**
 * Variant A: Add/edit item details open in a modal overlay on top of menu + cart.
 * Cart does not highlight the item in edit. UI and behavior inside the modal match Standard.
 */
export function POSScreenVariantA() {
  const [activeTab, setActiveTab] = useState<NavItem>("checkout");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [draftQuantity, setDraftQuantity] = useState(1);
  const [draftModifiers, setDraftModifiers] = useState<string[]>([]);
  const [draftOptions, setDraftOptions] = useState<DraftItemOptions>({
    note: "",
    fulfillmentMethod: "for-here",
    taxes: [],
    discounts: [],
    serviceCharges: [],
  });

  const [addingItem, setAddingItem] = useState<MenuItem | null>(null);
  const [addDraftQuantity, setAddDraftQuantity] = useState(1);
  const [addDraftModifiers, setAddDraftModifiers] = useState<string[]>([]);
  const [addDraftOptions, setAddDraftOptions] = useState<DraftItemOptions>({
    note: "",
    fulfillmentMethod: "for-here",
    taxes: [],
    discounts: [],
    serviceCharges: [],
  });

  const [addToastMessage, setAddToastMessage] = useState<string | null>(null);
  const [addScrollSignal, setAddScrollSignal] = useState<{ groupId: string; nonce: number } | null>(null);
  const [editScrollSignal, setEditScrollSignal] = useState<{ groupId: string; nonce: number } | null>(null);

  const [toastVisible, setToastVisible] = useState(false);
  const toastRafRef = useRef<number | null>(null);
  const isEditingMode = editingItemId != null;

  useEffect(() => {
    if (addToastMessage) {
      toastRafRef.current = requestAnimationFrame(() => {
        toastRafRef.current = requestAnimationFrame(() => setToastVisible(true));
      });
    } else {
      setToastVisible(false);
    }
    return () => {
      if (toastRafRef.current != null) cancelAnimationFrame(toastRafRef.current);
    };
  }, [addToastMessage]);

  useEffect(() => {
    if (!addToastMessage) return;
    const t = setTimeout(() => setAddToastMessage(null), 4000);
    return () => clearTimeout(t);
  }, [addToastMessage]);

  const draftCartItem: CartItem | null =
    addingItem && !isEditingMode
      ? {
          id: ADD_DRAFT_ID,
          name: addingItem.name,
          price: addingItem.price,
          quantity: addDraftQuantity,
          description: addingItem.description,
          modifiers: addDraftModifiers.length ? addDraftModifiers : undefined,
        }
      : null;

  const editingDraftItem: CartItem | null = editingItemId
    ? (() => {
        const base = cartItems.find((item) => item.id === editingItemId);
        if (!base) return null;
        return {
          ...base,
          quantity: draftQuantity,
          modifiers: draftModifiers.length ? draftModifiers : undefined,
          note: draftOptions.note || undefined,
          fulfillmentMethod: draftOptions.fulfillmentMethod,
          taxes: draftOptions.taxes,
          discounts: draftOptions.discounts,
          serviceCharges: draftOptions.serviceCharges,
        };
      })()
    : null;

  const displayItems = editingDraftItem
    ? cartItems.map((item) => (item.id === editingDraftItem.id ? editingDraftItem : item))
    : draftCartItem
      ? [...cartItems, draftCartItem]
      : cartItems;

  const subtotal = displayItems.reduce(
    (sum, item) =>
      sum +
      (item.price + getModifierPriceDelta(item, item.modifiers ?? [])) * item.quantity,
    0
  );
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  // When modal is open, cart behind shows committed items only (no live preview, no highlight).
  const cartItemsSubtotal = cartItems.reduce(
    (sum, item) =>
      sum +
      (item.price + getModifierPriceDelta(item, item.modifiers ?? [])) * item.quantity,
    0
  );
  const cartItemsTax = cartItemsSubtotal * TAX_RATE;
  const cartItemsTotal = cartItemsSubtotal + cartItemsTax;

  const handleMenuItemSelect = useCallback((item: MenuItem) => {
    setEditingItemId(null);
    setEditScrollSignal(null);
    if (itemRequiresSelection(item)) {
      setAddingItem(item);
      setAddDraftQuantity(1);
      setAddDraftModifiers(getDefaultModifiers(item));
      setAddDraftOptions({ note: "", fulfillmentMethod: "for-here", taxes: [], discounts: [], serviceCharges: [] });
    } else {
      setCartItems((prev) => {
        const existing = prev.find((c) => c.id === item.id);
        if (existing) {
          return prev.map((c) => (c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
        }
        return [
          ...prev,
          {
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            description: item.description,
            note: "",
            fulfillmentMethod: "for-here",
            taxes: [],
            discounts: [],
            serviceCharges: [],
          },
        ];
      });
    }
  }, []);

  const handleAddConfirm = useCallback(() => {
    if (!addingItem) return;
    const uniqueId = `${addingItem.id}-${Date.now()}`;
    setCartItems((prev) => [
      ...prev,
      {
        id: uniqueId,
        name: addingItem.name,
        price: addingItem.price,
        quantity: addDraftQuantity,
        description: addingItem.description,
        modifiers: addDraftModifiers.length ? addDraftModifiers : undefined,
        note: addDraftOptions.note || undefined,
        fulfillmentMethod: addDraftOptions.fulfillmentMethod,
        taxes: addDraftOptions.taxes,
        discounts: addDraftOptions.discounts,
        serviceCharges: addDraftOptions.serviceCharges,
      },
    ]);
    setAddingItem(null);
  }, [addingItem, addDraftQuantity, addDraftModifiers, addDraftOptions]);

  const handleAddCancel = useCallback(() => {
    setAddingItem(null);
    setAddToastMessage(null);
    setAddScrollSignal(null);
  }, []);

  const handleAddAttempt = useCallback(() => {
    handleAddConfirm();
  }, [handleAddConfirm]);

  const handleItemClick = useCallback(
    (id: string) => {
      const item = cartItems.find((i) => i.id === id);
      if (!item) return;
      setAddingItem(null);
      setAddToastMessage(null);
      setAddScrollSignal(null);
      setEditingItemId(id);
      setEditScrollSignal(null);
      setDraftQuantity(item.quantity);
      setDraftModifiers(item.modifiers?.length ? item.modifiers : getDefaultModifiers(item));
      setDraftOptions({
        note: item.note ?? "",
        fulfillmentMethod: item.fulfillmentMethod ?? "for-here",
        taxes: item.taxes ?? [],
        discounts: item.discounts ?? [],
        serviceCharges: item.serviceCharges ?? [],
      });
    },
    [cartItems]
  );

  const handleRequirementClick = useCallback(
    (itemId: string, groupId: string) => {
      if (addingItem && itemId === ADD_DRAFT_ID) {
        setAddScrollSignal({ groupId, nonce: Date.now() });
        return;
      }
      const item = cartItems.find((i) => i.id === itemId);
      if (!item) return;
      setAddingItem(null);
      setAddToastMessage(null);
      setAddScrollSignal(null);
      if (editingItemId !== itemId) {
        setEditingItemId(itemId);
        setDraftQuantity(item.quantity);
        setDraftModifiers(item.modifiers?.length ? item.modifiers : getDefaultModifiers(item));
        setDraftOptions({
          note: item.note ?? "",
          fulfillmentMethod: item.fulfillmentMethod ?? "for-here",
          taxes: item.taxes ?? [],
          discounts: item.discounts ?? [],
          serviceCharges: item.serviceCharges ?? [],
        });
      }
      setEditScrollSignal({ groupId, nonce: Date.now() });
    },
    [addingItem, cartItems, editingItemId]
  );

  const handleEditCancel = useCallback(() => {
    setEditingItemId(null);
    setEditScrollSignal(null);
  }, []);

  const handleEditDone = useCallback(() => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === editingItemId
          ? {
              ...item,
              quantity: draftQuantity,
              modifiers: draftModifiers,
              note: draftOptions.note || undefined,
              fulfillmentMethod: draftOptions.fulfillmentMethod,
              taxes: draftOptions.taxes,
              discounts: draftOptions.discounts,
              serviceCharges: draftOptions.serviceCharges,
            }
          : item
      )
    );
    setEditingItemId(null);
    setEditScrollSignal(null);
  }, [editingItemId, draftQuantity, draftModifiers, draftOptions]);

  const handleModifiersChange = useCallback((modifiers: string[]) => {
    setDraftModifiers(modifiers);
  }, []);

  const handleOptionsChange = useCallback((options: DraftItemOptions) => {
    setDraftOptions(options);
  }, []);

  const handleCompItem = useCallback(() => {
    console.log("Comp item:", editingItemId);
  }, [editingItemId]);

  const handleRemoveItem = useCallback(() => {
    setCartItems((prev) => prev.filter((item) => item.id !== editingItemId));
    setEditingItemId(null);
    setEditScrollSignal(null);
  }, [editingItemId]);

  const handleRemoveCartItem = useCallback((id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    if (editingItemId === id) setEditingItemId(null);
  }, [editingItemId]);

  const handleClearCart = useCallback(() => {
    setCartItems([]);
    setEditingItemId(null);
    setAddingItem(null);
  }, []);

  const handleSave = useCallback(() => {
    console.log("Saving order...", cartItems);
  }, [cartItems]);

  const [showChargeScreen, setShowChargeScreen] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const handlePay = useCallback(() => {
    if (cartHasIncompleteItems(displayItems)) {
      setAddToastMessage("Make required selections to continue.");
      return;
    }
    setShowChargeScreen(true);
  }, [displayItems]);

  const editingItem = cartItems.find((i) => i.id === editingItemId) ?? null;
  const itemDetailModalOpen = !!addingItem || !!editingItemId;

  const handleItemDetailModalOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        if (addingItem) handleAddCancel();
        else if (editingItemId) handleEditCancel();
      }
    },
    [addingItem, editingItemId, handleAddCancel, handleEditCancel]
  );

  return (
    <div className="relative flex flex-col h-full w-full bg-black">
      <StatusBar />

      <div className="flex-1 min-h-0 relative flex flex-col">
        {activeTab === "more" ? (
          <SettingsPage variantLabel="Variant A" onLoadingChange={setSettingsLoading} />
        ) : (
          <>
            {/* Always show menu + cart; add/edit open in modal */}
            <div className="flex flex-1 min-h-0">
              <div className="flex-1 flex flex-col min-w-0">
                <MenuGrid onAddItem={handleMenuItemSelect} />
              </div>

              <div className="w-[320px] flex-shrink-0">
                <CartSection
                  items={itemDetailModalOpen ? cartItems : displayItems}
                  subtotal={itemDetailModalOpen ? cartItemsSubtotal : subtotal}
                  tax={itemDetailModalOpen ? cartItemsTax : tax}
                  total={itemDetailModalOpen ? cartItemsTotal : total}
                  onSave={handleSave}
                  onPay={handlePay}
                  editingItemId={null}
                  activeComboSlotId={null}
                  onItemClick={handleItemClick}
                  onRequirementClick={handleRequirementClick}
                  onEditCancel={handleEditCancel}
                  onEditDone={handleEditDone}
                  isAddMode={!!addingItem && !isEditingMode}
                  addingItemId={itemDetailModalOpen ? null : addingItem && !isEditingMode ? ADD_DRAFT_ID : null}
                  onAddCancel={handleAddCancel}
                  onAdd={handleAddAttempt}
                  onRemoveItem={handleRemoveCartItem}
                  onClearCart={handleClearCart}
                />
              </div>
            </div>

            {/* Item add/edit modal — overlay on top of menu + cart */}
            <Dialog open={itemDetailModalOpen} onOpenChange={handleItemDetailModalOpenChange}>
              <DialogContent
                className="top-[68px] left-1/2 translate-x-[-50%] translate-y-0 max-h-[calc(100%-84px)] flex flex-col overflow-hidden rounded-[24px] border-[#e5e5e5] bg-white p-0 shadow-xl"
                style={{ width: 664, maxWidth: "min(664px, calc(100vw - 2rem))" }}
                showCloseButton={false}
              >
                {/* One row: X | 19px title | stepper | Done/Add (per Figma) */}
                <div className="flex shrink-0 items-center gap-3 px-4 pt-4 pb-3">
                  <button
                    type="button"
                    onClick={() => handleItemDetailModalOpenChange(false)}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f0f0f0] active:bg-[#e5e5e5]"
                    aria-label="Close"
                  >
                    <X className="h-6 w-6 text-[#101010]" />
                  </button>
                  <h2 className="min-w-0 flex-1 text-[19px] font-semibold text-[#101010] truncate">
                    {editingItem?.name ?? addingItem?.name ?? ""}
                  </h2>
                  <div className="flex items-center border border-[#dadada] rounded-full h-[56px] shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        editingItem
                          ? setDraftQuantity((q) => Math.max(1, q - 1))
                          : setAddDraftQuantity((q) => Math.max(1, q - 1))
                      }
                      disabled={editingItem ? draftQuantity <= 1 : addDraftQuantity <= 1}
                      className="flex items-center justify-center w-[56px] h-[56px] shrink-0 disabled:cursor-default"
                    >
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#f0f0f0]">
                        <Minus
                          className={cn(
                            "w-4 h-4 transition-colors",
                            (editingItem ? draftQuantity <= 1 : addDraftQuantity <= 1)
                              ? "text-[#c8c8c8]"
                              : "text-[#101010]"
                          )}
                        />
                      </span>
                    </button>
                    <span
                      className="text-[16px] text-[#101010] text-center min-w-[28px]"
                      style={{ fontFeatureSettings: "'lnum' 1, 'tnum' 1" }}
                    >
                      {editingItem ? draftQuantity : addDraftQuantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        editingItem
                          ? setDraftQuantity((q) => q + 1)
                          : setAddDraftQuantity((q) => q + 1)
                      }
                      className="flex items-center justify-center w-[56px] h-[56px] shrink-0"
                    >
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#f0f0f0]">
                        <Plus className="w-4 h-4 text-[#101010]" />
                      </span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => (editingItem ? handleEditDone() : handleAddAttempt())}
                    className="shrink-0 rounded-full bg-[#101010] text-[#ffffff] font-medium text-base px-6 py-3"
                  >
                    {editingItem ? "Done" : "Add"}
                  </button>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                  {editingItem ? (
                    <ItemEditPanel
                      item={editingItem}
                      draftQuantity={draftQuantity}
                      draftModifiers={draftModifiers}
                      draftOptions={draftOptions}
                      onQuantityChange={setDraftQuantity}
                      onModifiersChange={handleModifiersChange}
                      onOptionsChange={handleOptionsChange}
                      onCompItem={handleCompItem}
                      onRemoveItem={handleRemoveItem}
                      scrollSignal={editScrollSignal}
                      hideHeader
                    />
                  ) : addingItem ? (
                    <ItemAddPanel
                      item={addingItem}
                      onCancel={handleAddCancel}
                      draftQuantity={addDraftQuantity}
                      draftModifiers={addDraftModifiers}
                      draftOptions={addDraftOptions}
                      onQuantityChange={setAddDraftQuantity}
                      onModifiersChange={setAddDraftModifiers}
                      onOptionsChange={setAddDraftOptions}
                      scrollSignal={addScrollSignal}
                      hideHeader
                    />
                  ) : null}
                </div>
              </DialogContent>
            </Dialog>

            {showChargeScreen && (
              <div className="absolute inset-0 z-10 flex flex-col justify-end">
                <ChargeScreen total={total} onClose={() => setShowChargeScreen(false)} />
              </div>
            )}
          </>
        )}
      </div>

      {!showChargeScreen && !settingsLoading && (
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      {addToastMessage && (
        <div
          className="absolute left-1/2 z-50 w-[600px] max-w-[calc(100%-32px)] transition-transform duration-300 ease-out"
          style={{
            bottom: "78px",
            transform: `translateX(-50%) translateY(${toastVisible ? "0" : "200%"})`,
          }}
        >
          <div className="flex items-center gap-3 bg-[#cc0023] px-4 py-4 rounded-lg shadow-xl">
            <AlertCircle className="w-6 h-6 text-white shrink-0" />
            <p className="flex-1 text-[16px] text-white leading-6">{addToastMessage}</p>
            <button onClick={() => setAddToastMessage(null)} className="shrink-0">
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
