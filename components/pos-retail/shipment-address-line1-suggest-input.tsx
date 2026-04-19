"use client";

import { useEffect, useId, useRef, useState } from "react";
import type {
  AddressSuggestionItem,
  AddressSuggestResponse,
} from "@/lib/address-suggest-types";
import type { RetailFulfillmentShipmentDetails } from "@/lib/pos-types";
import { TextField } from "@/components/ui/text-field";

type AddressFieldsPatch = Pick<
  RetailFulfillmentShipmentDetails,
  | "addressLine1"
  | "addressLine2"
  | "city"
  | "region"
  | "postalCode"
  | "country"
>;

type ShipmentAddressLine1SuggestInputProps = {
  value: string;
  onLine1Change: (line1: string) => void;
  onApplySuggestion: (patch: AddressFieldsPatch) => void;
  wrapperClassName?: string;
};

export function ShipmentAddressLine1SuggestInput({
  value,
  onLine1Change,
  onApplySuggestion,
  wrapperClassName,
}: ShipmentAddressLine1SuggestInputProps) {
  const listId = useId();
  const [focused, setFocused] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AddressSuggestionItem[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!focused) return;

    const q = value.trim();
    if (q.length < 3) {
      abortRef.current?.abort();
      setItems([]);
      setPanelOpen(false);
      setLoading(false);
      return;
    }

    const timer = window.setTimeout(() => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setItems([]);
      setLoading(true);
      setPanelOpen(true);

      void (async () => {
        try {
          const res = await fetch(
            `/api/address-suggest?q=${encodeURIComponent(q)}`,
            { signal: ac.signal },
          );
          const json = (await res.json()) as AddressSuggestResponse;
          if (ac.signal.aborted) return;
          setItems(Array.isArray(json.suggestions) ? json.suggestions : []);
        } catch (err: unknown) {
          if (err instanceof Error && err.name === "AbortError") return;
          if (!ac.signal.aborted) setItems([]);
        } finally {
          if (!ac.signal.aborted) setLoading(false);
        }
      })();
    }, 450);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value, focused]);

  const pick = (row: AddressSuggestionItem) => {
    onApplySuggestion({
      addressLine1: row.addressLine1,
      addressLine2: row.addressLine2,
      city: row.city,
      region: row.region,
      postalCode: row.postalCode,
      country: row.country,
    });
    setItems([]);
    setPanelOpen(false);
  };

  const showPanel = panelOpen && focused && value.trim().length >= 3;
  const showEmpty = !loading && items.length === 0;

  return (
    <div className="relative">
      <TextField
        label="Address line 1"
        value={value}
        onChange={(e) => onLine1Change(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          window.setTimeout(() => {
            setFocused(false);
            setPanelOpen(false);
          }, 200);
        }}
        autoComplete="address-line1"
        role="combobox"
        aria-expanded={showPanel && (loading || items.length > 0 || showEmpty)}
        aria-controls={listId}
        aria-autocomplete="list"
        wrapperClassName={wrapperClassName}
      />
      {showPanel ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Address suggestions"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[220px] overflow-y-auto rounded-lg border border-[#dadada] bg-white py-1 shadow-lg"
        >
          {loading ? (
            <li
              className="px-4 py-3 text-[14px] leading-[22px] text-[#666]"
              aria-live="polite"
            >
              Searching…
            </li>
          ) : null}
          {!loading && showEmpty ? (
            <li className="px-4 py-3 text-[14px] leading-[22px] text-[#666]">
              No matches
            </li>
          ) : null}
          {!loading
            ? items.map((row) => (
                <li key={row.id} role="none">
                  <button
                    type="button"
                    role="option"
                    className="w-full px-4 py-2.5 text-left text-[14px] leading-[20px] text-[#101010] active:bg-[#f0f0f0]"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(row)}
                  >
                    <span className="block font-medium">{row.addressLine1}</span>
                    <span className="mt-0.5 block text-[13px] font-normal leading-[18px] text-[#666666]">
                      {[row.city, row.region, row.postalCode]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </button>
                </li>
              ))
            : null}
        </ul>
      ) : null}
    </div>
  );
}
