"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { AlertCircle, X } from "lucide-react";
import { StatusBar } from "./status-bar";
import { MenuGrid } from "./menu-grid";
import { ItemEditPanel, type DraftItemOptions } from "./item-edit-panel";
import { ItemAddPanel } from "./item-add-panel";
import { CartSection } from "./cart-section";
import { BottomNavigation } from "./bottom-navigation";
import { SettingsPage } from "./settings-page";
import type { CartItem, MenuItem, NavItem } from "@/lib/pos-types";
import {
  itemRequiresSelection,
  getDefaultModifiers,
  getModifierPriceDelta,
} from "@/lib/modifiers";

const TAX_RATE = 0.05;
const ADD_DRAFT_ID = "__draft_add__";

export function POSScreen() {
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

  // Item being configured before being added to the cart (has required selections).
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

  // Toast + scroll signal for the add panel validation.
  const [addToastMessage, setAddToastMessage] = useState<string | null>(null);
  const [addScrollSignal, setAddScrollSignal] = useState<{ groupId: string; nonce: number } | null>(null);
  const [editScrollSignal, setEditScrollSignal] = useState<{ groupId: string; nonce: number } | null>(null);

  // Slide-in animation for the toast.
  const [toastVisible, setToastVisible] = useState(false);
  const toastRafRef = useRef<number | null>(null);
  const isEditingMode = editingItemId != null;

  useEffect(() => {
    if (addToastMessage) {
      // Double-RAF so the element is in the DOM before the transition starts.
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

  // Auto-dismiss the toast after 4 seconds.
  useEffect(() => {
    if (!addToastMessage) return;
    const t = setTimeout(() => setAddToastMessage(null), 4000);
    return () => clearTimeout(t);
  }, [addToastMessage]);

  // When the add panel is open, show a draft row in the cart so the user can
  // see how the item-in-progress affects the order total in real time.
  const draftCartItem: CartItem | null = addingItem
    && !isEditingMode
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
      (item.price + getModifierPriceDelta(item, item.modifiers ?? [])) *
        item.quantity,
    0
  );
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const handleMenuItemSelect = useCallback((item: MenuItem) => {
    // Entering add flow should always exit edit flow.
    setEditingItemId(null);
    setEditScrollSignal(null);
    if (itemRequiresSelection(item)) {
      // Open the add panel so the user can make required selections first.
      setAddingItem(item);
      setAddDraftQuantity(1);
      setAddDraftModifiers(getDefaultModifiers(item));
      setAddDraftOptions({ note: "", fulfillmentMethod: "for-here", taxes: [], discounts: [], serviceCharges: [] });
    } else {
      // No required selections — add (or bump) directly.
      setCartItems((prev) => {
        const existing = prev.find((c) => c.id === item.id);
        if (existing) {
          return prev.map((c) =>
            c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
          );
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
      // Entering edit flow should always exit add flow.
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

      // Entering edit flow should always exit add flow.
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

  const handlePay = useCallback(() => {
    console.log("Processing payment...", { subtotal, tax, total });
  }, [subtotal, tax, total]);

  const editingItem = cartItems.find((i) => i.id === editingItemId) ?? null;

  return (
    <div className="relative flex flex-col h-full w-full bg-black">
      <StatusBar />

      {activeTab === "more" ? (
        <SettingsPage variantLabel="Standard" />
      ) : (
        <div className="flex flex-1 min-h-0">
          <div className="flex-1 flex flex-col min-w-0">
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
              />
            ) : (
              <MenuGrid onAddItem={handleMenuItemSelect} />
            )}
          </div>

          <div className="w-[320px] flex-shrink-0">
            <CartSection
              items={displayItems}
              subtotal={subtotal}
              tax={tax}
              total={total}
              onSave={handleSave}
              onPay={handlePay}
              editingItemId={editingItemId}
              activeComboSlotId={null}
              onItemClick={handleItemClick}
              onRequirementClick={handleRequirementClick}
              onEditCancel={handleEditCancel}
              onEditDone={handleEditDone}
              isAddMode={!!addingItem && !isEditingMode}
              addingItemId={addingItem && !isEditingMode ? ADD_DRAFT_ID : null}
              onAddCancel={handleAddCancel}
              onAdd={handleAddAttempt}
              onRemoveItem={handleRemoveCartItem}
              onClearCart={handleClearCart}
            />
          </div>
        </div>
      )}

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Toast — centered above the bottom nav bar, slides up from below */}
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
