"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { AlertCircle, CheckCircle, X } from "lucide-react";
import { StatusBar } from "@/components/pos/status-bar";
import { MenuGridFSR } from "@/components/pos-fsr/menu-grid";
import { CourseCartSection } from "@/components/pos-fsr/course-cart-section";
import { ItemEditPanel, type DraftItemOptions } from "@/components/pos/item-edit-panel";
import { ItemAddPanel } from "@/components/pos/item-add-panel";
import { BottomNavigation } from "@/components/pos/bottom-navigation";
import { SettingsPage } from "@/components/pos/settings-page";
import { ChargeScreen } from "@/components/pos/charge-screen";
import type { CartItem, MenuItem, SentBatch, SentCourseGroup, NavItem, MenuId } from "@/lib/pos-types";
import { FSR_COURSES } from "@/lib/pos-types";
import {
  getDefaultModifiers,
  getModifierPriceDelta,
} from "@/lib/modifiers";
import { cartHasIncompleteItems } from "@/lib/cart-validation";
import { getMenuItemByIdFSR, rootTilesFSR } from "@/lib/menu-library-fsr";
import { getMenuItemById, getComboDefinition, rootTilesQSR } from "@/lib/menu-library-qsr";
import { MenuSwitcherSheet } from "@/components/pos/menu-switcher-sheet";

const TAX_RATE = 0.05;
const ADD_DRAFT_ID = "__draft_add__";
const DEFAULT_COVER_COUNT = 4;

/** Seat option for "add to table" (shared items). Always shown first in seating grid. */
const TABLE_SEAT_OPTION = { id: "table", label: "Table" } as const;

function buildSeatOptions(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `seat-${i + 1}`,
    label: `Seat ${i + 1}`,
  }));
}

export function POSScreenFSR() {
  const [activeTab, setActiveTab] = useState<NavItem>("checkout");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [sentBatches, setSentBatches] = useState<SentBatch[]>([]);
  const [activeCourseId, setActiveCourseId] = useState("apps");
  const [courseHolds, setCourseHolds] = useState<Record<string, boolean>>({
    "straight-fire": false,
    apps: false,
    mains: true,
    desserts: true,
  });

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

  const [coverCount, setCoverCount] = useState(DEFAULT_COVER_COUNT);
  const seatOptions = [TABLE_SEAT_OPTION, ...buildSeatOptions(coverCount)];

  const handleAddSeat = useCallback(() => {
    setCoverCount((c) => c + 1);
  }, []);
  const [addDraftSeatId, setAddDraftSeatId] = useState<string | null>(null);
  const [editDraftSeatId, setEditDraftSeatId] = useState<string | null>(null);

  const [addToastMessage, setAddToastMessage] = useState<string | null>(null);
  const [updateToastMessage, setUpdateToastMessage] = useState<string | null>(null);
  const [addScrollSignal, setAddScrollSignal] = useState<{ groupId: string; nonce: number } | null>(null);
  const [editScrollSignal, setEditScrollSignal] = useState<{ groupId: string; nonce: number } | null>(null);

  const activeToast = addToastMessage ?? updateToastMessage;
  const [toastVisible, setToastVisible] = useState(false);
  const toastRafRef = useRef<number | null>(null);
  const isEditingMode = editingItemId != null;

  const [activeMenuId, setActiveMenuId] = useState<MenuId>("dinner");
  const [menuSheetOpen, setMenuSheetOpen] = useState(false);
  const rootTilesForGrid = activeMenuId === "dinner" ? rootTilesFSR : rootTilesQSR;
  const getMenuItemByIdResolved = activeMenuId === "dinner" ? getMenuItemByIdFSR : getMenuItemById;
  const menuLabel = activeMenuId === "dinner" ? "Dinner" : "Lunch";

  useEffect(() => {
    if (activeToast) {
      toastRafRef.current = requestAnimationFrame(() => {
        toastRafRef.current = requestAnimationFrame(() => setToastVisible(true));
      });
    } else {
      setToastVisible(false);
    }
    return () => {
      if (toastRafRef.current != null) cancelAnimationFrame(toastRafRef.current);
    };
  }, [activeToast]);

  useEffect(() => {
    if (!activeToast) return;
    const t = setTimeout(() => { setAddToastMessage(null); setUpdateToastMessage(null); }, 4000);
    return () => clearTimeout(t);
  }, [activeToast]);

  const draftCartItem: CartItem | null =
    addingItem && !isEditingMode
      ? {
          id: ADD_DRAFT_ID,
          name: addingItem.name,
          price: addingItem.price,
          quantity: addDraftQuantity,
          description: addingItem.description,
          modifiers: addDraftModifiers.length ? addDraftModifiers : undefined,
          courseId: activeCourseId,
          seatId: addDraftSeatId ?? undefined,
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
          seatId: editDraftSeatId ?? undefined,
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
    setEditingItemId(null);
    setEditScrollSignal(null);
    setAddingItem(item);
    setAddDraftQuantity(1);
    setAddDraftModifiers(getDefaultModifiers(item));
    setAddDraftSeatId(null);
    setAddDraftOptions({ note: "", fulfillmentMethod: "for-here", taxes: [], discounts: [], serviceCharges: [] });
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
        courseId: activeCourseId,
        seatId: addDraftSeatId ?? undefined,
      },
    ]);
    setAddingItem(null);
    setAddDraftSeatId(null);
  }, [addingItem, addDraftQuantity, addDraftModifiers, addDraftOptions, activeCourseId, addDraftSeatId]);

  const handleAddCancel = useCallback(() => {
    setAddingItem(null);
    setAddDraftSeatId(null);
    setAddToastMessage(null);
    setAddScrollSignal(null);
  }, []);

  const handleItemClick = useCallback(
    (id: string) => {
      if (editingItemId && editingItemId !== id) {
        const prevItem = cartItems.find((i) => i.id === editingItemId);
        setCartItems((prev) => prev.map((ci) => ci.id === editingItemId ? { ...ci, quantity: draftQuantity, modifiers: draftModifiers, note: draftOptions.note || undefined, fulfillmentMethod: draftOptions.fulfillmentMethod, taxes: draftOptions.taxes, discounts: draftOptions.discounts, serviceCharges: draftOptions.serviceCharges, seatId: editDraftSeatId ?? undefined } : ci));
        if (prevItem) { setUpdateToastMessage(`${prevItem.name} updated.`); }
      }
      const item = cartItems.find((i) => i.id === id);
      if (!item) return;

      if (addingItem) {
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
            courseId: activeCourseId,
            seatId: addDraftSeatId ?? undefined,
          },
        ]);
        setUpdateToastMessage(`${addingItem.name} added.`);
      }

      setAddingItem(null);
      setAddDraftSeatId(null);
      setAddToastMessage(null);
      setAddScrollSignal(null);
      setEditingItemId(id);
      setEditScrollSignal(null);
      setDraftQuantity(item.quantity);
      setDraftModifiers(item.modifiers?.length ? item.modifiers : getDefaultModifiers(item));
      setEditDraftSeatId(item.seatId ?? null);
      setDraftOptions({
        note: item.note ?? "",
        fulfillmentMethod: item.fulfillmentMethod ?? "for-here",
        taxes: item.taxes ?? [],
        discounts: item.discounts ?? [],
        serviceCharges: item.serviceCharges ?? [],
      });
    },
    [cartItems, editingItemId, draftQuantity, draftModifiers, draftOptions, editDraftSeatId, addingItem, addDraftQuantity, addDraftModifiers, addDraftOptions, activeCourseId, addDraftSeatId]
  );

  const handleRequirementClick = useCallback(
    (itemId: string, groupId: string) => {
      if (addingItem && itemId === ADD_DRAFT_ID) {
        setAddScrollSignal({ groupId, nonce: Date.now() });
        return;
      }
      const item = cartItems.find((i) => i.id === itemId);
      if (!item) return;

      if (addingItem) {
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
            courseId: activeCourseId,
            seatId: addDraftSeatId ?? undefined,
          },
        ]);
        setUpdateToastMessage(`${addingItem.name} added.`);
      }

      setAddingItem(null);
      setAddDraftSeatId(null);
      setAddToastMessage(null);
      setAddScrollSignal(null);
      if (editingItemId !== itemId) {
        setEditingItemId(itemId);
        setDraftQuantity(item.quantity);
        setDraftModifiers(item.modifiers?.length ? item.modifiers : getDefaultModifiers(item));
        setEditDraftSeatId(item.seatId ?? null);
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
    [addingItem, cartItems, editingItemId, addDraftQuantity, addDraftModifiers, addDraftOptions, activeCourseId, addDraftSeatId]
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
              seatId: editDraftSeatId ?? undefined,
            }
          : item
      )
    );
    setEditingItemId(null);
    setEditScrollSignal(null);
  }, [editingItemId, draftQuantity, draftModifiers, draftOptions, editDraftSeatId]);

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
    if (editingItemId === id) {
      setEditingItemId(null);
    }
  }, [editingItemId]);

  const handleClearCart = useCallback(() => {
    setCartItems([]);
    setEditingItemId(null);
    setAddingItem(null);
  }, []);

  const handleCourseHoldToggle = useCallback((courseId: string) => {
    setCourseHolds((prev) => ({ ...prev, [courseId]: !prev[courseId] }));
  }, []);

  const handleActiveCourseChange = useCallback((courseId: string) => {
    setActiveCourseId(courseId);
    setEditingItemId(null);
    setEditScrollSignal(null);
    setAddingItem(null);
    setAddToastMessage(null);
    setAddScrollSignal(null);
  }, []);

  const handleSend = useCallback(() => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

    // Only send items from courses that are not on Hold (fire = send; hold = keep in cart)
    const itemsToSend = cartItems.filter((item) => {
      const cid = item.courseId ?? "straight-fire";
      const course = FSR_COURSES.find((c) => c.id === cid);
      if (!course?.holdable) return true; // straight-fire or non-holdable: always send
      return !courseHolds[cid]; // holdable: send only if not held
    });
    const itemIdsToRemove = new Set(itemsToSend.map((i) => i.id));

    if (itemsToSend.length === 0) return;

    const grouped = new Map<string, CartItem[]>();
    for (const item of itemsToSend) {
      const cid = item.courseId ?? "straight-fire";
      if (!grouped.has(cid)) grouped.set(cid, []);
      grouped.get(cid)!.push(item);
    }

    const groups: SentCourseGroup[] = FSR_COURSES
      .filter((c) => grouped.has(c.id))
      .map((c) => ({
        courseId: c.id,
        courseLabel: c.label,
        firedAt: timeStr,
        firedBy: "You",
        items: grouped.get(c.id)!,
      }));

    const batch: SentBatch = { id: `batch-${Date.now()}`, groups };
    setSentBatches((prev) => [...prev, batch]);
    setCartItems((prev) => prev.filter((item) => !itemIdsToRemove.has(item.id)));
    if (editingItemId && itemIdsToRemove.has(editingItemId)) setEditingItemId(null);
    setAddingItem(null);
  }, [cartItems, courseHolds, editingItemId]);

  const handlePrint = useCallback(() => {
    console.log("Printing...", cartItems);
  }, [cartItems]);

  const [showChargeScreen, setShowChargeScreen] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const handlePay = useCallback(() => {
    if (
      cartHasIncompleteItems(displayItems, {
        getComboDefinition,
        getMenuItemById: getMenuItemByIdResolved,
        seatingEnabled: true,
      })
    ) {
      setAddToastMessage("Make required selections to continue.");
      return;
    }
    setShowChargeScreen(true);
  }, [displayItems, getMenuItemByIdResolved]);

  const editingItem = cartItems.find((i) => i.id === editingItemId) ?? null;

  return (
    <div className="relative flex flex-col h-full w-full bg-black">
      <StatusBar />

      <div className="flex-1 min-h-0 relative flex flex-col">
        {activeTab === "more" ? (
          <SettingsPage variantLabel="FSR" onLoadingChange={setSettingsLoading} />
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
                  seats={seatOptions}
                  draftSeatId={editDraftSeatId}
                  onSeatChange={setEditDraftSeatId}
                  onAddSeat={handleAddSeat}
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
                  seats={seatOptions}
                  draftSeatId={addDraftSeatId}
                  onSeatChange={setAddDraftSeatId}
                  onAddSeat={handleAddSeat}
                />
              ) : (
                <MenuGridFSR
                  onAddItem={handleMenuItemSelect}
                  rootTiles={rootTilesForGrid}
                  menuLabel={menuLabel}
                  onOpenMenuSwitcher={() => setMenuSheetOpen(true)}
                />
              )}
            </div>

            <div className="w-[320px] flex-shrink-0">
              <CourseCartSection
                items={displayItems}
                activeCourseId={activeCourseId}
                onActiveCourseChange={handleActiveCourseChange}
                courseHolds={courseHolds}
                onCourseHoldToggle={handleCourseHoldToggle}
                editingItemId={editingItemId}
                onItemClick={handleItemClick}
                onRequirementClick={handleRequirementClick}
                onEditCancel={handleEditCancel}
                onEditDone={handleEditDone}
                isAddMode={!!addingItem && !isEditingMode}
                addingItemId={addingItem && !isEditingMode ? ADD_DRAFT_ID : null}
                onAddCancel={handleAddCancel}
                onAdd={handleAddConfirm}
                onRemoveItem={handleRemoveCartItem}
                onClearCart={handleClearCart}
                onSend={handleSend}
                onPrint={handlePrint}
                onPay={handlePay}
                getMenuItemById={getMenuItemByIdResolved}
                coverCount={coverCount}
                seatingEnabled
                sentBatches={sentBatches}
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

      <MenuSwitcherSheet
        open={menuSheetOpen}
        onOpenChange={setMenuSheetOpen}
        selectedMenuId={activeMenuId}
        onSelect={(menuId) => {
          setActiveMenuId(menuId);
          setMenuSheetOpen(false);
        }}
      />

      {activeToast && (
        <div
          className="absolute left-1/2 z-50 w-[600px] max-w-[calc(100%-32px)] transition-transform duration-300 ease-out"
          style={{
            bottom: "78px",
            transform: `translateX(-50%) translateY(${toastVisible ? "0" : "200%"})`,
          }}
        >
          <div className={`flex items-center gap-3 px-4 py-4 rounded-[16px] shadow-xl ${addToastMessage ? "bg-[#cc0023]" : "bg-[#232323]"}`}>
            {addToastMessage ? <AlertCircle className="w-6 h-6 text-white shrink-0" /> : <CheckCircle className="w-6 h-6 text-[#00a63e] shrink-0" />}
            <p className="flex-1 text-[16px] text-white leading-6">{activeToast}</p>
            <button onClick={() => { setAddToastMessage(null); setUpdateToastMessage(null); }} className="shrink-0">
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
