"use client";

import {
  LayoutGrid,
  ArrowLeftRight,
  ClipboardList,
  Bell,
  Menu,
} from "lucide-react";
import type { NavItem } from "@/lib/pos-types";
import { cn } from "@/lib/utils";

interface NavItemConfig {
  id: NavItem;
  label: string;
  icon: typeof LayoutGrid;
}

const navItems: NavItemConfig[] = [
  { id: "checkout", label: "Checkout", icon: LayoutGrid },
  { id: "transactions", label: "Transactions", icon: ArrowLeftRight },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "more", label: "More", icon: Menu },
];

const defaultEnabledTabs: Set<NavItem> = new Set(["checkout", "more"]);

interface BottomNavigationProps {
  activeTab?: NavItem;
  onTabChange?: (tab: NavItem) => void;
  /** Tabs that are clickable. If not provided, checkout and more are enabled. */
  enabledTabs?: NavItem[];
}

export function BottomNavigation({ activeTab = "checkout", onTabChange, enabledTabs: enabledTabsProp }: BottomNavigationProps) {
  const enabledSet = enabledTabsProp ? new Set(enabledTabsProp) : defaultEnabledTabs;
  return (
    <nav className="flex items-center justify-center gap-2 px-4 py-2 bg-[#ffffff] border-t border-[#f0f0f0]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        const isEnabled = enabledSet.has(item.id);

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => isEnabled && onTabChange?.(item.id)}
            disabled={!isEnabled}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-full transition-all",
              isActive
                ? "bg-[#f0f0f0] text-[#101010]"
                : "text-[#666666]",
              !isEnabled && "pointer-events-none disabled:opacity-100 disabled:cursor-default"
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
