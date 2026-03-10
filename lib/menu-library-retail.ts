import type { MenuItem, MenuCategory, Tile } from "./pos-types";

/**
 * Retail variant: Favorites = wines + restaurant merch.
 * Wine categories: Reds (red tile), Whites (green), Rosé (pink), Sparkling (black).
 * All wine images in public/*.png; merch images in public/*.webp where available.
 */

function wineImage(name: string): string {
  return `/${encodeURIComponent(name)}`;
}

// --- Sparkling (category tile: black / default) ---
const sparklingItems: MenuItem[] = [
  {
    id: "eponina-brut-rose-nv",
    name: "Eponina Brut Rosé NV",
    price: 42,
    type: "item",
    image: wineImage("Eponina Brut Rosé NV.png"),
    imageFit: "contain",
    description: "Sparkling Rosé. Wayne Donaldson.",
  },
  {
    id: "rob-mcneill-california-brut-nv",
    name: "Rob McNeill California Brut NV",
    price: 38,
    type: "item",
    image: wineImage("Rob McNeill California Brut NV.png"),
    imageFit: "contain",
    description: "California Sparkling Brut. Rob McNeill.",
  },
  {
    id: "sparkling-penelope-north-coast-brut-nv",
    name: "Sparkling Pénélope North Coast Brut NV",
    price: 44,
    type: "item",
    image: wineImage("Sparkling Pénélope North Coast Brut NV.png"),
    imageFit: "contain",
    description: "North Coast Brut. Penelope Gadd-Coster.",
  },
  {
    id: "wtd-cuvee-no-7-2021",
    name: "WTD Cuvee no. 7 2021",
    price: 48,
    type: "item",
    image: wineImage("WTD Cuvee no. 7 2021.png"),
    imageFit: "contain",
    description: "2021 Brut California. Wayne Donaldson.",
  },
];

// --- Reds (category tile: red / rose) ---
const redsItems: MenuItem[] = [
  {
    id: "arabella-reserve-shiraz-viognier-2022",
    name: "Arabella Reserve Shiraz Viognier 2022",
    price: 32,
    type: "item",
    image: wineImage("Arabella Reserve Shiraz Viognier 2022.png"),
    imageFit: "contain",
    description: "Stephen & Jamie de Wet.",
  },
  {
    id: "f-stephen-millier-black-label-cab-2023",
    name: "F. Stephen Millier Black Label California Cabernet Sauvignon 2023",
    price: 28,
    type: "item",
    image: wineImage("F. Stephen Millier Black Label California Cabernet Sauvignon 2023.png"),
    imageFit: "contain",
    description: "Stephen Millier.",
  },
  {
    id: "mauricio-lorca-gran-reserva-malbec-2021",
    name: "Mauricio Lorca Gran Reserva Malbec 2021",
    price: 36,
    type: "item",
    image: wineImage("Mauricio Lorca Gran Reserva Malbec 2021.png"),
    imageFit: "contain",
    description: "Mauricio Lorca.",
  },
  {
    id: "stefano-di-blasi-igt-toscana-gold-2022",
    name: "Stefano di Blasi IGT Toscana Gold 2022",
    price: 40,
    type: "item",
    image: wineImage("Stefano di Blasi IGT Toscana Gold 2022.png"),
    imageFit: "contain",
    description: "Stefano di Blasi.",
  },
];

// --- Whites (category tile: green) ---
const whitesItems: MenuItem[] = [
  {
    id: "david-akiyoshi-reserve-chardonnay-2023",
    name: "David Akiyoshi Reserve Clarksburg Chardonnay 2023",
    price: 34,
    type: "item",
    image: wineImage("David Akiyoshi Reserve Clarksburg Chardonnay 2023.png"),
    imageFit: "contain",
    description: "David Akiyoshi.",
  },
  {
    id: "karen-birmingham-lodi-sauvignon-blanc-2023",
    name: "Karen Birmingham Lodi Sauvignon Blanc 2023",
    price: 26,
    type: "item",
    image: wineImage("Karen Birmingham Lodi Sauvignon Blanc 2023.png"),
    imageFit: "contain",
    description: "Karen Birmingham.",
  },
  {
    id: "sacchetto-delle-venezie-pinot-grigio-2024",
    name: "Sacchetto delle Venezie Pinot Grigio 2024",
    price: 22,
    type: "item",
    image: wineImage("Sacchetto delle Venezie Pinot Grigio 2024.png"),
    imageFit: "contain",
    description: "Paolo Sacchetto.",
  },
  {
    id: "patrice-grasset-loire-valley-sauvignon-blanc-2024",
    name: "Patrice Grasset Loire Valley Sauvignon Blanc 2024",
    price: 30,
    type: "item",
    image: wineImage("Patrice Grasset Loire Valley Sauvignon Blanc 2024  .png"),
    imageFit: "contain",
    description: "Patrice Grasset.",
  },
];

// --- Rosé (category tile: pink) ---
const roseItems: MenuItem[] = [
  {
    id: "benjamin-darnault-pique-nique-rose-2024",
    name: "Benjamin Darnault Pique Nique Rosé 2024",
    price: 24,
    type: "item",
    image: wineImage("Benjamin Darnault Pique Nique Rosé 2024.png"),
    imageFit: "contain",
    description: "Benjamin Darnault.",
  },
  {
    id: "david-akiyoshi-rose-pinot-noir-2023",
    name: "David Akiyoshi Rosé of Pinot Noir 2023",
    price: 32,
    type: "item",
    image: wineImage("David Akiyoshi Rosé of Pinot Noir 2023.png"),
    imageFit: "contain",
    description: "David Akiyoshi.",
  },
  {
    id: "chris-baker-willamette-valley-rose-2024",
    name: "Chris Baker Willamette Valley Rosé 2024",
    price: 28,
    type: "item",
    image: wineImage("Chris Baker Willamette Valley Rosé 2024.png"),
    imageFit: "contain",
    description: "Chris Baker.",
  },
  {
    id: "matt-parish-contra-costa-rose-2022",
    name: "Matt Parish Contra Costa Rose of Carignan & Mourvedre 2022",
    price: 26,
    type: "item",
    image: wineImage("Matt Parish Contra Costa Rose of Carignan & Mourvedre 2022.png"),
    imageFit: "contain",
    description: "Matt Parish.",
  },
];

// --- Merch (all items; 4 featured in Favorites) ---
const merchItems: MenuItem[] = [
  {
    id: "big-bag",
    name: "Big Bag",
    price: 45,
    type: "item",
    image: "/big bag.webp",
    description: "Jolene large canvas tote. Colors: Brown, Yellow, White, Purple.",
  },
  {
    id: "bread-bag",
    name: "Bread Bag",
    price: 32,
    type: "item",
    image: "/bread bag.webp",
    description: "Peckham cloth. Colors: Pink, Brown, Yellow.",
  },
  {
    id: "baker-smock",
    name: "Baker Smock",
    price: 125,
    type: "item",
    description: "Yarmouth Oilskins. Colors: White, Brown, Blue.",
  },
  {
    id: "baker-trousers",
    name: "Baker Trousers",
    price: 125,
    type: "item",
    description: "Yarmouth Oilskins. Colors: Blue, Brown, White.",
  },
  {
    id: "scarf",
    name: "Scarf",
    price: 45,
    type: "item",
    image: "/scarf.webp",
    description: "Darn. Colors: Red, Purple.",
  },
  {
    id: "small-bag",
    name: "Small Bag",
    price: 20,
    type: "item",
    image: "/small bag.webp",
    description: "Colors: Yellow, Purple, White.",
  },
  {
    id: "bonzo-dog-band",
    name: "Bonzo Dog Band",
    price: 20,
    type: "item",
    description: "Second-hand.",
  },
  {
    id: "house-cap",
    name: "House Cap",
    price: 35,
    type: "item",
    image: "/house cap.webp",
    description: "Colors: Grey, Brown, Blue, Pink.",
  },
  {
    id: "apron",
    name: "Apron",
    price: 75,
    type: "item",
    description: "Blackhorse Lane. Colors: Brown, White, Blue.",
  },
  {
    id: "water-bottle",
    name: "Water Bottle",
    price: 25,
    type: "item",
    image: "/water bottle.webp",
    description: "Nalgene.",
  },
  {
    id: "sauna-hat",
    name: "Sauna Hat",
    price: 35,
    type: "item",
    image: "/sauna hat.webp",
    description: "Sauna hat. Colors: Brown, White.",
  },
  {
    id: "house-cup",
    name: "House Cup",
    price: 28,
    type: "item",
    description: "Carmel Eskel.",
  },
];

// Wine categories (with tile variants: red, green, pink, black)
const categoryReds: MenuCategory = {
  id: "reds",
  name: "Reds",
  type: "category",
  items: redsItems,
  variant: "rose",
};
const categoryWhites: MenuCategory = {
  id: "whites",
  name: "Whites",
  type: "category",
  items: whitesItems,
  variant: "green",
};
const categoryRose: MenuCategory = {
  id: "rose",
  name: "Rosé",
  type: "category",
  items: roseItems,
  variant: "pink",
};
const categorySparkling: MenuCategory = {
  id: "sparkling",
  name: "Sparkling",
  type: "category",
  items: sparklingItems,
  variant: "amber",
};
const categoryMerch: MenuCategory = {
  id: "merch",
  name: "Merch",
  type: "category",
  items: merchItems,
  variant: "default",
};

// Favorites: 1–2 wines per category + 4 merch items
const favoriteWines: MenuItem[] = [
  sparklingItems[0],  // Eponina Brut Rosé NV
  sparklingItems[1],  // Rob McNeill California Brut NV
  redsItems[0],       // Arabella Reserve Shiraz Viognier 2022
  redsItems[1],       // F. Stephen Millier Black Label Cab 2023
  whitesItems[0],     // David Akiyoshi Reserve Chardonnay 2023
  whitesItems[2],     // Sacchetto Pinot Grigio 2024
  roseItems[0],       // Benjamin Darnault Pique Nique Rosé 2024
  roseItems[1],       // David Akiyoshi Rosé of Pinot Noir 2023
];
const favoriteMerch: MenuItem[] = [
  merchItems[0],   // Big Bag
  merchItems[1],   // Bread Bag
  merchItems[4],   // Scarf
  merchItems[5],   // Small Bag
];

export const favoritesCategories: MenuCategory[] = [
  categoryReds,
  categoryWhites,
  categoryRose,
  categorySparkling,
  categoryMerch,
];

/** Flat list of all retail items for lookups. */
export const favoritesItems: MenuItem[] = [
  ...sparklingItems,
  ...redsItems,
  ...whitesItems,
  ...roseItems,
  ...merchItems,
];

/** Root tiles for Favorites tab: featured wines + featured merch, then category tiles. */
export const rootTilesRetail: Tile[] = [
  ...favoriteWines,
  ...favoriteMerch,
  ...favoritesCategories,
];

export function getMenuItemByIdRetail(id: string): MenuItem | undefined {
  return favoritesItems.find((item) => item.id === id);
}
