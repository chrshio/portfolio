// POS Tile Types
export type TileType = 'item' | 'category' | 'action' | 'discount';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  type: 'item';
  soldOut?: boolean;
  category?: string;
  description?: string;
  /** When 'contain', image fits inside tile with gray background (e.g. wine bottles). */
  imageFit?: 'cover' | 'contain';
}

/** Optional variant for category tile styling (e.g. colored backgrounds in retail). */
export type MenuCategoryVariant =
  | 'default'
  | 'green'
  | 'blue'
  | 'amber'
  | 'rose'
  | 'pink'
  | 'slate'
  | 'teal';

export interface MenuCategory {
  id: string;
  name: string;
  type: 'category';
  items?: MenuItem[];
  variant?: MenuCategoryVariant;
}

export interface ActionTile {
  id: string;
  name: string;
  type: 'action';
  action: string;
  variant?: 'default' | 'success' | 'warning';
}

export interface DiscountTile {
  id: string;
  name: string;
  type: 'discount';
  discountType: 'percentage' | 'fixed';
  value: number;
  variant?: 'default' | 'success';
}

export type Tile = MenuItem | MenuCategory | ActionTile | DiscountTile;

export interface MenuGroup {
  id: string;
  name: string;
  tiles: Tile[];
}

/** Combo slot: fixed = one specific item (can only modify); category = pick one from category. */
export interface ComboSlot {
  slotId: string;
  label: string;
  type: "fixed" | "category";
  /** Set when type === "fixed". */
  itemId?: string;
  /** Set when type === "category" (e.g. "sides", "drinks"). */
  categoryId?: string;
  /** When type === "category", optional extra cost per item (itemId -> dollars). Shown as secondary "+$X.00" in picker. */
  itemPriceAdjustments?: Record<string, number>;
}

export interface ComboDefinition {
  slots: ComboSlot[];
}

/** Per-slot selection for combo items: item id and optional modifiers for that line. */
export interface ComboSlotSelection {
  itemId: string;
  modifiers?: string[];
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  description?: string;
  modifiers?: string[];
  /** Combo meal slot selections: slotId -> { itemId, modifiers }. */
  comboSelections?: Record<string, ComboSlotSelection>;
  /** Original menu item id (e.g. tenders-meal); used to look up combo definition when editing. */
  menuItemId?: string;
  note?: string;
  fulfillmentMethod?: string;
  taxes?: string[];
  discounts?: string[];
  serviceCharges?: string[];
  /** FSR coursing: which course this item belongs to. */
  courseId?: string;
  /** FSR seating: which seat this item is for (e.g. "seat-1"). */
  seatId?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
}

// --- Cart accessories (e.g. customer for retail) ---

export type CartAccessoryKind = "customer";

export interface CartAccessory {
  id: string;
  kind: CartAccessoryKind;
}

/** Customer from database — used for attaching to cart (e.g. retail). */
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  /** Loyalty stars for display in cart. */
  stars?: number;
}

// --- Coursing (FSR) ---

export interface CourseDefinition {
  id: string;
  label: string;
  /** When false (Straight fire), no fire/hold toggle — items fire immediately. */
  holdable: boolean;
}

export const FSR_COURSES: CourseDefinition[] = [
  { id: "straight-fire", label: "Straight fire", holdable: false },
  { id: "apps", label: "Apps", holdable: true },
  { id: "mains", label: "Mains", holdable: true },
  { id: "desserts", label: "Desserts", holdable: true },
];

// --- Sent items (FSR) ---

export interface SentCourseGroup {
  courseId: string;
  courseLabel: string;
  firedAt: string;
  firedBy: string;
  items: CartItem[];
}

export interface SentBatch {
  id: string;
  groups: SentCourseGroup[];
}

// Tab Types
export type TabType = 'keypad' | 'library' | 'cafe';

// Navigation Types
export type NavItem = 'checkout' | 'transactions' | 'orders' | 'notifications' | 'more';
