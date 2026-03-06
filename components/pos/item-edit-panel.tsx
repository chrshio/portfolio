"use client";

import { useRef, useState, useEffect } from "react";
import { Minus, Plus } from "lucide-react";
import type { CartItem } from "@/lib/pos-types";
import { cn } from "@/lib/utils";

// ─── Modifier types ───────────────────────────────────────────────────────────

interface ModifierOption {
  id: string;
  name: string;
  price?: number;
}

interface ModifierGroup {
  id: string;
  name: string;
  /** Minimum number of options that must be selected (0 or undefined = optional). */
  minSelect?: number;
  /** Maximum number of options that can be selected (undefined = unlimited). */
  maxSelect?: number;
  options: ModifierOption[];
}

// ─── Options types ────────────────────────────────────────────────────────────

interface FulfillmentMethod {
  id: string;
  name: string;
}

interface OptionsLineItem {
  id: string;
  name: string;
  type: "percentage" | "fixed";
  value: number;
}

export interface DraftItemOptions {
  note: string;
  fulfillmentMethod?: string;
  taxes: string[];
  discounts: string[];
  serviceCharges: string[];
}

// ─── Static data ──────────────────────────────────────────────────────────────

const FULFILLMENT_METHODS: FulfillmentMethod[] = [
  { id: "for-here", name: "For here" },
  { id: "to-go", name: "To go" },
  { id: "pick-up", name: "Pick up" },
  { id: "delivery", name: "Delivery" },
];

const TAX_OPTIONS: OptionsLineItem[] = [
  { id: "sales-tax", name: "Sales tax", type: "percentage", value: 6 },
  { id: "city-tax", name: "City tax", type: "percentage", value: 1.5 },
  { id: "wealth-tax", name: "Wealth tax", type: "percentage", value: 85 },
];

const DISCOUNT_OPTIONS: OptionsLineItem[] = [
  { id: "friends-family", name: "Friends & family", type: "percentage", value: 20 },
  { id: "half-off", name: "Half off", type: "percentage", value: 20 },
  { id: "happy-hour", name: "Happy hour", type: "percentage", value: 20 },
];

const SERVICE_CHARGE_OPTIONS: OptionsLineItem[] = [
  { id: "large-party", name: "Large party", type: "percentage", value: 20 },
  { id: "corking-fee", name: "Corking fee", type: "fixed", value: 20 },
  { id: "event-space", name: "Event space", type: "fixed", value: 50 },
];

const BEVERAGE_MODIFIER_GROUPS: ModifierGroup[] = [
  {
    id: "variations",
    name: "Variations",
    maxSelect: 1,
    options: [
      { id: "8oz", name: "8oz", price: 5.5 },
      { id: "12oz", name: "12oz", price: 6.0 },
    ],
  },
  {
    id: "milk",
    name: "Milk",
    minSelect: 1,
    maxSelect: 1,
    options: [
      { id: "Oat", name: "Oat" },
      { id: "Whole", name: "Whole" },
      { id: "Skim", name: "Skim" },
      { id: "Hemp", name: "Hemp" },
      { id: "Soy", name: "Soy" },
      { id: "Coconut", name: "Coconut" },
    ],
  },
  {
    id: "temperature",
    name: "Temperature",
    maxSelect: 1,
    options: [
      { id: "Hot", name: "Hot" },
      { id: "Iced", name: "Iced" },
      { id: "Cold", name: "Cold" },
    ],
  },
  {
    id: "add-ons",
    name: "Add-ons",
    options: [
      { id: "Vanilla syrup", name: "Vanilla syrup", price: 1.0 },
      { id: "Extra shot", name: "Extra shot", price: 1.0 },
      { id: "Drizzle", name: "Drizzle", price: 1.0 },
      { id: "Honey", name: "Honey" },
    ],
  },
];

const BAKERY_MODIFIER_GROUPS: ModifierGroup[] = [
  {
    id: "add-ons",
    name: "Add-ons",
    options: [
      { id: "Warmed", name: "Warmed" },
      { id: "Butter", name: "Butter", price: 0.5 },
      { id: "Jam", name: "Jam", price: 0.5 },
    ],
  },
];

const BEVERAGE_KEYWORDS = [
  "cortado",
  "matcha",
  "latte",
  "cappuccino",
  "espresso",
  "coffee",
  "tea",
  "americano",
  "mocha",
];

function getModifierGroups(item: CartItem): ModifierGroup[] {
  const isBeverage = BEVERAGE_KEYWORDS.some((kw) =>
    item.name.toLowerCase().includes(kw)
  );
  return isBeverage ? BEVERAGE_MODIFIER_GROUPS : BAKERY_MODIFIER_GROUPS;
}

function isGroupRequirementUnmet(
  group: ModifierGroup,
  draftModifiers: string[]
): boolean {
  if (!group.minSelect) return false;
  const selectedCount = group.options.filter((o) =>
    draftModifiers.includes(o.id)
  ).length;
  return selectedCount < group.minSelect;
}

function computeNewModifiers(
  group: ModifierGroup,
  optionId: string,
  current: string[]
): string[] {
  const groupOptionIds = group.options.map((o) => o.id);
  const currentInGroup = current.filter((m) => groupOptionIds.includes(m));
  const isSelected = currentInGroup.includes(optionId);

  let nextInGroup: string[];
  if (isSelected) {
    nextInGroup = currentInGroup.filter((m) => m !== optionId);
  } else if (group.maxSelect === 1) {
    nextInGroup = [optionId];
  } else if (group.maxSelect && currentInGroup.length >= group.maxSelect) {
    return current;
  } else {
    nextInGroup = [...currentInGroup, optionId];
  }

  return [...current.filter((m) => !groupOptionIds.includes(m)), ...nextInGroup];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ModifierTileProps {
  option: ModifierOption | FulfillmentMethod;
  isSelected: boolean;
  onClick: () => void;
}

function ModifierTile({ option, isSelected, onClick }: ModifierTileProps) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col justify-end h-[112px] w-full p-3 rounded-[12px] bg-[#f0f0f0] text-left transition-all"
    >
      {isSelected && (
        <div className="absolute inset-0 rounded-[12px] border-2 border-[#101010] pointer-events-none">
          <div className="absolute inset-0 rounded-[10px] shadow-[inset_0_0_0_2px_white] pointer-events-none" />
        </div>
      )}
      <span className="text-[16px] font-medium text-[#101010] leading-6 truncate">
        {option.name}
      </span>
      {"price" in option && option.price !== undefined && (
        <span className="text-[12px] text-[#101010] leading-[18px]">
          ${option.price.toFixed(2)}
        </span>
      )}
    </button>
  );
}

function CheckboxRow({
  label,
  value,
  checked,
  onToggle,
}: {
  label: string;
  value: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full py-[14px] border-b border-[#f0f0f0] last:border-b-0"
    >
      <span className="text-[15px] text-[#101010]">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-[15px] text-[#888]">{value}</span>
        <div
          className={cn(
            "w-[20px] h-[20px] rounded-[4px] border flex items-center justify-center shrink-0",
            checked
              ? "bg-[#101010] border-[#101010]"
              : "bg-white border-[#dadada]"
          )}
        >
          {checked && (
            <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
              <path
                d="M1 4L4.5 7.5L11 1"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ItemEditPanelProps {
  item: CartItem;
  draftQuantity: number;
  draftModifiers: string[];
  draftOptions: DraftItemOptions;
  onQuantityChange: (quantity: number) => void;
  onModifiersChange: (modifiers: string[]) => void;
  onOptionsChange: (options: DraftItemOptions) => void;
  onCompItem: () => void;
  onRemoveItem: () => void;
}

export function ItemEditPanel({
  item,
  draftQuantity,
  draftModifiers,
  draftOptions,
  onQuantityChange,
  onModifiersChange,
  onOptionsChange,
  onCompItem,
  onRemoveItem,
}: ItemEditPanelProps) {
  const modifierGroups = getModifierGroups(item);

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const tabs = [
    { id: "variations", label: "Variations" },
    { id: "milk", label: "Milk" },
    { id: "temperature", label: "Temperature" },
    { id: "add-ons", label: "Add-ons" },
    { id: "note", label: "Note" },
    { id: "options", label: "Options" },
  ]
    .filter(
      (tab) =>
        tab.id === "note" ||
        tab.id === "options" ||
        modifierGroups.some((g) => g.id === tab.id)
    )
    .map((tab) => {
      const group = modifierGroups.find((g) => g.id === tab.id);
      return {
        ...tab,
        alert: group ? isGroupRequirementUnmet(group, draftModifiers) : false,
      };
    });

  // Keep a stable ref to the tabs array so the scroll listener never goes stale.
  const tabsRef = useRef(tabs);
  useEffect(() => {
    tabsRef.current = tabs;
  });

  const effectiveActiveTabId = activeTabId ?? tabs[0]?.id;

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      const { scrollTop } = container;

      // Walk sections in order. The last one whose top (relative to the
      // scroll container's scroll origin) has been scrolled to within
      // THRESHOLD px of the top edge wins.
      const THRESHOLD = 80;
      let next: string | null = null;
      for (const { id } of tabsRef.current) {
        const el = sectionRefs.current[id];
        if (!el) continue;
        // offsetTop is relative to the scroll container (which has
        // position:relative), so this is stable and viewport-independent.
        if (el.offsetTop - THRESHOLD <= scrollTop) {
          next = id;
        }
      }
      if (next !== null) setActiveTabId(next);
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  const handleTabClick = (tabId: string) => {
    setActiveTabId(tabId);
    const el = sectionRefs.current[tabId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const toggleLineItem = (
    field: keyof Pick<DraftItemOptions, "taxes" | "discounts" | "serviceCharges">,
    id: string
  ) => {
    const current = draftOptions[field];
    onOptionsChange({
      ...draftOptions,
      [field]: current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id],
    });
  };

  return (
    <div className="flex flex-col h-full bg-white px-6">
      {/* Header: item name + quantity stepper */}
      <div className="flex items-center justify-between pt-4 pb-4">
        <h2 className="text-[25px] font-semibold text-[#101010] truncate flex-1 mr-4">
          {item.name}
        </h2>
        <div className="flex items-center border border-[#dadada] rounded-full h-[56px] shrink-0">
          <button
            onClick={() => onQuantityChange(Math.max(1, draftQuantity - 1))}
            disabled={draftQuantity <= 1}
            className="flex items-center justify-center w-[56px] h-[56px] shrink-0 disabled:cursor-default"
          >
            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#f0f0f0]">
              <Minus
                className={cn(
                  "w-4 h-4 transition-colors",
                  draftQuantity <= 1 ? "text-[#c8c8c8]" : "text-[#101010]"
                )}
              />
            </span>
          </button>
          <span
            className="text-[16px] text-[#101010] text-center min-w-[28px]"
            style={{ fontFeatureSettings: "'lnum' 1, 'tnum' 1" }}
          >
            {draftQuantity}
          </span>
          <button
            onClick={() => onQuantityChange(draftQuantity + 1)}
            className="flex items-center justify-center w-[56px] h-[56px] shrink-0"
          >
            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#f0f0f0]">
              <Plus className="w-4 h-4 text-[#101010]" />
            </span>
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-[#f0f0f0]">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                "flex items-center gap-1.5 text-[14px] font-semibold pb-2.5 pt-1 border-b-2 transition-colors shrink-0",
                tab.id === effectiveActiveTabId
                  ? "text-[#101010] border-[#101010]"
                  : "text-[#666] border-transparent"
              )}
            >
              {tab.label}
              {tab.alert && (
                <span className="w-[8px] h-[8px] rounded-full bg-[#005ad9] shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pb-6 relative">
        {/* Modifier groups */}
        {modifierGroups.map((group) => {
          const requirementUnmet = isGroupRequirementUnmet(group, draftModifiers);

          return (
            <div
              key={group.id}
              ref={(el) => {
                sectionRefs.current[group.id] = el;
              }}
              className="pt-2"
            >
              <div className="flex items-center gap-2 min-h-[40px] py-2">
                <span className="text-[14px] font-medium text-[#101010]">
                  {group.name}
                </span>
                {requirementUnmet && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#e5f0ff] text-[#005ad9] text-[12px] font-medium leading-[18px]">
                    Select {group.minSelect}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2 pb-2">
                {group.options.map((option) => (
                  <ModifierTile
                    key={option.id}
                    option={option}
                    isSelected={draftModifiers.includes(option.id)}
                    onClick={() =>
                      onModifiersChange(
                        computeNewModifiers(group, option.id, draftModifiers)
                      )
                    }
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Note section */}
        <div
          ref={(el) => {
            sectionRefs.current["note"] = el;
          }}
          className="pt-2"
        >
          <div className="flex items-center gap-2 min-h-[40px] py-2">
            <span className="text-[14px] font-medium text-[#101010]">Note</span>
          </div>
          <textarea
            value={draftOptions.note}
            onChange={(e) =>
              onOptionsChange({ ...draftOptions, note: e.target.value })
            }
            placeholder="Add an item note..."
            rows={4}
            className={cn(
              "w-full resize-none rounded-[8px] border px-4 py-5 text-[15px] text-[#101010] leading-[22px]",
              "placeholder:text-[#b0b0b0]",
              "border-[#dadada] hover:border-[#101010]",
              "focus:border-2 focus:border-[#101010] focus:outline-none",
              "transition-colors"
            )}
          />
        </div>

        {/* Options section */}
        <div
          ref={(el) => {
            sectionRefs.current["options"] = el;
          }}
          className="pt-2"
        >
          {/* Fulfillment methods */}
          <div className="flex items-center gap-2 min-h-[40px] py-2">
            <span className="text-[14px] font-medium text-[#101010]">
              Fulfillment methods
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 pb-4">
            {FULFILLMENT_METHODS.map((method) => (
              <ModifierTile
                key={method.id}
                option={method}
                isSelected={draftOptions.fulfillmentMethod === method.id}
                onClick={() =>
                  onOptionsChange({
                    ...draftOptions,
                    fulfillmentMethod:
                      draftOptions.fulfillmentMethod === method.id
                        ? undefined
                        : method.id,
                  })
                }
              />
            ))}
          </div>

          {/* Taxes */}
          <div className="flex items-center gap-2 min-h-[40px] py-2 border-t border-[#f0f0f0]">
            <span className="text-[14px] font-semibold text-[#101010]">Taxes</span>
          </div>
          <div className="mb-2">
            {TAX_OPTIONS.map((tax) => (
              <CheckboxRow
                key={tax.id}
                label={tax.name}
                value={tax.type === "percentage" ? `${tax.value}%` : `$${tax.value}`}
                checked={draftOptions.taxes.includes(tax.id)}
                onToggle={() => toggleLineItem("taxes", tax.id)}
              />
            ))}
          </div>

          {/* Discounts */}
          <div className="flex items-center gap-2 min-h-[40px] py-2 border-t border-[#f0f0f0]">
            <span className="text-[14px] font-semibold text-[#101010]">Discounts</span>
          </div>
          <div className="mb-2">
            {DISCOUNT_OPTIONS.map((discount) => (
              <CheckboxRow
                key={discount.id}
                label={discount.name}
                value={
                  discount.type === "percentage"
                    ? `${discount.value}%`
                    : `$${discount.value}`
                }
                checked={draftOptions.discounts.includes(discount.id)}
                onToggle={() => toggleLineItem("discounts", discount.id)}
              />
            ))}
          </div>

          {/* Service charges */}
          <div className="flex items-center gap-2 min-h-[40px] py-2 border-t border-[#f0f0f0]">
            <span className="text-[14px] font-semibold text-[#101010]">
              Service charges
            </span>
          </div>
          <div className="mb-2">
            {SERVICE_CHARGE_OPTIONS.map((charge) => (
              <CheckboxRow
                key={charge.id}
                label={charge.name}
                value={
                  charge.type === "percentage"
                    ? `${charge.value}%`
                    : `$${charge.value}`
                }
                checked={draftOptions.serviceCharges.includes(charge.id)}
                onToggle={() => toggleLineItem("serviceCharges", charge.id)}
              />
            ))}
          </div>

          {/* Item description */}
          {item.description && (
            <div className="py-4 border-t border-[#f0f0f0]">
              <p className="text-[14px] font-semibold text-[#101010] mb-1">
                Item description
              </p>
              <p className="text-[14px] text-[#888] leading-[22px]">
                {item.description}
              </p>
            </div>
          )}

          {/* Comp / Remove actions */}
          <div className="flex gap-3 pt-4 pb-2 border-t border-[#f0f0f0]">
            <button
              onClick={onCompItem}
              className="flex-1 h-[52px] rounded-full bg-[#f0f0f0] text-[15px] font-semibold text-[#101010]"
            >
              Comp item
            </button>
            <button
              onClick={onRemoveItem}
              className="flex-1 h-[52px] rounded-full bg-[#f0f0f0] text-[15px] font-semibold text-[#c0392b]"
            >
              Remove item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
