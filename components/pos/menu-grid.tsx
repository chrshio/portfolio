"use client";

import { useState } from "react";
import { Search, Pencil } from "lucide-react";
import { MenuTile } from "./menu-tile";
import type { Tile, TabType, MenuItem } from "@/lib/pos-types";
import {
  featuredItems,
  categories,
  teaItems,
  bakeryItems,
  discountTiles,
} from "@/lib/menu-library";
import { cn } from "@/lib/utils";

interface MenuGridProps {
  onAddItem: (item: MenuItem) => void;
}

const tabs: { id: TabType; label: string }[] = [
  { id: "keypad", label: "Keypad" },
  { id: "library", label: "Library" },
  { id: "cafe", label: "Cafe" },
];

export function MenuGrid({ onAddItem }: MenuGridProps) {
  const [activeTab, setActiveTab] = useState<TabType>("cafe");

  const handleTileClick = (tile: Tile) => {
    if (tile.type === "item") {
      onAddItem(tile as MenuItem);
    }
    // Handle category navigation, discounts, etc.
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tab navigation and action buttons */}
      <div className="flex items-end justify-end gap-4 pl-6 pr-6 pt-4 pb-4">
        <div className="flex items-end gap-4 w-full border-b border-[#f2f2f2]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "text-[19px] font-semibold pb-2 transition-colors border-b-2",
                activeTab === tab.id
                  ? "text-[#101010] border-[#101010]"
                  : "text-[#959595] border-transparent"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button className="w-14 h-14 flex flex-col justify-center items-center rounded-full bg-[#f0f0f0] transition-colors">
            <Search className="w-5 h-5 text-[#101010]" />
          </button>
          <button className="w-14 h-14 flex flex-col justify-center items-center rounded-full bg-[#f0f0f0] transition-colors">
            <Pencil className="w-5 h-5 text-[#101010]" />
          </button>
        </div>
      </div>

      {/* Scrollable grid area */}
      <div className="flex-1 overflow-y-auto pl-4 pr-6 pb-4">
        <div className="grid grid-cols-5 gap-3">
          {/* Featured items with images */}
          {featuredItems.map((item) => (
            <MenuTile key={item.id} tile={item} onClick={handleTileClick} />
          ))}

          {/* Categories */}
          {categories.map((category) => (
            <MenuTile
              key={category.id}
              tile={category}
              onClick={handleTileClick}
            />
          ))}

          {/* Tea items */}
          {teaItems.map((item) => (
            <MenuTile key={item.id} tile={item} onClick={handleTileClick} />
          ))}

          {/* Bakery items */}
          {bakeryItems.map((item) => (
            <MenuTile key={item.id} tile={item} onClick={handleTileClick} />
          ))}

          {/* Discount and action tiles */}
          {discountTiles.map((tile) => (
            <MenuTile key={tile.id} tile={tile} onClick={handleTileClick} />
          ))}
        </div>
      </div>
    </div>
  );
}
