import type { MenuItem, MenuCategory, Tile } from "./pos-types";

/**
 * Favorites — retail items (Her Winter Flowers–style stationery & gifts).
 * Images in public/: riso-print.webp, homemade-cookbook.webp, memo-pad.webp, cat-calendar.webp, sticker-sheet.webp
 */

const artPrintsItems: MenuItem[] = [
  {
    id: "milky-coffee-riso",
    name: "Milky Coffee Risograph Print",
    price: 21.0,
    type: "item",
    image: "/riso-print.webp",
    description:
      "Risograph print of box milky coffee. Each piece is slightly different due to the nature of the risograph technique. Printed with eco-friendly, soy-based inks. 5 x 7 inches.",
  },
];

const calendarsItems: MenuItem[] = [
  {
    id: "cat-calendar",
    name: "2026 Desk 'Cat &' Calendar",
    price: 18.0,
    type: "item",
    image: "/cat-calendar.webp",
    description:
      "Desk calendar by Japanese artist Kahoko Sodeyama. 6.3 x 4.9 inches. Small hole for hanging or desk stand. Made in Japan.",
  },
];

const stickersTapeItems: MenuItem[] = [
  {
    id: "sticker-sheet",
    name: "Sticker Sheet",
    price: 12.0,
    type: "item",
    image: "/sticker-sheet.webp",
    description: "Decorative sticker sheet.",
  },
];

const boxedCardSetsItems: MenuItem[] = [];

const letterWritingSetsItems: MenuItem[] = [];

const notebooksItems: MenuItem[] = [
  {
    id: "recipe-journal",
    name: "Recipe Journal - Homemade Cookbook",
    price: 23.0,
    type: "item",
    image: "/homemade-cookbook.webp",
    description:
      "A recipe book for jotting down your favorite dishes and the memories behind them. 4.7 x 6.9 inches, 112 pages. Made in Korea.",
  },
];

const notepadsItems: MenuItem[] = [
  {
    id: "suzuki-memo-pad",
    name: "Suzuki Narumi Block Memo Pad",
    price: 9.8,
    type: "item",
    image: "/memo-pad.webp",
    description:
      "Illustrated memo pads by Japanese artist Suzuki Narumi. 3.9 x 3.5 inches, 4 designs, 120 sheets. Made in Japan.",
  },
];

export const favoritesCategories: MenuCategory[] = [
  { id: "art-prints", name: "Art Prints", type: "category", items: artPrintsItems, variant: "amber" },
  { id: "calendars", name: "Calendars", type: "category", items: calendarsItems, variant: "blue" },
  { id: "stickers-tape", name: "Stickers + Tape", type: "category", items: stickersTapeItems, variant: "rose" },
  { id: "boxed-card-sets", name: "Boxed Card Sets", type: "category", items: boxedCardSetsItems, variant: "green" },
  { id: "letter-writing-sets", name: "Letter Writing Sets", type: "category", items: letterWritingSetsItems, variant: "teal" },
  { id: "notebooks", name: "Notebooks", type: "category", items: notebooksItems, variant: "slate" },
  { id: "notepads", name: "Notepads", type: "category", items: notepadsItems },
];

/** Flat list of all retail items (for lookups and backwards compatibility). */
export const favoritesItems: MenuItem[] = [
  ...artPrintsItems,
  ...calendarsItems,
  ...stickersTapeItems,
  ...boxedCardSetsItems,
  ...letterWritingSetsItems,
  ...notebooksItems,
  ...notepadsItems,
];

/** Root tiles for Favorites tab: favorite items first, then the seven category tiles. */
export const rootTilesRetail: Tile[] = [...favoritesItems, ...favoritesCategories];

export function getMenuItemByIdRetail(id: string): MenuItem | undefined {
  return favoritesItems.find((item) => item.id === id);
}
