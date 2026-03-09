// Shared modifier types and logic used by both the item-add and item-edit panels.

export interface ModifierOption {
  id: string;
  name: string;
  price?: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  /** Minimum options that must be selected (0 or undefined = optional). */
  minSelect?: number;
  /** Maximum options that can be selected (undefined = unlimited). */
  maxSelect?: number;
  options: ModifierOption[];
}

export const BEVERAGE_KEYWORDS = [
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

export const BEVERAGE_MODIFIER_GROUPS: ModifierGroup[] = [
  {
    id: "variations",
    name: "Variations",
    minSelect: 1,
    maxSelect: 1,
    options: [
      { id: "8oz", name: "8oz" },
      { id: "12oz", name: "12oz", price: 2 },
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
    minSelect: 1,
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

export const BAKERY_MODIFIER_GROUPS: ModifierGroup[] = [
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

/** Shared spice level group (Nashville Sandwich, Chicken and Waffles, etc.). */
export const SPICE_LEVEL_MODIFIER_GROUP: ModifierGroup = {
  id: "spice-level",
  name: "Spice level",
  minSelect: 1,
  maxSelect: 1,
  options: [
    { id: "spice-naked", name: "Naked" },
    { id: "spice-mild", name: "Mild" },
    { id: "spice-medium", name: "Medium" },
    { id: "spice-hot", name: "Hot" },
  ],
};

/** Nashville Sandwich (QSR): spice level required; remove toppings and on side optional. */
export const NASHVILLE_SANDWICH_MODIFIER_GROUPS: ModifierGroup[] = [
  SPICE_LEVEL_MODIFIER_GROUP,
  {
    id: "remove-toppings",
    name: "Remove Toppings",
    options: [
      { id: "remove-no-coleslaw", name: "No Coleslaw" },
      { id: "remove-no-pickles", name: "No Pickles" },
      { id: "remove-no-house-sauce", name: "No House Sauce" },
    ],
  },
  {
    id: "on-side",
    name: "On Side",
    options: [
      { id: "side-coleslaw", name: "Coleslaw On Side" },
      { id: "side-pickles", name: "Pickles On Side" },
      { id: "side-house-sauce", name: "House Sauce On Side" },
    ],
  },
];

/** Chicken and Waffles (QSR): spice level required only. */
export const CHICKEN_AND_WAFFLES_MODIFIER_GROUPS: ModifierGroup[] = [
  SPICE_LEVEL_MODIFIER_GROUP,
];

/** Tenders individual items (QSR): spice level required only. */
export const TENDERS_MODIFIER_GROUPS: ModifierGroup[] = [
  SPICE_LEVEL_MODIFIER_GROUP,
];

/** Tikkaville Sandwich (QSR): optional remove toppings only. */
export const TIKKAVILLE_SANDWICH_MODIFIER_GROUPS: ModifierGroup[] = [
  {
    id: "remove-toppings-tikkaville",
    name: "Remove Toppings",
    options: [
      { id: "remove-no-coleslaw-tikkaville", name: "No Coleslaw" },
      { id: "remove-no-pickled-onion-tikkaville", name: "No Pickled Onion" },
      { id: "remove-no-mint-chutney-tikkaville", name: "No Mint Chutney" },
    ],
  },
];

/** Smash Burger individual items (QSR): optional build-your-burger add-ons and remove-toppings. */
export const SMASH_BURGER_MODIFIER_GROUPS: ModifierGroup[] = [
  {
    id: "build-your-burger",
    name: "Build Your Burger",
    options: [
      { id: "extra-smash-patty", name: "Extra Smash Patty", price: 2.99 },
      { id: "extra-cheese", name: "Extra Cheese", price: 0.49 },
      { id: "extra-pickles", name: "Extra Pickles", price: 0.49 },
      { id: "extra-griddled-onions", name: "Extra Griddled Onions", price: 0.49 },
      { id: "extra-jalapenos", name: "Extra Jalapeños", price: 0.49 },
    ],
  },
  {
    id: "remove-toppings-smash-burger",
    name: "Remove Toppings - Smash Burger",
    options: [
      { id: "remove-no-pickles-smash", name: "No Pickles" },
      { id: "remove-no-griddled-onions-smash", name: "No Griddled Onions" },
      { id: "remove-no-american-cheese-smash", name: "No American Cheese" },
      { id: "remove-no-house-sauce-smash", name: "No House Sauce" },
      { id: "remove-no-jalapenos-smash", name: "No Jalapeños" },
    ],
  },
];

/** Retail/item names that have no variants or modifiers. */
const ITEMS_WITHOUT_MODIFIERS = ["Milky Coffee Risograph Print", "Tikka Melt"];

const TENDERS_ITEM_NAMES = ["Single Tender", "3 Tenders", "5 Tenders"];

const SMASH_BURGER_ITEM_NAMES = ["Classic Smash Burger", "Spicy Smash Burger"];

export function getModifierGroups(item: { name: string }): ModifierGroup[] {
  if (ITEMS_WITHOUT_MODIFIERS.includes(item.name)) return [];
  if (item.name === "Nashville Sandwich") return NASHVILLE_SANDWICH_MODIFIER_GROUPS;
  if (item.name === "Chicken and Waffles") return CHICKEN_AND_WAFFLES_MODIFIER_GROUPS;
  if (TENDERS_ITEM_NAMES.includes(item.name)) return TENDERS_MODIFIER_GROUPS;
  if (item.name === "Tikkaville Sandwich") return TIKKAVILLE_SANDWICH_MODIFIER_GROUPS;
  if (SMASH_BURGER_ITEM_NAMES.includes(item.name)) return SMASH_BURGER_MODIFIER_GROUPS;
  const isBeverage = BEVERAGE_KEYWORDS.some((kw) =>
    item.name.toLowerCase().includes(kw)
  );
  return isBeverage ? BEVERAGE_MODIFIER_GROUPS : BAKERY_MODIFIER_GROUPS;
}

export function isGroupRequirementUnmet(
  group: ModifierGroup,
  draftModifiers: string[]
): boolean {
  if (!group.minSelect) return false;
  const selectedCount = group.options.filter((o) =>
    draftModifiers.includes(o.id)
  ).length;
  return selectedCount < group.minSelect;
}

export function computeNewModifiers(
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

  return [
    ...current.filter((m) => !groupOptionIds.includes(m)),
    ...nextInGroup,
  ];
}

/** Returns true if any modifier group has a required selection (minSelect > 0). */
export function itemRequiresSelection(item: { name: string }): boolean {
  return getModifierGroups(item).some((g) => g.minSelect && g.minSelect > 0);
}

/** Returns default modifier ids: only the variations group gets first option as default; other required groups (e.g. milk) have no default. */
export function getDefaultModifiers(item: { name: string }): string[] {
  const groups = getModifierGroups(item);
  return groups
    .filter(
      (g) =>
        g.id === "variations" &&
        g.minSelect &&
        g.minSelect > 0 &&
        g.options.length > 0
    )
    .map((g) => g.options[0].id);
}

/** Extra price from selected modifiers (variation deltas + add-on prices). */
export function getModifierPriceDelta(
  item: { name: string },
  modifierIds: string[]
): number {
  const groups = getModifierGroups(item);
  let delta = 0;
  for (const id of modifierIds) {
    for (const group of groups) {
      const option = group.options.find((o) => o.id === id);
      if (option?.price != null) delta += option.price;
    }
  }
  return delta;
}

/** For variations group: first option shows no price (base); others show +$delta. */
export function getVariationOptionPriceDisplay(
  group: ModifierGroup,
  option: ModifierOption,
  optionIndex: number
): string | null {
  if (group.id !== "variations") return null;
  if (optionIndex === 0) return null;
  if (option.price == null) return null;
  return `+$${option.price.toFixed(2)}`;
}

/** Resolve modifier ids to display: variant (variations group) and comma-separated other modifier names. */
export function getModifierDisplay(
  item: { name: string },
  modifierIds: string[]
): { variantName: string | null; modifierNames: string[] } {
  const groups = getModifierGroups(item);
  let variantName: string | null = null;
  const modifierNames: string[] = [];
  for (const id of modifierIds) {
    for (const group of groups) {
      const option = group.options.find((o) => o.id === id);
      if (!option) continue;
      if (group.id === "variations") {
        variantName = option.name;
      } else {
        modifierNames.push(option.name);
      }
      break;
    }
  }
  return { variantName, modifierNames };
}
