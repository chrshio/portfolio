"use client";

import { useState, useCallback } from "react";
import { StatusBar } from "./status-bar";
import { MenuGrid } from "./menu-grid";
import { ItemEditPanel, type DraftItemOptions } from "./item-edit-panel";
import { CartSection } from "./cart-section";
import { BottomNavigation } from "./bottom-navigation";
import type { CartItem, MenuItem } from "@/lib/pos-types";

const TAX_RATE = 0.05;

export function POSScreen() {
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: "cortado-1",
      name: "Cortado",
      price: 5.0,
      quantity: 1,
      description: "Equal parts espresso and warm milk. Small, strong, and balanced.",
      modifiers: ["8oz", "Oat"],
    },
    {
      id: "croissant-1",
      name: "Croissant",
      price: 4.5,
      quantity: 1,
    },
  ]);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [draftQuantity, setDraftQuantity] = useState(1);
  const [draftModifiers, setDraftModifiers] = useState<string[]>([]);
  const [draftOptions, setDraftOptions] = useState<DraftItemOptions>({
    note: "",
    fulfillmentMethod: undefined,
    taxes: [],
    discounts: [],
    serviceCharges: [],
  });

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const handleAddItem = useCallback((item: MenuItem) => {
    setCartItems((prev) => {
      const existingItem = prev.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prev.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [
        ...prev,
        { id: item.id, name: item.name, price: item.price, quantity: 1 },
      ];
    });
  }, []);

  const handleItemClick = useCallback(
    (id: string) => {
      const item = cartItems.find((i) => i.id === id);
      if (!item) return;
      setEditingItemId(id);
      setDraftQuantity(item.quantity);
      setDraftModifiers(item.modifiers ?? []);
      setDraftOptions({
        note: item.note ?? "",
        fulfillmentMethod: item.fulfillmentMethod,
        taxes: item.taxes ?? [],
        discounts: item.discounts ?? [],
        serviceCharges: item.serviceCharges ?? [],
      });
    },
    [cartItems]
  );

  const handleEditCancel = useCallback(() => {
    setEditingItemId(null);
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
  }, [editingItemId]);

  const handleSave = useCallback(() => {
    console.log("Saving order...", cartItems);
  }, [cartItems]);

  const handlePay = useCallback(() => {
    console.log("Processing payment...", { subtotal, tax, total });
  }, [subtotal, tax, total]);

  const editingItem = cartItems.find((i) => i.id === editingItemId) ?? null;

  return (
    <div className="flex flex-col h-full w-full bg-black">
      <StatusBar />

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
            />
          ) : (
            <MenuGrid onAddItem={handleAddItem} />
          )}
        </div>

        <div className="w-[320px] flex-shrink-0">
          <CartSection
            items={cartItems}
            subtotal={subtotal}
            tax={tax}
            total={total}
            onSave={handleSave}
            onPay={handlePay}
            editingItemId={editingItemId}
            onItemClick={handleItemClick}
            onEditCancel={handleEditCancel}
            onEditDone={handleEditDone}
          />
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
