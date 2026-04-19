"use client";

import { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { CartItem, MenuItem, ComboDefinition, ComboSlotSelection } from "@/lib/pos-types";
import {
  getModifierGroups,
  isGroupRequirementUnmet,
  getModifierPriceDelta,
  getModifierDisplay,
  hasNestedModifiers,
} from "@/lib/modifiers";
import { FULFILLMENT_METHODS, DISCOUNT_OPTIONS } from "./item-edit-panel";

interface CartItemsProps {
  items: CartItem[];
  editingItemId?: string | null;
  addingItemId?: string | null;
  activeComboSlotId?: string | null;
  activeNestedModifierOptionId?: string | null;
  onItemClick?: (id: string) => void;
  onRequirementClick?: (itemId: string, groupId: string) => void;
  onRemoveItem?: (id: string) => void;
  /** Resolve menu item name for combo selection display; required to show combo items in secondary text. */
  getMenuItemById?: (id: string) => MenuItem | undefined;
  /** Combo definition for menu item; when provided, combo line items are shown in slot order. */
  getComboDefinition?: (menuItemId: string) => ComboDefinition | null;
  /** When true, omit the outer bordered container (e.g. when rendered inside a course container). */
  bare?: boolean;
  /** When true, items without seatId show a "Select Seat" missing requirement. */
  seatingEnabled?: boolean;
}

function CartItemRow({
  item,
  isEditing,
  isDraft,
  isFaded,
  activeComboSlotId,
  activeNestedModifierOptionId,
  onItemClick,
  onRequirementClick,
  onRemove,
  getMenuItemById,
  getComboDefinition,
  seatingEnabled,
}: {
  item: CartItem;
  isEditing: boolean;
  isDraft: boolean;
  isFaded: boolean;
  activeComboSlotId?: string | null;
  activeNestedModifierOptionId?: string | null;
  onItemClick?: (id: string) => void;
  onRequirementClick?: (itemId: string, groupId: string) => void;
  onRemove?: () => void;
  getMenuItemById?: (id: string) => MenuItem | undefined;
  getComboDefinition?: (menuItemId: string) => ComboDefinition | null;
  seatingEnabled?: boolean;
}) {
  const [translateX, setTranslateX] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullSwipeDeleting, setIsFullSwipeDeleting] = useState(false);
  const startXRef = useRef<number | null>(null);
  const didMoveRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastTranslateXRef = useRef(0);

  const REMOVE_WIDTH = 80;
  const SNAP_THRESHOLD = 36;
  const FULL_SWIPE_THRESHOLD = 120;

  const finishSwipe = useCallback(
    (clientX: number) => {
      if (startXRef.current === null) return;
      const totalDelta = clientX - startXRef.current;
      startXRef.current = null;
      setIsDragging(false);

      if (isFullSwipeDeleting) return;

      const currentTx = lastTranslateXRef.current;

      if (currentTx <= -FULL_SWIPE_THRESHOLD && onRemove && containerRef.current) {
        setIsFullSwipeDeleting(true);
        const w = containerRef.current.offsetWidth;
        setTranslateX(-w);
        lastTranslateXRef.current = -w;
        setTimeout(() => onRemove(), 280);
        return;
      }

      let nowOpen: boolean;
      if (isOpen) {
        nowOpen = totalDelta <= SNAP_THRESHOLD;
      } else {
        nowOpen = totalDelta < -SNAP_THRESHOLD;
      }

      setIsOpen(nowOpen);
      const nextTx = nowOpen ? -REMOVE_WIDTH : 0;
      setTranslateX(nextTx);
      lastTranslateXRef.current = nextTx;
    },
    [isOpen, isFullSwipeDeleting, onRemove]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraft || isFullSwipeDeleting) return;
    startXRef.current = e.clientX;
    didMoveRef.current = false;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startXRef.current === null || isFullSwipeDeleting) return;
    const delta = e.clientX - startXRef.current;
    if (Math.abs(delta) > 4) didMoveRef.current = true;
    const maxDrag = containerRef.current
      ? -containerRef.current.offsetWidth
      : -400;
    const base = isOpen ? -REMOVE_WIDTH : 0;
    const next = Math.max(maxDrag, Math.min(0, base + delta));
    setTranslateX(next);
    lastTranslateXRef.current = next;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    finishSwipe(e.clientX);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    finishSwipe(e.clientX);
  };

  const handlePointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startXRef.current !== null) finishSwipe(e.clientX);
  };

  const handleContentClick = () => {
    if (didMoveRef.current) return;
    if (isOpen) {
      setIsOpen(false);
      setTranslateX(0);
      lastTranslateXRef.current = 0;
      return;
    }
    onItemClick?.(item.id);
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    setTranslateX(0);
    lastTranslateXRef.current = 0;
    onRemove?.();
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full rounded-2xl border-[3px] overflow-hidden",
        isEditing || isDraft ? "border-[#101010]" : "border-transparent",
        isFaded ? "opacity-40" : "opacity-100"
      )}
    >
      {/* Remove button — white when at rest; red when swiped; full-width red when full-swipe deleting */}
      {!isDraft && onRemove && (
        <div
          className={cn(
            "absolute right-0 inset-y-0 flex items-center justify-center transition-all duration-200",
            translateX < 0 ? "bg-[#cc0023]" : "bg-white",
            isFullSwipeDeleting ? "w-full" : "w-[80px]"
          )}
        >
          <button
            onClick={handleRemoveClick}
            className="w-full h-full flex items-center justify-center"
          >
            <span
              className={cn(
                "font-semibold text-[15px] transition-colors duration-200",
                translateX < 0 ? "text-white" : "text-[#101010]"
              )}
            >
              Remove
            </span>
          </button>
        </div>
      )}

      {/* Clipping wrapper so white content fills corners and no red bleeds through */}
      <div className="overflow-hidden rounded-2xl pointer-events-none">
        <div
          style={{
            transform: `translateX(${translateX}px)`,
            transition: isDragging ? "none" : "transform 0.2s ease-out",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onPointerLeave={handlePointerLeave}
          onClick={handleContentClick}
          className={cn(
            "relative bg-white min-h-full w-full py-3 px-4 pointer-events-auto",
            !isDraft && onItemClick && "cursor-pointer"
          )}
        >
        {(() => {
          const unitPrice =
            item.price + getModifierPriceDelta(item, item.modifiers ?? [], item.nestedModifierSelections);
          const totalPrice = unitPrice * item.quantity;
          const { variantName, modifierNames } = getModifierDisplay(
            item,
            item.modifiers ?? [],
            item.nestedModifierSelections
          );
          const hasDiscount = (item.discounts?.length ?? 0) > 0;
          const appliedDiscounts =
            item.discounts?.map(
              (id) => DISCOUNT_OPTIONS.find((d) => d.id === id)
            ).filter(Boolean) ?? [];

          return (
            <div className="flex flex-col items-start gap-0 w-full relative">
              {/* Row 1: Item name (wraps) | × quantity | Total price — quantity always between name and price */}
              <div className="flex gap-1 items-start leading-5 text-[16px] w-full">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#101010] break-words leading-[22px]">
                    {item.name}
                  </p>
                </div>
                {item.quantity > 1 && (
                  <p className="font-normal text-[#666] shrink-0">
                    × {item.quantity}
                  </p>
                )}
                <p className="font-normal text-[#101010] text-right shrink-0">
                  ${totalPrice.toFixed(2)}
                </p>
              </div>

              {/* Variant (e.g. 8oz, 12oz) */}
              {variantName && (
                <p className="text-[14px] leading-5 text-[#666] w-full">
                  {variantName}
                </p>
              )}

              {/* Combo selections: compact "item1 (mod1, mod2), item2, item3" when not editing a slot; expanded per-slot lines when editing. Order follows combo slot order when getComboDefinition is provided. */}
              {item.comboSelections &&
                Object.keys(item.comboSelections).length > 0 &&
                getMenuItemById &&
                (() => {
                  const comboDef = item.menuItemId && getComboDefinition ? getComboDefinition(item.menuItemId) : null;
                  const selectionEntries: [string, ComboSlotSelection][] = comboDef
                    ? comboDef.slots
                        .filter((slot) => item.comboSelections![slot.slotId])
                        .map((slot) => [slot.slotId, item.comboSelections![slot.slotId]!])
                    : Object.entries(item.comboSelections!);
                  if (selectionEntries.length === 0) return null;

                  const editingSlot = !!activeComboSlotId;
                  const nestedModifierCartFocus =
                    !!(isEditing || isDraft) &&
                    !isFaded &&
                    editingSlot &&
                    !!activeNestedModifierOptionId;

                  if (!editingSlot) {
                    const parts = selectionEntries.map(([, sel]) => {
                      const slotItem = getMenuItemById!(sel.itemId);
                      const slotName = slotItem?.name ?? sel.itemId;
                      const slotModifiers = sel.modifiers ?? [];
                      const slotDetails = slotItem
                        ? getModifierDisplay(slotItem, slotModifiers, sel.nestedModifierSelections)
                        : { variantName: undefined, modifierNames: [] as string[] };
                      const subParts = [
                        ...(slotDetails.variantName ? [slotDetails.variantName] : []),
                        ...slotDetails.modifierNames,
                      ];
                      return subParts.length > 0 ? `${slotName} (${subParts.join(", ")})` : slotName;
                    });
                    return (
                      <p className="text-[14px] leading-[20px] text-[#666] w-full">
                        {parts.join(", ")}
                      </p>
                    );
                  }

                  return (
                    <div className="w-full flex flex-col">
                      {selectionEntries.map(([slotId, sel]) => {
                        const slotItem = getMenuItemById!(sel.itemId);
                        const slotName = slotItem?.name ?? sel.itemId;
                        const slotModifiers = sel.modifiers ?? [];
                        const nestedSels = sel.nestedModifierSelections ?? {};
                        const slotDetails = slotItem
                          ? getModifierDisplay(slotItem, slotModifiers)
                          : { variantName: undefined, modifierNames: [] as string[] };
                        const isActiveSlot = slotId === activeComboSlotId;
                        const isInactiveWhileEditing = !isActiveSlot;
                        const nestedFocusOnThisSlot =
                          nestedModifierCartFocus && isActiveSlot;

                        const modifierLines: { label: string; optionId?: string; nestedLabels: string[] }[] = [];
                        if (slotDetails.variantName) {
                          modifierLines.push({ label: slotDetails.variantName, nestedLabels: [] });
                        }
                        if (slotItem) {
                          const groups = getModifierGroups(slotItem);
                          for (const modName of slotDetails.modifierNames) {
                            let optionId: string | undefined;
                            const nestedLabels: string[] = [];
                            for (const g of groups) {
                              for (const opt of g.options) {
                                if (opt.name === modName && slotModifiers.includes(opt.id)) {
                                  optionId = opt.id;
                                  if (hasNestedModifiers(opt)) {
                                    const ids = nestedSels[opt.id] ?? [];
                                    for (const ng of opt.nestedGroups!) {
                                      for (const no of ng.options) {
                                        if (ids.includes(no.id)) nestedLabels.push(no.name);
                                      }
                                    }
                                  }
                                  break;
                                }
                              }
                              if (optionId) break;
                            }
                            modifierLines.push({ label: modName, optionId, nestedLabels });
                          }
                        }

                        return (
                          <div key={slotId} className="w-full">
                            <p
                              className={cn(
                                "text-[14px] leading-[18px] w-full",
                                isInactiveWhileEditing
                                  ? "text-[#9b9b9b]"
                                  : nestedFocusOnThisSlot
                                    ? "text-[#9b9b9b]"
                                    : "text-[#101010]"
                              )}
                            >
                              {slotName}
                            </p>
                            {modifierLines.map((line, lineIdx) => {
                              const isVariantLine = lineIdx === 0 && !!slotDetails.variantName;
                              const isFocusedModifierLine =
                                nestedFocusOnThisSlot &&
                                !isVariantLine &&
                                line.optionId === activeNestedModifierOptionId;
                              const lineMutedNestedContext =
                                nestedFocusOnThisSlot && !isVariantLine && !isFocusedModifierLine;
                              const variantMuted = nestedFocusOnThisSlot && isVariantLine;

                              return (
                              <div key={`${slotId}-${line.label}-${lineIdx}`}>
                                <p
                                  className={cn(
                                    "text-[14px] leading-[18px] w-full pl-4",
                                    isInactiveWhileEditing
                                      ? "text-[#b3b3b3]"
                                      : variantMuted || lineMutedNestedContext
                                        ? "text-[#9b9b9b]"
                                        : "text-[#101010]"
                                  )}
                                >
                                  {line.label}
                                </p>
                                {line.nestedLabels.map((nested) => (
                                  <p
                                    key={`${slotId}-${line.label}-${nested}`}
                                    className={cn(
                                      "text-[14px] leading-[18px] w-full pl-8",
                                      isInactiveWhileEditing
                                        ? "text-[#b3b3b3]"
                                        : isFocusedModifierLine
                                          ? "text-[#101010]"
                                          : "text-[#9b9b9b]"
                                    )}
                                  >
                                    {nested}
                                  </p>
                                ))}
                              </div>
                            );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

              {/* Seat label when assigned */}
              {seatingEnabled && item.seatId && (
                <p className="text-[14px] leading-5 text-[#666] w-full">
                  {item.seatId === "table" ? "Table" : item.seatId.replace("seat-", "Seat ")}
                </p>
              )}

              {/* Modifiers (milk, temperature, add-ons) — comma-separated, with nested sub-lines */}
              {modifierNames.length > 0 && (
                <p className="text-[14px] leading-5 text-[#666] w-full">
                  {modifierNames.join(", ")}
                </p>
              )}

              {/* Fulfillment: only when not "For here" */}
              {item.fulfillmentMethod &&
                item.fulfillmentMethod !== "for-here" && (
                  <p className="text-[14px] leading-5 text-[#666] w-full">
                    {
                      FULFILLMENT_METHODS.find(
                        (m) => m.id === item.fulfillmentMethod
                      )?.name
                    }
                  </p>
                )}

              {/* Item note — italic, truncate */}
              {item.note && item.note.trim() && (
                <p className="text-[14px] leading-5 text-[#666] italic truncate w-full max-w-full">
                  {item.note.trim()}
                </p>
              )}

              {/* Discount(s) — "Name (X% off)" */}
              {appliedDiscounts.map((d) =>
                d ? (
                  <p
                    key={d.id}
                    className="text-[14px] leading-5 text-[#666] w-full"
                  >
                    {d.type === "percentage"
                      ? `${d.name} (${d.value}% off)`
                      : `${d.name} ($${d.value} off)`}
                  </p>
                ) : null
              )}

              {/* Original price (strikethrough) when discount applied — aligned with second row */}
              {hasDiscount && (
                <p className="absolute right-4 top-9 text-[14px] leading-5 text-[#666] line-through text-right">
                  ${(unitPrice * item.quantity).toFixed(2)}
                </p>
              )}

              {/* Incomplete required selections (modifiers + combo slots) */}
              {(() => {
                const unmetGroups = getModifierGroups(item).filter((g) =>
                  isGroupRequirementUnmet(g, item.modifiers ?? [])
                );

                const comboDef = item.menuItemId && getComboDefinition
                  ? getComboDefinition(item.menuItemId)
                  : null;
                const unmetSlots = comboDef
                  ? comboDef.slots.filter(
                      (slot) =>
                        slot.type === "category" &&
                        !item.comboSelections?.[slot.slotId]?.itemId
                    )
                  : [];

                // Missing modifier requirements on individual items inside the combo (e.g. spice level on 3 Tenders).
                const unmetComboSlotModifierGroups: { slotId: string; slotLabel: string; group: { id: string; name: string; minSelect?: number } }[] = [];
                if (comboDef && getMenuItemById && item.comboSelections) {
                  for (const slot of comboDef.slots) {
                    const sel = item.comboSelections[slot.slotId];
                    if (!sel?.itemId) continue;
                    const menuItem = getMenuItemById(sel.itemId);
                    if (!menuItem) continue;
                    const groups = getModifierGroups(menuItem);
                    for (const group of groups) {
                      if (isGroupRequirementUnmet(group, sel.modifiers ?? [])) {
                        unmetComboSlotModifierGroups.push({
                          slotId: slot.slotId,
                          slotLabel: slot.label,
                          group: { id: group.id, name: group.name, minSelect: group.minSelect },
                        });
                      }
                    }
                  }
                }

                const missingSeat = seatingEnabled && !item.seatId;

                if (
                  unmetGroups.length === 0 &&
                  unmetSlots.length === 0 &&
                  unmetComboSlotModifierGroups.length === 0 &&
                  !missingSeat
                )
                  return null;

                const totalCount =
                  unmetGroups.length +
                  unmetSlots.length +
                  unmetComboSlotModifierGroups.length +
                  (missingSeat ? 1 : 0);
                let runningIndex = 0;

                return (
                  <div className="flex flex-wrap items-center gap-x-1 text-[12px] font-semibold text-[#005ad9] w-full">
                    {missingSeat && (() => {
                      const idx = runningIndex++;
                      return (
                        <span key="__seat__" className="inline-flex items-center">
                          <button
                            type="button"
                            onPointerDown={(e) => { e.stopPropagation(); }}
                            onPointerMove={(e) => { e.stopPropagation(); }}
                            onPointerUp={(e) => { e.stopPropagation(); }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onRequirementClick?.(item.id, "__seat__");
                            }}
                            className="p-0 m-0 border-0 bg-transparent text-inherit font-inherit leading-[16px] appearance-none cursor-pointer"
                          >
                            Select Seat
                          </button>
                          {idx < totalCount - 1 && <span>,</span>}
                        </span>
                      );
                    })()}
                    {unmetGroups.map((group) => {
                      const idx = runningIndex++;
                      return (
                        <span key={group.id} className="inline-flex items-center">
                          <button
                            type="button"
                            onPointerDown={(e) => {
                              e.stopPropagation();
                            }}
                            onPointerMove={(e) => {
                              e.stopPropagation();
                            }}
                            onPointerUp={(e) => {
                              e.stopPropagation();
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onRequirementClick?.(item.id, group.id);
                            }}
                            className="p-0 m-0 border-0 bg-transparent text-inherit font-inherit leading-[16px] appearance-none cursor-pointer"
                          >
                            Select {group.minSelect} {group.name}
                          </button>
                            {idx < totalCount - 1 && <span>,</span>}
                        </span>
                      );
                    })}
                    {unmetComboSlotModifierGroups.map(({ slotId, slotLabel, group }) => {
                      const idx = runningIndex++;
                      const compositeGroupId = `__combo__:${slotId}:${group.id}`;
                      return (
                        <span key={`${slotId}:${group.id}`} className="inline-flex items-center">
                          <button
                            type="button"
                            onPointerDown={(e) => {
                              e.stopPropagation();
                            }}
                            onPointerMove={(e) => {
                              e.stopPropagation();
                            }}
                            onPointerUp={(e) => {
                              e.stopPropagation();
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onRequirementClick?.(item.id, compositeGroupId);
                            }}
                            className="p-0 m-0 border-0 bg-transparent text-inherit font-inherit leading-[16px] appearance-none cursor-pointer"
                          >
                            Select {group.minSelect ?? 1} {group.name}
                          </button>
                          {idx < totalCount - 1 && <span>,</span>}
                        </span>
                      );
                    })}
                    {unmetSlots.map((slot) => {
                      const idx = runningIndex++;
                      return (
                        <span key={slot.slotId} className="inline-flex items-center">
                          <span>Select 1 {slot.label}</span>
                          {idx < totalCount - 1 && <span>,</span>}
                        </span>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          );
        })()}
      </div>
      </div>
    </div>
  );
}

export function CartItems({
  items,
  editingItemId,
  addingItemId,
  activeComboSlotId,
  activeNestedModifierOptionId,
  onItemClick,
  onRequirementClick,
  onRemoveItem,
  getMenuItemById,
  getComboDefinition,
  bare,
  seatingEnabled,
}: CartItemsProps) {
  const hasEditingItem = editingItemId != null;
  const hasAddingItem = addingItemId != null;

  return (
    <div className={bare ? "" : "rounded-2xl border border-[#e5e5e5] bg-[#ffffff] p-0"}>
      {items.length === 0 ? (
        <div className="flex items-center justify-center h-20 text-[#959595]">
          No items in cart
        </div>
      ) : (
        <div className="flex flex-col gap-0">
          {items.map((item) => {
            const isEditing = editingItemId === item.id;
            const isDraft = addingItemId === item.id;
            const isFaded = (hasEditingItem && !isEditing) || (hasAddingItem && !isDraft);
            return (
              <CartItemRow
                key={item.id}
                item={item}
                isEditing={isEditing}
                isDraft={isDraft}
                isFaded={isFaded}
                activeComboSlotId={activeComboSlotId}
                activeNestedModifierOptionId={activeNestedModifierOptionId}
                onItemClick={!isDraft && onItemClick ? onItemClick : undefined}
                onRequirementClick={onRequirementClick}
                onRemove={!isDraft && onRemoveItem ? () => onRemoveItem(item.id) : undefined}
                getMenuItemById={getMenuItemById}
                getComboDefinition={getComboDefinition}
                seatingEnabled={seatingEnabled}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
