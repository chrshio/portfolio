"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { AlertCircle, X, Search, Check } from "lucide-react";
import { StatusBar } from "@/components/pos/status-bar";
import { MenuGridQSR } from "@/components/pos-qsr/menu-grid";
import { ItemEditPanel, type DraftItemOptions } from "@/components/pos/item-edit-panel";
import { ItemAddPanel } from "@/components/pos/item-add-panel";
import { CartSection } from "@/components/pos/cart-section";
import { BottomNavigation } from "@/components/pos/bottom-navigation";
import { SettingsPage } from "@/components/pos/settings-page";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { CartItem, MenuItem, ComboSlot, ComboSlotSelection, ComboDefinition, NavItem } from "@/lib/pos-types";
import {
  itemRequiresSelection,
  getDefaultModifiers,
  getModifierPriceDelta,
  getModifierGroups,
  isGroupRequirementUnmet,
} from "@/lib/modifiers";
import {
  getComboDefinition,
  getDefaultComboSelections,
  getCategoryItems,
  getMenuItemById,
} from "@/lib/menu-library-qsr";

const TAX_RATE = 0.05;
const ADD_DRAFT_ID = "__draft_add__";

/** Returns slot ids (in combo order) that have at least one unmet required modifier (e.g. spice level). */
function getSlotsWithUnmetModifierRequirements(
  comboDef: ComboDefinition,
  selections: Record<string, ComboSlotSelection>,
  getMenuItemById: (id: string) => MenuItem | undefined
): string[] {
  const slotIds: string[] = [];
  for (const slot of comboDef.slots) {
    const sel = selections[slot.slotId];
    if (!sel?.itemId) continue;
    const menuItem = getMenuItemById(sel.itemId);
    if (!menuItem) continue;
    const groups = getModifierGroups(menuItem);
    const hasUnmet = groups.some((g) =>
      isGroupRequirementUnmet(g, sel.modifiers ?? [])
    );
    if (hasUnmet) slotIds.push(slot.slotId);
  }
  return slotIds;
}

export function POSScreenQSR() {
  const [activeTab, setActiveTab] = useState<NavItem>("checkout");
  const cloneSelection = (selection?: { itemId: string; modifiers?: string[] }) =>
    selection
      ? {
          ...selection,
          modifiers: selection.modifiers ? [...selection.modifiers] : undefined,
        }
      : undefined;

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
  const [addDraftComboSelections, setAddDraftComboSelections] = useState<Record<string, { itemId: string; modifiers?: string[] }>>({});

  // Toast + scroll signal for the add panel validation.
  const [addToastMessage, setAddToastMessage] = useState<string | null>(null);
  const [addScrollSignal, setAddScrollSignal] = useState<{ groupId: string; nonce: number } | null>(null);
  const [editScrollSignal, setEditScrollSignal] = useState<{ groupId: string; nonce: number } | null>(null);
  const [editDraftComboSelections, setEditDraftComboSelections] = useState<Record<string, { itemId: string; modifiers?: string[] }>>({});
  /** When set, left panel shows slot-detail view (combo name > slot item) for this slot. */
  const [editingComboSlotId, setEditingComboSlotId] = useState<string | null>(null);
  const addSlotSelectionSnapshotRef = useRef<Record<string, { itemId: string; modifiers?: string[] } | undefined>>({});

  /** After category onboarding, slots that need modifier selection (e.g. spice level); we auto-open slot detail for each. */
  const [addPendingModifierSlotQueue, setAddPendingModifierSlotQueue] = useState<string[]>([]);

  // Combo onboarding: when user taps a combo, show category pickers consecutively before the add panel.
  const [onboardingItem, setOnboardingItem] = useState<MenuItem | null>(null);
  const [onboardingSlotQueue, setOnboardingSlotQueue] = useState<ComboSlot[]>([]);
  const [onboardingSelections, setOnboardingSelections] = useState<Record<string, ComboSlotSelection>>({});
  const [onboardingSearch, setOnboardingSearch] = useState("");

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

  // After opening add panel from combo onboarding, auto-open slot detail for first slot that needs modifier selection.
  useEffect(() => {
    if (
      addingItem &&
      addPendingModifierSlotQueue.length > 0 &&
      editingComboSlotId === null
    ) {
      setEditingComboSlotId(addPendingModifierSlotQueue[0]);
    }
  }, [addingItem, addPendingModifierSlotQueue, editingComboSlotId]);

  // When the user completes all required modifiers for the current slot (e.g. selected spice level), auto-advance back to combo details or to the next slot.
  useEffect(() => {
    if (
      !addingItem ||
      !editingComboSlotId ||
      !addPendingModifierSlotQueue.includes(editingComboSlotId)
    )
      return;
    const comboDef = getComboDefinition(addingItem.id);
    if (!comboDef) return;
    const slotsWithUnmet = getSlotsWithUnmetModifierRequirements(
      comboDef,
      addDraftComboSelections,
      getMenuItemById
    );
    if (slotsWithUnmet.includes(editingComboSlotId)) return;
    // Current slot is complete — auto-advance (same as tapping Done).
    delete addSlotSelectionSnapshotRef.current[editingComboSlotId];
    setAddPendingModifierSlotQueue((prev) => {
      const next = prev.filter((id) => id !== editingComboSlotId);
      if (next.length > 0) {
        setEditingComboSlotId(next[0]);
        return next;
      }
      setEditingComboSlotId(null);
      return [];
    });
  }, [
    addingItem,
    editingComboSlotId,
    addPendingModifierSlotQueue,
    addDraftComboSelections,
  ]);

  // When the add panel is open, show a draft row in the cart so the user can
  // see how the item-in-progress affects the order total in real time.
  const addComboDef = addingItem ? getComboDefinition(addingItem.id) : null;
  const draftCartItem: CartItem | null = addingItem
    && !isEditingMode
    ? {
        id: ADD_DRAFT_ID,
        name: addingItem.name,
        price: addingItem.price,
        quantity: addDraftQuantity,
        description: addingItem.description,
        modifiers: addDraftModifiers.length ? addDraftModifiers : undefined,
        ...(addComboDef && Object.keys(addDraftComboSelections).length > 0
          ? { comboSelections: addDraftComboSelections, menuItemId: addingItem.id }
          : {}),
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
          ...(base.menuItemId != null && Object.keys(editDraftComboSelections).length > 0
            ? { comboSelections: editDraftComboSelections }
            : {}),
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

  const openAddPanelForCombo = useCallback(
    (item: MenuItem, preSelections: Record<string, ComboSlotSelection>) => {
      const comboDef = getComboDefinition(item.id);
      setAddingItem(item);
      setAddDraftQuantity(1);
      setAddDraftModifiers(getDefaultModifiers(item));
      setAddDraftOptions({ note: "", fulfillmentMethod: "for-here", taxes: [], discounts: [], serviceCharges: [] });
      const defaults = comboDef ? getDefaultComboSelections(comboDef) : {};
      setAddDraftComboSelections({ ...defaults, ...preSelections });
    },
    []
  );

  const handleMenuItemSelect = useCallback((item: MenuItem) => {
    setEditingItemId(null);
    setEditScrollSignal(null);
    const comboDef = getComboDefinition(item.id);
    const isCombo = !!comboDef;
    const needsPanel = itemRequiresSelection(item) || isCombo;

    if (isCombo && comboDef) {
      const categorySlots = comboDef.slots.filter((s) => s.type === "category" && s.categoryId);
      if (categorySlots.length > 0) {
        const defaults = getDefaultComboSelections(comboDef);
        setOnboardingItem(item);
        setOnboardingSlotQueue(categorySlots);
        setOnboardingSelections(defaults);
        setOnboardingSearch("");
        return;
      }
    }

    if (needsPanel) {
      openAddPanelForCombo(item, {});
      const comboDefForQueue = getComboDefinition(item.id);
      const defaultsForQueue = comboDefForQueue ? getDefaultComboSelections(comboDefForQueue) : {};
      const modifierQueue = comboDefForQueue
        ? getSlotsWithUnmetModifierRequirements(comboDefForQueue, defaultsForQueue, getMenuItemById)
        : [];
      setAddPendingModifierSlotQueue(modifierQueue);
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
  }, [openAddPanelForCombo]);

  const handleOnboardingSelect = useCallback(
    (slotId: string, itemId: string) => {
      const newSelections = { ...onboardingSelections, [slotId]: { itemId, modifiers: [] } };
      const remaining = onboardingSlotQueue.slice(1);
      if (remaining.length > 0) {
        setOnboardingSelections(newSelections);
        setOnboardingSlotQueue(remaining);
        setOnboardingSearch("");
      } else if (onboardingItem) {
        const comboDef = getComboDefinition(onboardingItem.id);
        const modifierSlotQueue = comboDef
          ? getSlotsWithUnmetModifierRequirements(comboDef, newSelections, getMenuItemById)
          : [];
        setOnboardingItem(null);
        setOnboardingSlotQueue([]);
        setOnboardingSearch("");
        openAddPanelForCombo(onboardingItem, newSelections);
        setAddPendingModifierSlotQueue(modifierSlotQueue);
        setOnboardingSelections({});
      }
    },
    [onboardingSelections, onboardingSlotQueue, onboardingItem, openAddPanelForCombo]
  );

  const handleOnboardingCancel = useCallback(() => {
    if (onboardingItem) {
      openAddPanelForCombo(onboardingItem, onboardingSelections);
    }
    setOnboardingItem(null);
    setOnboardingSlotQueue([]);
    setOnboardingSelections({});
    setOnboardingSearch("");
  }, [onboardingItem, onboardingSelections, openAddPanelForCombo]);

  const handleAddConfirm = useCallback(() => {
    if (!addingItem) return;
    const uniqueId = `${addingItem.id}-${Date.now()}`;
    const comboDef = getComboDefinition(addingItem.id);
    setCartItems((prev) => [
      ...prev,
      {
        id: uniqueId,
        name: addingItem.name,
        price: addingItem.price,
        quantity: addDraftQuantity,
        description: addingItem.description,
        modifiers: addDraftModifiers.length ? addDraftModifiers : undefined,
        ...(comboDef && Object.keys(addDraftComboSelections).length > 0
          ? { comboSelections: addDraftComboSelections, menuItemId: addingItem.id }
          : {}),
        note: addDraftOptions.note || undefined,
        fulfillmentMethod: addDraftOptions.fulfillmentMethod,
        taxes: addDraftOptions.taxes,
        discounts: addDraftOptions.discounts,
        serviceCharges: addDraftOptions.serviceCharges,
      },
    ]);
    setAddingItem(null);
    setEditingComboSlotId(null);
    setAddPendingModifierSlotQueue([]);
    addSlotSelectionSnapshotRef.current = {};
  }, [addingItem, addDraftQuantity, addDraftModifiers, addDraftOptions, addDraftComboSelections]);

  const handleAddCancel = useCallback(() => {
    setAddingItem(null);
    setEditingComboSlotId(null);
    setAddDraftComboSelections({});
    setAddPendingModifierSlotQueue([]);
    setAddToastMessage(null);
    setAddScrollSignal(null);
    addSlotSelectionSnapshotRef.current = {};
  }, []);

  const handleAddAttempt = useCallback(() => {
    handleAddConfirm();
  }, [handleAddConfirm]);

  const handleAddSlotDone = useCallback(() => {
    if (editingComboSlotId) delete addSlotSelectionSnapshotRef.current[editingComboSlotId];
    setAddPendingModifierSlotQueue((prev) => {
      const next = prev.filter((id) => id !== editingComboSlotId);
      if (next.length > 0) {
        setEditingComboSlotId(next[0]);
        return next;
      }
      setEditingComboSlotId(null);
      return [];
    });
  }, [editingComboSlotId]);

  const handleAddSlotCancel = useCallback(() => {
    if (!editingComboSlotId) return;
    const snapshot = addSlotSelectionSnapshotRef.current[editingComboSlotId];
    setAddDraftComboSelections((prev) => {
      if (!snapshot) {
        const next = { ...prev };
        delete next[editingComboSlotId];
        return next;
      }
      return {
        ...prev,
        [editingComboSlotId]: cloneSelection(snapshot)!,
      };
    });
    delete addSlotSelectionSnapshotRef.current[editingComboSlotId];
    setEditingComboSlotId(null);
  }, [editingComboSlotId]);

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
      const comboDef = item.menuItemId ? getComboDefinition(item.menuItemId) : null;
      setEditDraftComboSelections(
        item.comboSelections && Object.keys(item.comboSelections).length > 0
          ? item.comboSelections
          : comboDef
            ? getDefaultComboSelections(comboDef)
            : {}
      );
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
        const comboDef = item.menuItemId ? getComboDefinition(item.menuItemId) : null;
        setEditDraftComboSelections(
          item.comboSelections && Object.keys(item.comboSelections).length > 0
            ? item.comboSelections
            : comboDef
              ? getDefaultComboSelections(comboDef)
              : {}
        );
      }

      // Combo slot modifier requirement: open slot-detail view and scroll to the group.
      const isComboSlotGroup = groupId.startsWith("__combo__:");
      if (isComboSlotGroup) {
        const parts = groupId.split(":");
        const slotId = parts[1];
        const realGroupId = parts.slice(2).join(":");
        setEditingComboSlotId(slotId ?? null);
        setEditScrollSignal({ groupId: realGroupId, nonce: Date.now() });
      } else {
        setEditScrollSignal({ groupId, nonce: Date.now() });
      }
    },
    [addingItem, cartItems, editingItemId]
  );

  const handleEditCancel = useCallback(() => {
    setEditingItemId(null);
    setEditingComboSlotId(null);
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
              ...(item.menuItemId != null && Object.keys(editDraftComboSelections).length > 0
                ? { comboSelections: editDraftComboSelections, menuItemId: item.menuItemId }
                : {}),
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
    setEditingComboSlotId(null);
    setEditScrollSignal(null);
  }, [editingItemId, draftQuantity, draftModifiers, draftOptions, editDraftComboSelections]);

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
    setEditingComboSlotId(null);
    setEditScrollSignal(null);
  }, [editingItemId]);

  const handleRemoveCartItem = useCallback((id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    if (editingItemId === id) {
      setEditingItemId(null);
      setEditingComboSlotId(null);
    }
  }, [editingItemId]);

  const handleClearCart = useCallback(() => {
    setCartItems([]);
    setEditingItemId(null);
    setEditingComboSlotId(null);
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
        <SettingsPage variantLabel="QSR" />
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
                comboDefinition={editingItem.menuItemId ? getComboDefinition(editingItem.menuItemId) ?? undefined : undefined}
                draftComboSelections={editDraftComboSelections}
                onComboSelectionsChange={(slotId, selection) => {
                  setEditDraftComboSelections((prev) => ({ ...prev, [slotId]: selection }));
                }}
                getCategoryItems={getCategoryItems}
                getMenuItemById={getMenuItemById}
                editingComboSlotId={editingComboSlotId}
                onBackFromSlotModify={() => setEditingComboSlotId(null)}
                onModifySlot={(slotId) => setEditingComboSlotId(slotId)}
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
              comboDefinition={addComboDef ?? undefined}
              draftComboSelections={addDraftComboSelections}
              onComboSelectionsChange={(slotId, selection) => {
                setAddDraftComboSelections((prev) => ({ ...prev, [slotId]: selection }));
              }}
              getCategoryItems={getCategoryItems}
              getMenuItemById={getMenuItemById}
              editingComboSlotId={editingComboSlotId}
              onBackFromSlotModify={handleAddSlotDone}
              onModifySlot={(slotId) => {
                addSlotSelectionSnapshotRef.current[slotId] = cloneSelection(addDraftComboSelections[slotId]);
                setEditingComboSlotId(slotId);
              }}
            />
          ) : (
            <MenuGridQSR onAddItem={handleMenuItemSelect} />
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
            activeComboSlotId={editingComboSlotId}
            onItemClick={handleItemClick}
            onRequirementClick={handleRequirementClick}
            onEditCancel={handleEditCancel}
            onEditDone={handleEditDone}
            isAddMode={!!addingItem && !isEditingMode}
            addingItemId={addingItem && !isEditingMode ? ADD_DRAFT_ID : null}
            onAddCancel={handleAddCancel}
            onAdd={handleAddAttempt}
            isAddSlotDetailMode={!!addingItem && !isEditingMode && !!editingComboSlotId}
            onAddSlotCancel={handleAddSlotCancel}
            onAddSlotDone={handleAddSlotDone}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            getMenuItemById={getMenuItemById}
            getComboDefinition={getComboDefinition}
          />
          </div>
        </div>
      )}

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Combo onboarding: consecutive category pickers before the add panel */}
      {(() => {
        const currentSlot = onboardingSlotQueue[0];
        if (!onboardingItem || !currentSlot || currentSlot.type !== "category" || !currentSlot.categoryId) return null;
        const allItems = getCategoryItems(currentSlot.categoryId);
        const searchLower = onboardingSearch.trim().toLowerCase();
        const filteredItems = searchLower
          ? allItems.filter((item) => item.name.toLowerCase().includes(searchLower))
          : allItems;
        return (
          <Dialog
            open
            onOpenChange={(open) => { if (!open) handleOnboardingCancel(); }}
          >
            <DialogContent
              className="top-[68px] translate-y-0 w-[664px] max-w-[min(664px,calc(100vw-2rem))] max-h-[calc(100vh-48px)] flex flex-col overflow-hidden rounded-[24px] border-[#e5e5e5] bg-white p-0 shadow-xl"
              showCloseButton={false}
            >
              <div className="relative flex shrink-0 justify-start items-center px-6 pt-6 pb-3">
                <DialogClose
                  className="flex h-12 w-12 shrink-0 items-center justify-center gap-0 rounded-full bg-[#f0f0f0] text-[#101010] active:bg-[#e5e5e5]"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </DialogClose>
                <div className="absolute inset-0 flex flex-col items-center justify-start w-full h-fit gap-0 pt-6 pointer-events-none">
                  <DialogTitle className="text-[20px] font-semibold leading-7 text-[#101010] text-center">
                    {currentSlot.label}
                  </DialogTitle>
                  <p className="mt-0 text-[14px] font-normal text-[#c0392b]">Select 1</p>
                </div>
                <div className="w-12 shrink-0" aria-hidden />
              </div>

              <div className="shrink-0 px-6 pb-0">
                <div className="flex items-center gap-2 rounded-[30px] border border-[#e5e5e5] bg-white px-4 py-3">
                  <Search className="h-5 w-5 shrink-0 text-[#666]" aria-hidden />
                  <input
                    type="search"
                    value={onboardingSearch}
                    onChange={(e) => setOnboardingSearch(e.target.value)}
                    placeholder="Search"
                    className="min-w-0 flex-1 bg-transparent text-[15px] text-[#101010] placeholder:text-[#999] focus:outline-none"
                    aria-label="Search"
                  />
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
                {filteredItems.map((item, index) => {
                  const isLast = index === filteredItems.length - 1;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleOnboardingSelect(currentSlot.slotId, item.id)}
                      className={cn(
                        "flex w-full items-center gap-4 py-3 text-left transition-colors active:bg-[#f5f5f5] border-0",
                        !isLast && "border-b border-b-black/5"
                      )}
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[6px] border border-[#e5e5e5] bg-[#f0f0f0]">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt=""
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-[16px] font-medium text-[#888]">
                            {item.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <span className="min-w-0 flex-1 text-[15px] font-medium text-[#101010] truncate">
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}

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
