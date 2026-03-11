"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { AlertCircle, X } from "lucide-react";
import { StatusBar } from "@/components/pos/status-bar";
import { MenuGridRetail } from "@/components/pos-retail/menu-grid";
import { ItemEditPanel, type DraftItemOptions } from "@/components/pos/item-edit-panel";
import { ItemAddPanel } from "@/components/pos/item-add-panel";
import { CartSection } from "@/components/pos/cart-section";
import { CartAccessoryCustomer } from "@/components/pos/cart-accessory-customer";
import { AddCustomerModal } from "@/components/pos/add-customer-modal";
import { FulfillmentMethodModal } from "@/components/pos-retail/fulfillment-method-modal";
import { BottomNavigation } from "@/components/pos/bottom-navigation";
import { SettingsPage } from "@/components/pos/settings-page";
import { ChargeScreen } from "@/components/pos/charge-screen";
import {
  type CartItem,
  type Customer,
  type MenuItem,
  type NavItem,
  RETAIL_ORDER_FULFILLMENTS,
} from "@/lib/pos-types";
import {
  itemRequiresSelection,
  getDefaultModifiers,
  getModifierPriceDelta,
} from "@/lib/modifiers";
import { cartHasIncompleteItems } from "@/lib/cart-validation";
import { getMenuItemByIdRetail, favoritesItems } from "@/lib/menu-library-retail";

const TAX_RATE = 0.05;
const ADD_DRAFT_ID = "__draft_add__";

/** Pick a random retail item for simulating a barcode scan. */
function getRandomRetailItem(): MenuItem | undefined {
  if (favoritesItems.length === 0) return undefined;
  return favoritesItems[Math.floor(Math.random() * favoritesItems.length)];
}

export function POSScreenRetail({
  onRegisterAddScannedItem,
}: {
  onRegisterAddScannedItem?: (addItem: () => void) => void;
} = {}) {
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

  const [cartCustomer, setCartCustomer] = useState<Customer | null>(null);
  const [addCustomerModalOpen, setAddCustomerModalOpen] = useState(false);

  const [orderFulfillment, setOrderFulfillment] = useState<string>("in-store");
  const [fulfillmentModalOpen, setFulfillmentModalOpen] = useState(false);

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
      (item.price + getModifierPriceDelta(item, item.modifiers ?? [])) *
        item.quantity,
    0
  );
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const handleAddScannedItem = useCallback(() => {
    const item = getRandomRetailItem();
    if (!item) return;
    setEditingItemId(null);
    setEditScrollSignal(null);
    setAddingItem(null);
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
  }, []);

  useEffect(() => {
    onRegisterAddScannedItem?.(handleAddScannedItem);
    return () => onRegisterAddScannedItem?.(() => {});
  }, [onRegisterAddScannedItem, handleAddScannedItem]);

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

  return (
    <div className="relative flex flex-col h-full w-full bg-black">
      <StatusBar />

      <div className="flex-1 min-h-0 relative flex flex-col">
        {activeTab === "more" ? (
          <SettingsPage variantLabel="Retail" onLoadingChange={setSettingsLoading} />
        ) : (
          <>
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
                <MenuGridRetail onAddItem={handleMenuItemSelect} />
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
                getMenuItemById={getMenuItemByIdRetail}
                accessories={
                  <CartAccessoryCustomer
                    customer={cartCustomer}
                    onAddCustomer={() => setAddCustomerModalOpen(true)}
                  />
                }
                orderFulfillmentLabel={
                  RETAIL_ORDER_FULFILLMENTS.find((f) => f.id === orderFulfillment)?.label ?? "In store"
                }
                onFulfillmentHeaderClick={() => setFulfillmentModalOpen(true)}
              />
            </div>
          </div>

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

      <AddCustomerModal
        open={addCustomerModalOpen}
        onOpenChange={setAddCustomerModalOpen}
        onSelectCustomer={setCartCustomer}
      />

      <FulfillmentMethodModal
        open={fulfillmentModalOpen}
        onOpenChange={setFulfillmentModalOpen}
        selectedId={orderFulfillment}
        onSelect={setOrderFulfillment}
      />
    </div>
  );
}
