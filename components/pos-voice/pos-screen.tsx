"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { AlertCircle, X } from "lucide-react";
import { StatusBarVision } from "./status-bar-vision";
import { BottomNavigationVision } from "./bottom-navigation-vision";
import { MenuGrid } from "@/components/pos/menu-grid";
import { ItemEditPanel, type DraftItemOptions } from "@/components/pos/item-edit-panel";
import { ItemAddPanel } from "@/components/pos/item-add-panel";
import { CartSection } from "@/components/pos/cart-section";
import { SettingsPage } from "@/components/pos/settings-page";
import { ChargeScreen } from "@/components/pos/charge-screen";
import { VoiceOverlay, type VoiceMessage } from "./voice-overlay";
import { useVoiceRecognition } from "@/hooks/use-voice-recognition";
import { useVoiceOrder } from "@/hooks/use-voice-order";
import type { CartItem, MenuItem, NavItem } from "@/lib/pos-types";
import { cartHasIncompleteItems } from "@/lib/cart-validation";
import {
  featuredItems,
  teaItems,
  icedTeaItems,
  bakeryItems,
  beanItems,
  merchItems,
} from "@/lib/menu-library";
import {
  itemRequiresSelection,
  getDefaultModifiers,
  getModifierPriceDelta,
} from "@/lib/modifiers";

const TAX_RATE = 0.05;
const ADD_DRAFT_ID = "__draft_add__";

function getMenuItemById(itemId: string): MenuItem | undefined {
  const sources = [
    featuredItems,
    teaItems,
    icedTeaItems,
    bakeryItems,
    beanItems,
    merchItems,
  ];
  for (const list of sources) {
    const found = list.find((i) => i.id === itemId);
    if (found) return found;
  }
  return undefined;
}

export function POSScreenVoice() {
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

  // ---- Voice mode ----
  const [voiceMode, setVoiceMode] = useState(false);
  const cartItemsRef = useRef(cartItems);
  cartItemsRef.current = cartItems;

  const voiceItemCounter = useRef(0);

  const handleAddItemByVoice = useCallback(
    (itemId: string, modifiers?: string[]) => {
      const menuItem = getMenuItemById(itemId);
      if (!menuItem) return;
      voiceItemCounter.current += 1;
      const uniqueId = `${menuItem.id}-${Date.now()}-${voiceItemCounter.current}`;
      setCartItems((prev) => [
        ...prev,
        {
          id: uniqueId,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
          description: menuItem.description,
          modifiers: modifiers?.length ? modifiers : undefined,
          note: "",
          fulfillmentMethod: "for-here",
          taxes: [],
          discounts: [],
          serviceCharges: [],
        },
      ]);
    },
    []
  );

  const handleSetModifierByVoice = useCallback((cartItemId: string, modifiers: string[]) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === cartItemId ? { ...item, modifiers } : item
      )
    );
  }, []);

  const voiceOrder = useVoiceOrder({
    onAddItem: handleAddItemByVoice,
    onSetModifier: handleSetModifierByVoice,
    getCartSnapshot: () =>
      cartItemsRef.current.map((i) => ({
        id: i.id,
        name: i.name,
        modifiers: i.modifiers,
      })),
  });

  const handleFinalTranscript = useCallback(
    (transcript: string) => {
      if (!transcript.trim()) return;
      voiceOrder.processTranscript(transcript);
    },
    [voiceOrder]
  );

  const voice = useVoiceRecognition({
    onFinalTranscript: handleFinalTranscript,
  });

  const handleVoiceToggle = useCallback(() => {
    if (!voiceMode) {
      setEditingItemId(null);
      setAddingItem(null);
      setAddToastMessage(null);
      setAddScrollSignal(null);
      setEditScrollSignal(null);
      voiceOrder.reset();
      // Must call start() directly in the click handler so Chrome's SpeechRecognition runs in a user gesture
      voice.start();
      setVoiceMode(true);
    } else {
      voice.stop();
      setVoiceMode(false);
    }
  }, [voiceMode, voice, voiceOrder]);

  // Merge interim transcript bubble into the voiceOrder messages for display
  const voiceDisplayMessages: VoiceMessage[] = (() => {
    const base = voiceOrder.messages;
    if (!voiceMode || !voice.interimTranscript) return base;
    return [
      ...base,
      {
        id: "__interim__",
        role: "customer" as const,
        text: voice.interimTranscript,
        isInterim: true,
      },
    ];
  })();

  // ---- Toast animation ----
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

  // ---- Cart display items ----
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

  // ---- Menu / cart handlers ----
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
      <StatusBarVision />

      <div className="flex-1 min-h-0 relative flex flex-col">
        {activeTab === "more" ? (
          <SettingsPage variantLabel="*Vision*" onLoadingChange={setSettingsLoading} />
        ) : (
          <>
            <div className="flex flex-1 min-h-0 rounded-xl overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0 relative">
              {editingItem && !voiceMode ? (
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
              ) : addingItem && !voiceMode ? (
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

              {voiceMode && (
                <VoiceOverlay
                  messages={voiceDisplayMessages.length > 0 ? voiceDisplayMessages : undefined}
                  isListening={voice.isListening}
                  isProcessing={voiceOrder.isProcessing}
                  error={voice.error}
                  onClose={handleVoiceToggle}
                  onSuggestionSelect={voiceOrder.handleSuggestionSelect}
                  analyserNode={voice.analyserNode}
                />
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
                voiceMode={voiceMode}
                onVoiceToggle={handleVoiceToggle}
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
        <BottomNavigationVision activeTab={activeTab} onTabChange={setActiveTab} />
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
