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
}

export interface MenuCategory {
  id: string;
  name: string;
  type: 'category';
  items?: MenuItem[];
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

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  description?: string;
  modifiers?: string[];
  note?: string;
  fulfillmentMethod?: string;
  taxes?: string[];
  discounts?: string[];
  serviceCharges?: string[];
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
}

// Tab Types
export type TabType = 'keypad' | 'library' | 'cafe';

// Navigation Types
export type NavItem = 'checkout' | 'transactions' | 'orders' | 'notifications' | 'more';
