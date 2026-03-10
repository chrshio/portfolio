"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronRight, Plus, Calculator, ShoppingBag, Sandwich, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBar } from "@/components/pos/status-bar";

interface SettingsRowProps {
  label: string;
  value?: string;
}

function SettingsRow({ label, value }: SettingsRowProps) {
  return (
    <div className="flex items-center gap-4 py-4 w-full">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <p className="flex-1 font-medium text-[16px] leading-6 text-[#101010] min-w-0">
          {label}
        </p>
        {value && (
          <p className="text-[16px] leading-6 text-[#101010] text-right whitespace-nowrap">
            {value}
          </p>
        )}
        <ChevronRight className="w-4 h-4 text-[#101010] shrink-0" />
      </div>
    </div>
  );
}

function RadioButton({ selected }: { selected: boolean }) {
  return (
    <div className="shrink-0 w-5 h-5">
      {selected ? (
        <div className="w-5 h-5 rounded-full border-[6px] border-[#101010]" />
      ) : (
        <div className="w-5 h-5 rounded-full border-2 border-[#959595]" />
      )}
    </div>
  );
}

function SquareLogo() {
  return (
    <img
      src="/square.svg"
      alt=""
      width={60}
      height={60}
      className="w-[60px] h-[60px]"
    />
  );
}

const sidebarItems = [
  "Checkout",
  "Hardware",
  "Security",
  "Account",
  "Customers",
  "Information Requests",
  "Orders",
  "Online",
];

interface CheckoutSettingsGroup {
  rows: SettingsRowProps[];
}

const cartDisplayGroup: CheckoutSettingsGroup = {
  rows: [{ label: "Cart display", value: "Right" }],
};

const mainSettingsGroup: CheckoutSettingsGroup = {
  rows: [
    { label: "Quick amounts", value: "Off" },
    { label: "Sales taxes" },
    { label: "Offline payments", value: "Off" },
    { label: "Order tickets", value: "Manual" },
    { label: "Payment" },
    { label: "Tipping", value: "Off" },
    { label: "Signature and receipt" },
    { label: "Customer management", value: "On" },
    { label: "Payment sounds", value: "Off" },
  ],
};

interface ModeOption {
  id: string;
  label: string;
  path: string;
  devices: number;
  Icon: React.ComponentType<{ className?: string }>;
}

const modeOptions: ModeOption[] = [
  { id: "cafe", label: "Standard", path: "/prototypes/checkout-pos/cafe", devices: 4, Icon: Calculator },
  { id: "qsr", label: "QSR", path: "/prototypes/checkout-pos/qsr", devices: 2, Icon: Sandwich },
  { id: "fsr", label: "FSR", path: "/prototypes/checkout-pos/fsr", devices: 2, Icon: UtensilsCrossed },
  { id: "retail", label: "Retail", path: "/prototypes/checkout-pos/retail", devices: 1, Icon: ShoppingBag },
];

const LOADING_DURATION_MS = 1500;

interface SettingsPageProps {
  variantLabel?: string;
}

export function SettingsPage({ variantLabel = "Standard" }: SettingsPageProps) {
  const router = useRouter();
  const [activeSidebarItem, setActiveSidebarItem] = useState("Checkout");
  const [modeSheetOpen, setModeSheetOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState(variantLabel);
  const [loadingTarget, setLoadingTarget] = useState<ModeOption | null>(null);

  const currentMode = modeOptions.find(
    (m) => m.label.toLowerCase() === selectedMode.toLowerCase()
  ) ?? modeOptions[0];

  const handleModeSelect = useCallback(
    (mode: ModeOption) => {
      setModeSheetOpen(false);
      if (mode.label.toLowerCase() === variantLabel.toLowerCase()) {
        setSelectedMode(mode.label);
        return;
      }
      setLoadingTarget(mode);
    },
    [variantLabel]
  );

  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    if (!loadingTarget) return;
    const timer = setTimeout(() => {
      router.push(loadingTarget.path);
    }, LOADING_DURATION_MS);
    return () => clearTimeout(timer);
  }, [loadingTarget, router]);

  useEffect(() => {
    if (!loadingTarget) {
      setLoadingProgress(0);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min(100, (elapsed / LOADING_DURATION_MS) * 100);
      setLoadingProgress(Math.round(pct));
      if (pct < 100) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [loadingTarget]);

  if (loadingTarget) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col bg-white">
        <StatusBar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <SquareLogo />
          <span
            className="tabular-nums text-[19px] font-normal text-[#101010]"
            style={{ fontFamily: 'var(--font-cash-sans-mono)' }}
          >
            {loadingProgress}%
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 w-full bg-white">
      {/* Left sidebar */}
      <div className="flex flex-col gap-6 h-full shrink-0 overflow-y-auto border-r border-[#f0f0f0] pt-6 px-6 pb-6 w-[340px]">
        {/* Settings title */}
        <div className="flex items-start min-h-[48px]">
          <h1 className="font-semibold text-[25px] leading-8 text-[#101010] w-full overflow-hidden text-ellipsis">
            Settings
          </h1>
        </div>

        {/* Search field */}
        <div className="flex items-center gap-3 min-h-[48px] px-5 py-3 border border-[#dadada] rounded-full w-full">
          <Search className="w-6 h-6 text-[#666] shrink-0" />
          <span className="text-[16px] leading-6 text-[#666]">Search</span>
        </div>

        {/* Mode card */}
        <button
          type="button"
          onClick={() => setModeSheetOpen(true)}
          className="flex flex-col items-start justify-center p-4 border border-[#f0f0f0] rounded-xl w-full bg-white text-left"
        >
          <div className="flex items-center gap-4 h-10 w-full">
            <currentMode.Icon className="w-6 h-6 text-[#101010] shrink-0" />
            <div className="flex flex-col flex-1 min-w-0">
              <p className="font-medium text-[16px] leading-6 text-[#101010]">
                {currentMode.label} mode
              </p>
              <p className="text-[14px] leading-[22px] text-[#666]">
                Active on {currentMode.devices} device{currentMode.devices !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </button>

        {/* Settings nav section */}
        <div className="flex flex-col gap-3 w-full">
          <div className="flex items-start min-h-[48px]">
            <h2 className="font-semibold text-[19px] leading-[26px] text-[#101010] w-full overflow-hidden text-ellipsis">
              Settings
            </h2>
          </div>

          <div className="flex flex-col w-full">
            {sidebarItems.map((item) => {
              const isActive = activeSidebarItem === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setActiveSidebarItem(item)}
                  className={cn(
                    "flex items-center gap-2 min-h-[48px] py-3 w-full text-left -mx-2 px-2 rounded-md",
                    isActive
                      ? "bg-[#e8e8e8] font-medium text-[#101010]"
                      : "bg-transparent font-medium text-[#101010]"
                  )}
                >
                  <p className="flex-1 text-[16px] leading-6">
                    {item}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right content area */}
      <div className="flex-1 h-full min-w-0 overflow-x-hidden overflow-y-auto pt-6 pl-10 pr-10 pb-6">
        <div className="flex flex-col gap-6 max-w-[800px]">
          {/* Header */}
          <div className="flex items-center gap-4 w-full overflow-hidden">
            <div className="flex-1 flex items-center gap-2 min-h-[48px] min-w-0">
              <h2 className="font-semibold text-[25px] leading-8 text-[#101010] overflow-hidden text-ellipsis whitespace-nowrap">
                {activeSidebarItem}
              </h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                className="flex items-center justify-center gap-2 min-h-[48px] min-w-[80px] px-5 py-3 bg-[#f0f0f0] rounded-xl"
              >
                <span className="font-medium text-[16px] leading-6 text-[#101010] text-center whitespace-nowrap">
                  Switch
                </span>
              </button>
              <button
                type="button"
                className="flex items-center justify-center min-h-[48px] min-w-[48px] p-3 bg-[#f0f0f0] rounded-xl"
              >
                <Plus className="w-6 h-6 text-[#101010]" />
              </button>
            </div>
          </div>

          {/* Cart display card */}
          <div className="flex flex-col w-full">
            <div className="border border-[#f0f0f0] rounded-xl px-4 py-2 overflow-hidden">
              {cartDisplayGroup.rows.map((row, i) => (
                <SettingsRow key={i} label={row.label} value={row.value} />
              ))}
            </div>
          </div>

          {/* Main settings card */}
          <div className="flex flex-col w-full">
            <div className="border border-[#f0f0f0] rounded-xl px-4 py-2 overflow-hidden">
              {mainSettingsGroup.rows.map((row, i) => (
                <SettingsRow key={i} label={row.label} value={row.value} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Select mode sheet */}
      <Dialog open={modeSheetOpen} onOpenChange={setModeSheetOpen}>
        <DialogContent
          className="top-auto bottom-4 left-1/2 translate-x-[-50%] translate-y-0 w-[464px] max-w-[min(464px,calc(100%-2rem))] flex flex-col items-center gap-0 border-0 p-0 shadow-xl bg-transparent"
          showCloseButton={false}
        >
          {/* Handle — outside sheet, above */}
          <div className="flex flex-col items-center justify-center pb-2 shrink-0">
            <div className="w-14 h-1.5 rounded-full bg-black/20" />
          </div>

          {/* Sheet content */}
          <div className="flex flex-col gap-2 px-6 pb-6 pt-6 w-full rounded-xl bg-white shadow-xl">
            <DialogTitle className="font-semibold text-[25px] leading-8 text-[#101010]">
              Select mode
            </DialogTitle>

            <div className="flex flex-col">
              {modeOptions.map((mode, index) => {
                const isSelected = mode.label.toLowerCase() === selectedMode.toLowerCase();
                const isLast = index === modeOptions.length - 1;
                const ModeIcon = mode.Icon;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => handleModeSelect(mode)}
                    className={cn(
                      "flex items-center gap-4 py-4 w-full text-left",
                      !isLast && "border-b border-[#f0f0f0]"
                    )}
                  >
                    <ModeIcon className="w-6 h-6 text-[#101010] shrink-0" />
                    <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                      <p className="font-medium text-[16px] leading-6 text-[#101010]">
                        {mode.label} mode
                      </p>
                      <p className="text-[14px] leading-[22px] text-[#666]">
                        Active on {mode.devices} device{mode.devices !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <RadioButton selected={isSelected} />
                  </button>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
