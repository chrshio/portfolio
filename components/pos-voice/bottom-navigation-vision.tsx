"use client";

import { Check, Wifi } from "lucide-react";
import { useState, useEffect } from "react";
import type { NavItem } from "@/lib/pos-types";
import { cn } from "@/lib/utils";

interface NavItemConfig {
  id: NavItem;
  label: string;
}

const navItems: NavItemConfig[] = [
  { id: "checkout", label: "Checkout" },
  { id: "transactions", label: "Transactions" },
  { id: "orders", label: "Orders" },
  { id: "notifications", label: "Notifications" },
  { id: "more", label: "More" },
];

const enabledTabs: Set<NavItem> = new Set(["checkout", "more"]);

interface BottomNavigationVisionProps {
  activeTab?: NavItem;
  onTabChange?: (tab: NavItem) => void;
}

export function BottomNavigationVision({
  activeTab = "checkout",
  onTabChange,
}: BottomNavigationVisionProps) {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: false,
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="flex items-center justify-between px-4 py-2 bg-black">
      {/* Nav tabs — text only, white pill for active */}
      <div className="flex items-center gap-0.5">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const isEnabled = enabledTabs.has(item.id);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => isEnabled && onTabChange?.(item.id)}
              disabled={!isEnabled}
              className={cn(
                "px-4 py-2 rounded-full transition-all text-sm font-medium",
                isActive ? "bg-[#2b2b2b] text-white" : "text-[#888888]",
                !isEnabled && "pointer-events-none"
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Secondary status — was Line 2 of the status bar */}
      <div className="flex items-center gap-3 text-[#888888]">
        <span className="text-xs font-medium">Oliver & Co.</span>
        <div className="flex items-center gap-1">
          <Check className="w-3 h-3" />
          <span className="text-xs">Reader</span>
        </div>
        <div className="flex items-center gap-1">
          <Check className="w-3 h-3" />
          <span className="text-xs">2 printers</span>
        </div>
        <div className="flex items-center gap-1 border-l border-[#333] pl-3">
          <Wifi className="w-3.5 h-3.5" />
          <span className="text-xs font-medium" suppressHydrationWarning>
            {time || "12:00"}
          </span>
        </div>
      </div>
    </nav>
  );
}
