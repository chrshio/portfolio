"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, Search, Check } from "lucide-react";
import type { MenuItem } from "@/lib/pos-types";
import type { ComboDefinition, ComboSlotSelection, ComboSlot } from "@/lib/pos-types";
import {
  type ModifierGroup,
  getModifierGroups,
  computeNewModifiers,
  isGroupRequirementUnmet,
  getModifierDisplay,
} from "@/lib/modifiers";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

/** Secondary line for category picker: variant (e.g. "Small (+$1.00)") and/or slot price adjustment (e.g. "+$3.00"). */
function getCategoryItemSecondaryText(item: MenuItem, slot: ComboSlot): string | null {
  const parts: string[] = [];
  const groups = getModifierGroups(item);
  const variations = groups.find((g) => g.id === "variations");
  if (variations?.options.length) {
    const first = variations.options[0];
    if (first?.price != null && first.price > 0) {
      parts.push(`${first.name} (+$${first.price.toFixed(2)})`);
    }
  }
  const adjustment = slot.itemPriceAdjustments?.[item.id];
  if (adjustment != null && adjustment > 0) {
    parts.push(`+$${adjustment.toFixed(2)}`);
  }
  return parts.length ? parts.join(", ") : null;
}

/** Build one-line summary of selected modifiers/variant for combo slot secondary text. */
function getSlotModifierSummary(item: MenuItem, modifierIds: string[]): string | null {
  if (modifierIds.length === 0) return null;
  const { variantName, modifierNames } = getModifierDisplay(item, modifierIds);
  const parts = [...(variantName ? [variantName] : []), ...modifierNames];
  return parts.length ? parts.join(", ") : null;
}

/** Row component. When selectedItem is set: photo + item name left, gray Modify pill right (Figma 319388). When no selection: gray box left, category name, Select button right (Figma 319389-99336). */
function ComboSlotRow({
  label,
  value,
  valueMuted,
  showModify,
  showSub,
  slotId,
  onModifySlot,
  isExpanded,
  onClick,
  selectedItem,
  /** Variant/modifier summary for the selected slot item (e.g. "Mild, No Coleslaw"). Shown as secondary text. */
  slotItemSecondaryText,
  /** When true, show a blue dot badge on the Select button (category slot with no selection). */
  showSelectBadge,
  /** When true, show a blue dot badge on the Modify button to indicate missing requirement. */
  hasUnmetRequirement,
}: {
  label: string;
  value: string;
  valueMuted?: boolean;
  showModify?: boolean;
  /** When true, show Sub button to the left of Modify (category slots only). */
  showSub?: boolean;
  slotId: string;
  /** When provided and user taps Modify, open left panel to edit this slot's item. */
  onModifySlot?: (slotId: string) => void;
  isExpanded: boolean;
  onClick: () => void;
  /** When set, show item photo + name left, gray Modify button right. When null, show gray placeholder + Select button. */
  selectedItem?: MenuItem | null;
  /** Variant/modifier summary for the selected slot item. Shown as secondary text below the item name. */
  slotItemSecondaryText?: string | null;
  /** When true, show a blue dot badge on the Select button. */
  showSelectBadge?: boolean;
  /** When true, show a blue dot badge on the Modify button. */
  hasUnmetRequirement?: boolean;
}) {
  const hasItemLayout = selectedItem != null;
  const showSubAndModify = hasItemLayout && showModify && showSub;
  const handleModify = (e: React.MouseEvent) => {
    e.stopPropagation();
    onModifySlot?.(slotId);
  };

  if (showSubAndModify) {
    return (
      <div className="flex w-full items-center gap-4 py-[16px] text-left">
        <button
          type="button"
          onClick={onClick}
          className="flex min-w-0 flex-1 items-center gap-4 text-left"
        >
          <div className="flex shrink-0 items-center justify-center overflow-hidden rounded-[6px] size-10 border border-[#e5e5e5] bg-[#f0f0f0]">
            {selectedItem!.image ? (
              <Image
                src={selectedItem!.image}
                alt=""
                width={40}
                height={40}
                className="size-full object-cover"
              />
            ) : (
              <span className="text-[14px] font-medium text-[#888]">
                {selectedItem!.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-0">
            <span className="text-[16px] font-medium leading-6 text-[#101010] truncate">
              {selectedItem!.name}
            </span>
            {slotItemSecondaryText && (
              <span className="text-[13px] text-[#666] leading-5 truncate mt-0.5">
                {slotItemSecondaryText}
              </span>
            )}
          </div>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="shrink-0 rounded-full bg-[#f0f0f0] px-4 py-2 min-h-[40px] flex items-center justify-center active:bg-[#e5e5e5]"
        >
          <span className="text-[14px] font-medium text-[#101010]">Sub</span>
        </button>
        <span className="relative inline-flex shrink-0">
          <button
            type="button"
            onClick={handleModify}
            className="rounded-full bg-[#f0f0f0] px-4 py-2 min-h-[40px] flex items-center justify-center active:bg-[#e5e5e5]"
          >
            <span className="text-[14px] font-medium text-[#101010]">Modify</span>
          </button>
          {hasUnmetRequirement && (
            <span
              className="absolute right-0 top-0 size-2.5 rounded-full bg-[#007bff] ring-4 ring-white"
              aria-hidden
            />
          )}
        </span>
      </div>
    );
  }

  if (hasItemLayout && showModify && onModifySlot) {
    return (
      <div className="flex w-full items-center gap-4 py-[16px] text-left">
        <button
          type="button"
          onClick={onClick}
          className="flex min-w-0 flex-1 items-center gap-4 text-left"
        >
          <div className="flex shrink-0 items-center justify-center overflow-hidden rounded-[6px] size-10 border border-[#e5e5e5] bg-[#f0f0f0]">
            {selectedItem!.image ? (
              <Image
                src={selectedItem!.image}
                alt=""
                width={40}
                height={40}
                className="size-full object-cover"
              />
            ) : (
              <span className="text-[14px] font-medium text-[#888]">
                {selectedItem!.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-0">
            <span className="text-[16px] font-medium leading-6 text-[#101010] truncate">
              {selectedItem!.name}
            </span>
            {slotItemSecondaryText && (
              <span className="text-[13px] text-[#666] leading-5 truncate mt-0.5">
                {slotItemSecondaryText}
              </span>
            )}
          </div>
        </button>
        <span className="relative inline-flex shrink-0">
          <button
            type="button"
            onClick={handleModify}
            className="rounded-full bg-[#f0f0f0] px-4 py-2 min-h-[40px] flex items-center justify-center active:bg-[#e5e5e5]"
          >
            <span className="text-[14px] font-medium text-[#101010]">Modify</span>
          </button>
          {hasUnmetRequirement && (
            <span
              className="absolute right-0 top-0 size-2.5 rounded-full bg-[#007bff] ring-4 ring-white"
              aria-hidden
            />
          )}
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 py-[16px] text-left"
    >
      {hasItemLayout ? (
        <>
          <div className="flex shrink-0 items-center justify-center overflow-hidden rounded-[6px] size-10 border border-[#e5e5e5] bg-[#f0f0f0]">
            {selectedItem.image ? (
              <Image
                src={selectedItem.image}
                alt=""
                width={40}
                height={40}
                className="size-full object-cover"
              />
            ) : (
              <span className="text-[14px] font-medium text-[#888]">
                {selectedItem.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-0">
            <span className="text-[16px] font-medium leading-6 text-[#101010] truncate">
              {selectedItem.name}
            </span>
            {slotItemSecondaryText && (
              <span className="text-[13px] text-[#666] leading-5 truncate mt-0.5">
                {slotItemSecondaryText}
              </span>
            )}
          </div>
          {showModify && (
            <div className="shrink-0 rounded-full bg-[#f0f0f0] px-4 py-2 min-h-[40px] flex items-center justify-center">
              <span className="text-[14px] font-medium text-[#101010]">Modify</span>
            </div>
          )}
        </>
      ) : (
        <>
          {/* No selection: gray box with category initial (same logic as selected row when no photo) */}
          <div className="flex shrink-0 items-center justify-center overflow-hidden rounded-[6px] size-10 border border-[#e5e5e5] bg-[#f0f0f0]">
            <span className="text-[14px] font-medium text-[#888]">
              {(value || label).charAt(0)}
            </span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-0">
            <span className="text-[16px] font-medium leading-6 text-[#101010] truncate">
              {value}
            </span>
          </div>
          {/* Select button right */}
          <span className="relative inline-flex shrink-0">
            <div className="rounded-full bg-[#f0f0f0] px-4 py-2 min-h-[40px] flex items-center justify-center">
              <span className="text-[14px] font-medium text-[#101010]">Select</span>
            </div>
            {showSelectBadge && (
              <span
                className="absolute right-0 top-0 size-2.5 rounded-full bg-[#007bff] ring-4 ring-white"
                aria-hidden
              />
            )}
          </span>
        </>
      )}
    </button>
  );
}

interface ComboSectionProps {
  comboDefinition: ComboDefinition;
  selections: Record<string, ComboSlotSelection>;
  onSelectionsChange: (slotId: string, selection: ComboSlotSelection) => void;
  /** When provided, Modify button opens left panel to edit this slot's item. */
  onModifySlot?: (slotId: string) => void;
  getCategoryItems: (categoryId: string) => MenuItem[];
  getMenuItemById: (itemId: string) => MenuItem | undefined;
}

export function ComboSection({
  comboDefinition,
  selections,
  onSelectionsChange,
  onModifySlot,
  getCategoryItems,
  getMenuItemById,
}: ComboSectionProps) {
  const [expandedSlotId, setExpandedSlotId] = useState<string | null>(null);
  const [categoryPickerSlotId, setCategoryPickerSlotId] = useState<string | null>(null);
  const [categoryPickerSearch, setCategoryPickerSearch] = useState("");

  // Reset search when modal closes
  useEffect(() => {
    if (!categoryPickerSlotId) setCategoryPickerSearch("");
  }, [categoryPickerSlotId]);

  const handleModifierSelect = (slotId: string, itemId: string, group: ModifierGroup, optionId: string) => {
    const current = selections[slotId]?.modifiers ?? [];
    const next = computeNewModifiers(group, optionId, current);
    onSelectionsChange(slotId, { itemId, modifiers: next });
  };

  return (
    <>
      <div className="flex items-center gap-2 min-h-[40px] py-2">
        <span className="text-[14px] font-medium text-[#101010]">Items</span>
      </div>

      {/* Three rows — match Figma (Live-Cart 319386-95904): bordered list, same row pattern */}
      <div className="overflow-hidden mb-2">
        {comboDefinition.slots.map((slot) => {
          const selection = selections[slot.slotId];
          const isExpanded = expandedSlotId === slot.slotId;
          const isPickerOpen = categoryPickerSlotId === slot.slotId;

          if (slot.type === "fixed" && slot.itemId) {
            const menuItem = getMenuItemById(slot.itemId);
            const displayName = menuItem?.name ?? slot.itemId;
            const modifierGroups = menuItem ? getModifierGroups(menuItem) : [];
            const slotModifiers = selection?.modifiers ?? [];
            const hasUnmetRequirement = modifierGroups.some((g) =>
              isGroupRequirementUnmet(g, slotModifiers)
            );

            const slotModifierSummary = menuItem
              ? getSlotModifierSummary(menuItem, slotModifiers)
              : null;

            return (
              <div key={slot.slotId} className="border-b border-[#f0f0f0] last:border-b-0">
                <ComboSlotRow
                  label={slot.label}
                  value={displayName}
                  valueMuted
                  showModify
                  slotId={slot.slotId}
                  onModifySlot={onModifySlot}
                  isExpanded={isExpanded}
                  onClick={() => setExpandedSlotId(isExpanded ? null : slot.slotId)}
                  selectedItem={menuItem}
                  slotItemSecondaryText={slotModifierSummary}
                  hasUnmetRequirement={hasUnmetRequirement}
                />
                {isExpanded && menuItem && modifierGroups.length > 0 && (
                  <div className="px-4 py-3 bg-[#fafafa]">
                    {modifierGroups.map((group) => (
                      <div key={group.id} className="mb-3 last:mb-0">
                        <span className="text-[12px] font-medium text-[#666] block mb-1.5">
                          {group.name}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {group.options.map((option) => {
                            const isSelected = slotModifiers.includes(option.id);
                            return (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => handleModifierSelect(slot.slotId, slot.itemId!, group, option.id)}
                                className={cn(
                                  "px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors",
                                  isSelected
                                    ? "bg-[#101010] text-white"
                                    : "bg-[#f0f0f0] text-[#101010]"
                                )}
                              >
                                {option.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          if (slot.type === "category" && slot.categoryId) {
            const categoryItems = getCategoryItems(slot.categoryId);
            const selectedItem = selection?.itemId
              ? getMenuItemById(selection.itemId)
              : null;
            // When no selection: show category name (e.g. "Side", "Drink"); when selected: show item name (e.g. "Fries")
            const displayName = selectedItem?.name ?? slot.label;
            const slotModifiers = selection?.modifiers ?? [];
            const categoryModifierGroups = selectedItem ? getModifierGroups(selectedItem) : [];
            const hasUnmetRequirement = categoryModifierGroups.some((g) =>
              isGroupRequirementUnmet(g, slotModifiers)
            );
            const categorySlotModifierSummary =
              selectedItem && slotModifiers.length > 0
                ? getSlotModifierSummary(selectedItem, slotModifiers)
                : null;

            return (
              <div key={slot.slotId} className="border-b border-[#f0f0f0] last:border-b-0">
                <ComboSlotRow
                  label={slot.label}
                  value={displayName}
                  valueMuted={!selectedItem}
                  showModify={!!selectedItem}
                  showSub={!!selectedItem}
                  slotId={slot.slotId}
                  onModifySlot={onModifySlot}
                  isExpanded={isPickerOpen}
                  onClick={() => setCategoryPickerSlotId(isPickerOpen ? null : slot.slotId)}
                  selectedItem={selectedItem ?? undefined}
                  slotItemSecondaryText={categorySlotModifierSummary}
                  showSelectBadge={!selectedItem}
                  hasUnmetRequirement={hasUnmetRequirement}
                />
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Category picker modal — matches Figma: close top-left, centered title, "Select 1" red, search, circular thumbnails + name */}
      {(() => {
        const slot = categoryPickerSlotId
          ? comboDefinition.slots.find(
              (s) => s.type === "category" && s.slotId === categoryPickerSlotId
            )
          : null;
        if (!slot || slot.type !== "category" || !slot.categoryId) return null;
        const allItems = getCategoryItems(slot.categoryId);
        const searchLower = categoryPickerSearch.trim().toLowerCase();
        const categoryItems = searchLower
          ? allItems.filter((item) => item.name.toLowerCase().includes(searchLower))
          : allItems;
        const selection = selections[slot.slotId];
        return (
          <Dialog
            open={!!categoryPickerSlotId}
            onOpenChange={(open) => !open && setCategoryPickerSlotId(null)}
          >
            <DialogContent
              className="top-[68px] translate-y-0 w-[664px] max-w-[min(664px,calc(100vw-2rem))] max-h-[calc(100vh-48px)] flex flex-col overflow-hidden rounded-[24px] border-[#e5e5e5] bg-white p-0 shadow-xl"
              showCloseButton={false}
            >
              {/* Header: close left, title centered, "Select 1" red */}
              <div className="relative flex shrink-0 justify-start items-center px-6 pt-6 pb-3">
                <DialogClose
                  className="flex h-12 w-12 shrink-0 items-center justify-center gap-0 rounded-full bg-[#f0f0f0] text-[#101010] active:bg-[#e5e5e5]"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </DialogClose>
                <div className="absolute inset-0 flex flex-col items-center justify-start w-full h-fit gap-0 pt-6 pointer-events-none">
                  <DialogTitle className="text-[20px] font-semibold leading-7 text-[#101010] text-center">
                    {slot.label}
                  </DialogTitle>
                  {!selection?.itemId && (
                    <p className="mt-0 text-[14px] font-normal text-[#c0392b]">Select 1</p>
                  )}
                </div>
                <div className="w-12 shrink-0" aria-hidden />
              </div>

              {/* Search bar */}
              <div className="shrink-0 px-6 pb-0">
                <div className="flex items-center gap-2 rounded-[30px] border border-[#e5e5e5] bg-white px-4 py-3">
                  <Search className="h-5 w-5 shrink-0 text-[#666]" aria-hidden />
                  <input
                    type="search"
                    value={categoryPickerSearch}
                    onChange={(e) => setCategoryPickerSearch(e.target.value)}
                    placeholder="Search"
                    className="min-w-0 flex-1 bg-transparent text-[15px] text-[#101010] placeholder:text-[#999] focus:outline-none"
                    aria-label="Search"
                  />
                </div>
              </div>

              {/* List: grows with items, scrolls when modal hits 24px from bottom */}
              <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
                {categoryItems.map((item, index) => {
                  const isSelected = selection?.itemId === item.id;
                  const isLast = index === categoryItems.length - 1;
                  const secondaryText = getCategoryItemSecondaryText(item, slot);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectionsChange(slot.slotId, {
                          itemId: item.id,
                          modifiers: [],
                        });
                        setCategoryPickerSlotId(null);
                      }}
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
                      <div className="min-w-0 flex-1 flex flex-col justify-center gap-0">
                        <span className="text-[15px] font-medium text-[#101010] truncate">
                          {item.name}
                        </span>
                        {secondaryText && (
                          <span className="text-[13px] font-normal leading-5 text-[#666] truncate">
                            {secondaryText}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <span className="shrink-0 inline-flex items-center justify-center gap-1 rounded-full bg-[#e0ffe3] px-2 py-1 text-[13px] font-medium text-[#008507]">
                          <Check className="h-4 w-4" strokeWidth={2.5} />
                          Selected
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}
    </>
  );
}
