"use client";

import { useState, useMemo } from "react";
import { Search, ArrowLeft, ChevronRight } from "lucide-react";
import { MenuTile } from "@/components/pos/menu-tile";
import type { Tile, MenuItem, MenuCategory } from "@/lib/pos-types";
import { favoritesCategories } from "@/lib/menu-library-retail";
import { cn } from "@/lib/utils";

interface MenuGridRetailProps {
  onAddItem: (item: MenuItem) => void;
}

const tabs = [
  { id: "keypad", label: "Keypad" },
  { id: "library", label: "Library" },
  { id: "favorites", label: "Favorites" },
];

/** Merch IDs to show in the main favorites grid (priority order). */
const FAVORITE_MERCH_IDS = ["water-bottle", "house-cap", "sauna-hat"];

const WINE_CATEGORY_IDS = new Set(["reds", "whites", "rose", "sparkling"]);
const FEATURED_WINE_COUNT = 3;

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function MenuGridRetail({ onAddItem }: MenuGridRetailProps) {
  const [activeTab, setActiveTab] = useState("favorites");
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null);

  const handleTileClick = (tile: Tile) => {
    if (tile.type === "item") {
      onAddItem(tile as MenuItem);
    } else if (tile.type === "category") {
      const cat = tile as MenuCategory;
      if (cat.items && cat.items.length > 0) {
        setSelectedCategory(cat);
      }
    }
  };

  const gridTiles: Tile[] = selectedCategory
    ? (selectedCategory.items ?? [])
    : [];

  const showFavoritesByColumn = !selectedCategory && activeTab === "favorites";

  /** Per-category items to show in the main favorites grid: 2–3 random wines, 4 priority merch. */
  const featuredItemsByCategory = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const cat of favoritesCategories) {
      const items = cat.items ?? [];
      if (cat.id === "merch") {
        const featured = FAVORITE_MERCH_IDS.map((id) => items.find((i) => i.id === id)).filter(
          (i): i is MenuItem => i != null
        );
        map.set(cat.id, featured);
      } else if (WINE_CATEGORY_IDS.has(cat.id)) {
        const shuffled = shuffle(items);
        const count = cat.id === "sparkling" ? 2 : FEATURED_WINE_COUNT;
        map.set(cat.id, shuffled.slice(0, count));
      } else {
        map.set(cat.id, items);
      }
    }
    return map;
  }, []);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-end gap-4 pl-6 pr-6 pt-4 pb-4">
        {selectedCategory ? (
          <>
            <button
              onClick={() => setSelectedCategory(null)}
              className="w-14 h-14 flex items-center justify-center rounded-full bg-[#f0f0f0] shrink-0 transition-colors active:bg-[#e0e0e0]"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 text-[#101010]" />
            </button>

            <div className="flex items-end gap-2 flex-1 border-b border-[#f2f2f2]">
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-[19px] font-semibold text-[#959595] pb-2 transition-colors active:text-[#666]"
              >
                Favorites
              </button>
              <ChevronRight className="w-4 h-4 text-[#c8c8c8] shrink-0 mb-[9px]" />
              <span className="text-[19px] font-semibold text-[#101010] pb-2 border-b-2 border-[#101010] -mb-px">
                {selectedCategory.name}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-end gap-4 flex-1 border-b border-[#f2f2f2]">
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
        )}

        <div className="flex items-center gap-4">
          <button
            className="w-14 h-14 flex flex-col justify-center items-center rounded-full bg-[#f0f0f0] transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5 text-[#101010]" />
          </button>
        </div>
      </div>

      {/* Scrollable grid */}
      <div className="flex-1 overflow-y-auto scrollbar-hide pl-4 pr-6 pb-4">
        {showFavoritesByColumn ? (
          <div className="grid grid-cols-5 gap-3">
            {favoritesCategories.map((cat) => (
              <div key={cat.id} className="flex flex-col gap-3">
                <MenuTile tile={cat} onClick={handleTileClick} />
                {(featuredItemsByCategory.get(cat.id) ?? []).map((item) => (
                  <MenuTile key={item.id} tile={item} onClick={handleTileClick} />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-3">
            {gridTiles.map((tile) => (
              <MenuTile key={tile.id} tile={tile} onClick={handleTileClick} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
