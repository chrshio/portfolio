import type {
  Tile,
  MenuItem,
  MenuCategory,
  DiscountTile,
  ComboDefinition,
  ComboSlotSelection,
} from "./pos-types";

// Namkeen-inspired QSR menu data for the Lunch prototype.
export const featuredItemsQSR: MenuItem[] = [
  { id: "nashville-sandwich", name: "Nashville Sandwich", price: 14.99, type: "item", image: "/nashville-sandwich.avif" },
  { id: "tikka-melt", name: "Tikka Melt", price: 14.99, type: "item", image: "/tikka-melt-meal.avif" },
  { id: "tikkaville-sandwich", name: "Tikkaville Sandwich", price: 14.99, type: "item", image: "/tikkaville-meal.avif" },
  { id: "masala-fries", name: "Masala Fries", price: 6.99, type: "item" },
  { id: "mac-and-cheese", name: "Mac and Cheese", price: 5.99, type: "item", image: "/mac-cheese.avif" },
];

// Meal items are treated as regular items for now.
// We can add combo/meal detail builders later.
export const mealItemsQSR: MenuItem[] = [
  { id: "tenders-meal", name: "Tenders Meal", price: 17.99, type: "item", image: "/tenders-meal.avif" },
  { id: "tikka-melt-meal", name: "Tikka Melt Meal", price: 17.99, type: "item", image: "/tikka-melt-meal.avif" },
  { id: "classic-smash-meal-6", name: "#6 Classic Smash Meal", price: 12.99, type: "item", image: "/classic-smash-meal.avif" },
  { id: "spicy-smash-meal-7", name: "#7 Spicy Smash Meal", price: 13.99, type: "item", image: "/spicy-smash-meal.avif" },
  { id: "tikkaville-meal", name: "Tikkaville Meal", price: 17.99, type: "item", image: "/tikkaville-meal.avif" },
  { id: "clucking-waffle-meal", name: "Clucking Waffle Meal", price: 24.99, type: "item" },
];

// Home-grid featured row for Lunch (separate from category membership).
export const homeMealItemsQSR: MenuItem[] = [
  mealItemsQSR[0],
  mealItemsQSR[1],
  mealItemsQSR[2],
  mealItemsQSR[3],
  mealItemsQSR[4],
];

// Individual item ids to hide from home grid when their meal is in row 1 (no overlap).
const homeGridExcludeItemIds = new Set<string>([
  "tikka-melt",        // Tikka Melt Meal is in row 1
  "tikkaville-sandwich", // Tikkaville Meal is in row 1
]);

// Second row: featured items with no overlap to row 1 meals.
export const homeFeaturedItemsQSR: MenuItem[] = featuredItemsQSR.filter(
  (item) => !homeGridExcludeItemIds.has(item.id)
);

// Standalone item for home grid (also in Mains).
export const chickenAndWafflesItem: MenuItem = {
  id: "chicken-waffles",
  name: "Chicken and Waffles",
  price: 14.99,
  type: "item",
  image: "/chicken-waffles.avif",
};

export const mainsItemsQSR: MenuItem[] = [
  { id: "single-tender", name: "Single Tender", price: 5.99, type: "item", image: "/single-tender.avif" },
  { id: "three-tenders", name: "3 Tenders", price: 13.99, type: "item", image: "/single-tender.avif" },
  { id: "five-tenders", name: "5 Tenders", price: 19.99, type: "item", image: "/single-tender.avif" },
  { id: "nashville-sandwich-main", name: "Nashville Sandwich", price: 14.99, type: "item", image: "/nashville-sandwich.avif" },
  { id: "tikka-melt-main", name: "Tikka Melt", price: 14.99, type: "item", image: "/tikka-melt-meal.avif" },
  chickenAndWafflesItem,
];

export const smashBurgerItemsQSR: MenuItem[] = [
  { id: "spicy-smash", name: "Spicy Smash Burger", price: 10.99, type: "item", image: "/spicy-smash-meal.avif" },
  { id: "classic-smash", name: "Classic Smash Burger", price: 13.99, type: "item", image: "/classic-smash-meal.avif" },
];

export const loadedItemsQSR: MenuItem[] = [
  { id: "dhamaka-fries", name: "Dhamaka Fries", price: 12.99, type: "item" },
  { id: "tikka-loaded-fries", name: "Tikka Loaded Fries", price: 13.99, type: "item" },
  { id: "tikka-mac", name: "Tikka Mac", price: 12.99, type: "item" },
  { id: "tikka-mac-cheese-loaded", name: "Tikka Mac & Cheese", price: 13.99, type: "item" },
];

export const wingsBitesItemsQSR: MenuItem[] = [
  { id: "six-wings", name: "6 Wings", price: 11.99, type: "item" },
  { id: "twelve-wings", name: "12 Wings", price: 20.99, type: "item" },
  { id: "popcorn-chicken", name: "Popcorn Chicken", price: 9.99, type: "item" },
];

export const sidesItemsQSR: MenuItem[] = [
  { id: "fries-side", name: "Fries", price: 4.99, type: "item", image: "/fries.avif" },
  { id: "masala-fries-side", name: "Masala Fries", price: 6.99, type: "item" },
  { id: "mac-side", name: "Mac & Cheese", price: 5.99, type: "item", image: "/mac-cheese.avif" },
  { id: "coleslaw-side", name: "Coleslaw", price: 3.99, type: "item", image: "/coleslaw.avif" },
];

export const drinksItemsQSR: MenuItem[] = [
  { id: "cola", name: "Maine Root Mexicane Cola", price: 3.99, type: "item", image: "/cola.webp" },
  { id: "blueberry", name: "Maine Root Blueberry", price: 3.99, type: "item", image: "/blueberry.webp" },
  { id: "bottled-water", name: "Bottled Water", price: 1.99, type: "item", image: "/water.webp" },
  { id: "ginger-ale", name: "Ginger Ale", price: 2.99, type: "item", image: "/ginger-ale.webp" },
  { id: "classic-shakes", name: "Classic Shakes", price: 6.99, type: "item", image: "/classic-shakes.webp" },
];

// Second row: no Masala Fries on home grid; use Chicken and Waffles in its place; Coleslaw instead of Soda.
export const homeSecondRowItemsQSR: MenuItem[] = [
  featuredItemsQSR[0],       // Nashville Sandwich
  chickenAndWafflesItem,     // Chicken and Waffles (replaces Masala Fries)
  featuredItemsQSR[4],       // Tikka Mac & Cheese
  sidesItemsQSR[0],          // Fries
  sidesItemsQSR[3],          // Coleslaw (replaces Soda)
];

export const categoriesQSR: MenuCategory[] = [
  { id: "meals", name: "Meals", type: "category", items: mealItemsQSR },
  { id: "smash-burgers", name: "Smash Burgers", type: "category", items: smashBurgerItemsQSR },
  { id: "mains", name: "Mains", type: "category", items: mainsItemsQSR },
  { id: "loaded-fries-mac", name: "Loaded Fries & Mac", type: "category", items: loadedItemsQSR },
  { id: "wings-bites", name: "Wings & Bites", type: "category", items: wingsBitesItemsQSR },
  { id: "sides", name: "Sides", type: "category", items: sidesItemsQSR },
  { id: "drinks", name: "Drinks", type: "category", items: drinksItemsQSR },
];

export const discountTilesQSR: DiscountTile[] = [
  { id: "fnf-20", name: "F&F 20% off", type: "discount", discountType: "percentage", value: 20 },
];

/** Shared category slot config: item price adjustments for combo picker secondary text (e.g. "Shakes (+$3.00)"). */
const SIDE_SLOT_ADJUSTMENTS: Record<string, number> = {
  "fries-side": 1,
  "mac-side": 3,
};
const DRINK_SLOT_ADJUSTMENTS: Record<string, number> = {
  "classic-shakes": 3,
};

/** Combo/meal definitions for first-row meal items. Fixed = one item (modify only); category = pick one from category. */
export const COMBO_DEFINITIONS: Record<string, ComboDefinition> = {
  "tenders-meal": {
    slots: [
      { slotId: "main", label: "Main", type: "fixed", itemId: "three-tenders" },
      { slotId: "side", label: "Side", type: "category", categoryId: "sides", itemPriceAdjustments: SIDE_SLOT_ADJUSTMENTS },
      { slotId: "drink", label: "Drink", type: "category", categoryId: "drinks", itemPriceAdjustments: DRINK_SLOT_ADJUSTMENTS },
    ],
  },
  "tikka-melt-meal": {
    slots: [
      { slotId: "main", label: "Main", type: "fixed", itemId: "tikka-melt-main" },
      { slotId: "side", label: "Side", type: "category", categoryId: "sides", itemPriceAdjustments: SIDE_SLOT_ADJUSTMENTS },
      { slotId: "drink", label: "Drink", type: "category", categoryId: "drinks", itemPriceAdjustments: DRINK_SLOT_ADJUSTMENTS },
    ],
  },
  "classic-smash-meal-6": {
    slots: [
      { slotId: "main", label: "Main", type: "fixed", itemId: "classic-smash" },
      { slotId: "side", label: "Side", type: "category", categoryId: "sides", itemPriceAdjustments: SIDE_SLOT_ADJUSTMENTS },
      { slotId: "drink", label: "Drink", type: "category", categoryId: "drinks", itemPriceAdjustments: DRINK_SLOT_ADJUSTMENTS },
    ],
  },
  "spicy-smash-meal-7": {
    slots: [
      { slotId: "main", label: "Main", type: "fixed", itemId: "spicy-smash" },
      { slotId: "side", label: "Side", type: "category", categoryId: "sides", itemPriceAdjustments: SIDE_SLOT_ADJUSTMENTS },
      { slotId: "drink", label: "Drink", type: "category", categoryId: "drinks", itemPriceAdjustments: DRINK_SLOT_ADJUSTMENTS },
    ],
  },
  "tikkaville-meal": {
    slots: [
      { slotId: "main", label: "Main", type: "fixed", itemId: "tikkaville-sandwich" },
      { slotId: "side", label: "Side", type: "category", categoryId: "sides", itemPriceAdjustments: SIDE_SLOT_ADJUSTMENTS },
      { slotId: "drink", label: "Drink", type: "category", categoryId: "drinks", itemPriceAdjustments: DRINK_SLOT_ADJUSTMENTS },
    ],
  },
};

export function getComboDefinition(menuItemId: string): ComboDefinition | null {
  return COMBO_DEFINITIONS[menuItemId] ?? null;
}

/** Get all items in a category by id (for combo category slots). */
export function getCategoryItems(categoryId: string): MenuItem[] {
  const cat = categoriesQSR.find((c) => c.id === categoryId);
  return cat?.items ?? [];
}

/** Get a single menu item by id from any QSR list. */
export function getMenuItemById(itemId: string): MenuItem | undefined {
  const sources: MenuItem[][] = [
    featuredItemsQSR,
    mealItemsQSR,
    mainsItemsQSR,
    smashBurgerItemsQSR,
    loadedItemsQSR,
    wingsBitesItemsQSR,
    sidesItemsQSR,
    drinksItemsQSR,
  ];
  for (const list of sources) {
    const found = list.find((i) => i.id === itemId);
    if (found) return found;
  }
  return undefined;
}

/** Default combo selections: fixed slots get their itemId; category slots (e.g. drink, side) have no default — user must select. */
export function getDefaultComboSelections(combo: ComboDefinition): Record<string, ComboSlotSelection> {
  const out: Record<string, ComboSlotSelection> = {};
  for (const slot of combo.slots) {
    if (slot.type === "fixed" && slot.itemId) {
      out[slot.slotId] = { itemId: slot.itemId, modifiers: [] };
    }
    // category slots: do not pre-select; user must choose from "Select Your [Category]" picker
  }
  return out;
}

export const rootTilesQSR: Tile[] = [...homeMealItemsQSR, ...homeSecondRowItemsQSR, ...categoriesQSR, ...discountTilesQSR];
