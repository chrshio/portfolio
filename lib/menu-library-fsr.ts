import type {
  Tile,
  MenuItem,
  MenuCategory,
  DiscountTile,
} from "./pos-types";

// Italian dinner menu data for the FSR prototype.

export const startersItemsFSR: MenuItem[] = [
  { id: "challah-french-toast", name: "Challah French Toast", price: 16.0, type: "item", image: "/Challah French Toast.avif" },
  { id: "pane-cunzato", name: "Pane Cunzato", price: 14.0, type: "item", image: "/Pane Cunzato.avif" },
  { id: "mozzarella-sticks", name: "Mozzarella Sticks", price: 12.0, type: "item", image: "/Mozzarella Sticks .avif" },
  { id: "bruschetta", name: "Bruschetta", price: 11.0, type: "item" },
  { id: "calamari", name: "Calamari", price: 14.0, type: "item" },
];

export const saladsItemsFSR: MenuItem[] = [
  { id: "the-caesar", name: "The Caesar", price: 13.0, type: "item", image: "/the-caesar.avif" },
  { id: "winter-insalata", name: "Winter Insalata Della Casa", price: 15.0, type: "item", image: "/Winter Insalata Della Casa.avif" },
  { id: "arugula-salad", name: "Arugula Salad", price: 12.0, type: "item" },
];

export const pizzaItemsFSR: MenuItem[] = [
  { id: "marinara-pizza", name: "Marinara", price: 18.0, type: "item", image: "/Marinara.avif" },
  { id: "pesto-pizza", name: "Pesto", price: 19.0, type: "item", image: "/Pesto.avif" },
  { id: "margherita-pizza", name: "Margherita", price: 17.0, type: "item" },
  { id: "quattro-formaggi", name: "Quattro Formaggi", price: 20.0, type: "item" },
];

export const pastaItemsFSR: MenuItem[] = [
  { id: "bolognese", name: "Bolognese", price: 22.0, type: "item", image: "/Bolognese.avif" },
  { id: "carbonara", name: "Carbonara", price: 21.0, type: "item", image: "/Carbonara.avif" },
  { id: "cacio-e-pepe", name: "Cacio e Pepe", price: 19.0, type: "item", image: "/Cacio e Pepe .avif" },
  { id: "pappardelle", name: "Pappardelle", price: 23.0, type: "item" },
  { id: "rigatoni-vodka", name: "Rigatoni Vodka", price: 20.0, type: "item" },
];

export const dessertsItemsFSR: MenuItem[] = [
  { id: "tiramisu", name: "Tiramisu", price: 12.0, type: "item" },
  { id: "panna-cotta", name: "Panna Cotta", price: 11.0, type: "item" },
  { id: "cannoli", name: "Cannoli", price: 10.0, type: "item" },
  { id: "affogato", name: "Affogato", price: 9.0, type: "item" },
];

export const beveragesItemsFSR: MenuItem[] = [
  { id: "sparkling-water-fsr", name: "Sparkling Water", price: 4.0, type: "item" },
  { id: "still-water-fsr", name: "Still Water", price: 3.0, type: "item" },
  { id: "espresso-fsr", name: "Espresso", price: 4.0, type: "item", image: "/espresso.png" },
  { id: "cappuccino-fsr", name: "Cappuccino", price: 6.0, type: "item", image: "/cappuccino.png" },
  { id: "lemonade-fsr", name: "Lemonade", price: 5.0, type: "item" },
  { id: "negroni", name: "Negroni", price: 16.0, type: "item" },
  { id: "aperol-spritz", name: "Aperol Spritz", price: 15.0, type: "item" },
  { id: "house-red", name: "House Red", price: 14.0, type: "item" },
  { id: "house-white", name: "House White", price: 14.0, type: "item" },
];

export const categoriesFSR: MenuCategory[] = [
  { id: "starters", name: "Starters", type: "category", items: startersItemsFSR },
  { id: "salads", name: "Salads", type: "category", items: saladsItemsFSR },
  { id: "pizza", name: "Pizza", type: "category", items: pizzaItemsFSR },
  { id: "pasta", name: "Pasta", type: "category", items: pastaItemsFSR },
  { id: "desserts", name: "Desserts", type: "category", items: dessertsItemsFSR },
  { id: "beverages", name: "Beverages", type: "category", items: beveragesItemsFSR },
];

export const discountTilesFSR: DiscountTile[] = [
  { id: "fnf-20-fsr", name: "F&F 20% off", type: "discount", discountType: "percentage", value: 20 },
];

// Top 2 rows for the home grid (matches screenshot order).
export const homeRow1ItemsFSR: MenuItem[] = [
  startersItemsFSR[0], // Challah French Toast
  startersItemsFSR[1], // Pane Cunzato
  saladsItemsFSR[0],   // The Caesar
  startersItemsFSR[2], // Mozzarella Sticks
  pastaItemsFSR[0],    // Bolognese
];

export const homeRow2ItemsFSR: MenuItem[] = [
  pizzaItemsFSR[1],    // Pesto
  pastaItemsFSR[2],    // Cacio e Pepe
  saladsItemsFSR[1],   // Winter Insalata Della Casa
  pizzaItemsFSR[0],    // Marinara
  pastaItemsFSR[1],    // Carbonara
];

export const rootTilesFSR: Tile[] = [
  ...homeRow1ItemsFSR,
  ...homeRow2ItemsFSR,
  ...categoriesFSR,
  ...discountTilesFSR,
];

/** Get a single menu item by id from any FSR list. */
export function getMenuItemByIdFSR(itemId: string): MenuItem | undefined {
  const sources: MenuItem[][] = [
    startersItemsFSR,
    saladsItemsFSR,
    pizzaItemsFSR,
    pastaItemsFSR,
    dessertsItemsFSR,
    beveragesItemsFSR,
  ];
  for (const list of sources) {
    const found = list.find((i) => i.id === itemId);
    if (found) return found;
  }
  return undefined;
}
