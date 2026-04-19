import type {
  Customer,
  RetailOrderFulfillmentDetails,
} from "@/lib/pos-types";
import {
  orderFulfillmentUsesPickupDetails,
  orderFulfillmentUsesShipmentDetails,
} from "@/lib/order-fulfillment-details";

function formatPhoneDisplay(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 10) {
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  if (d.length === 11 && d.startsWith("1")) {
    return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  }
  return phone.trim();
}

function joinSummary(parts: (string | undefined | null)[]): string {
  return parts
    .map((p) => p?.trim())
    .filter((p): p is string => !!p && p.length > 0)
    .join(", ");
}

/**
 * Single-line summary for the cart fulfillment header (name, phone, address fragments).
 */
export function formatRetailOrderFulfillmentSummary(
  fulfillmentId: string,
  details: RetailOrderFulfillmentDetails,
  customer: Customer | null | undefined,
): string {
  if (fulfillmentId === "in-store" || fulfillmentId === "for-here") return "";

  if (orderFulfillmentUsesPickupDetails(fulfillmentId)) {
    const p = details.pickup;
    const nameFromForm = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
    const name = nameFromForm || customer?.name?.trim() || "";
    const phoneRaw = (p.phone || customer?.phone || "").trim();
    const phone = phoneRaw ? formatPhoneDisplay(phoneRaw) : "";
    return joinSummary([name, phone]);
  }

  if (orderFulfillmentUsesShipmentDetails(fulfillmentId)) {
    const s = details.shipment;
    const name = customer?.name?.trim() || "";
    const phoneRaw = (s.phone || customer?.phone || "").trim();
    const phone = phoneRaw ? formatPhoneDisplay(phoneRaw) : "";
    const street = [s.addressLine1, s.addressLine2].filter(Boolean).join(", ").trim();
    const cityLine = [s.city, s.region, s.postalCode].filter(Boolean).join(", ").trim();
    const tail = [street, cityLine, s.country?.trim()].filter(Boolean).join(", ");
    return joinSummary([name, phone, tail || undefined]);
  }

  return "";
}
