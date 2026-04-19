"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  Customer,
  RetailFulfillmentPickupDetails,
  RetailFulfillmentShipmentDetails,
  RetailOrderFulfillmentDetails,
} from "@/lib/pos-types";
import { getCustomerInitials } from "@/lib/customers-prototype";
import {
  orderFulfillmentUsesPickupDetails,
  orderFulfillmentUsesShipmentDetails,
} from "@/lib/order-fulfillment-details";
import { ShipmentAddressLine1SuggestInput } from "@/components/pos-retail/shipment-address-line1-suggest-input";
import { TextField, TextAreaField } from "@/components/ui/text-field";

const fieldShell = "rounded-xl";

function splitDisplayName(name: string): { first: string; last: string } {
  const t = name.trim();
  const i = t.indexOf(" ");
  if (i === -1) return { first: t, last: "" };
  return { first: t.slice(0, i), last: t.slice(i + 1).trim() };
}

function mergePickupFromCustomer(
  base: RetailFulfillmentPickupDetails,
  customer: Customer | null | undefined,
): RetailFulfillmentPickupDetails {
  if (!customer) return base;
  const { first, last } = splitDisplayName(customer.name);
  return {
    ...base,
    phone: base.phone.trim() || customer.phone?.trim() || "",
    firstName: base.firstName.trim() || first,
    lastName: base.lastName.trim() || last,
  };
}

function mergeShipmentFromCustomer(
  base: RetailFulfillmentShipmentDetails,
  customer: Customer | null | undefined,
): RetailFulfillmentShipmentDetails {
  if (!customer) return base;
  return {
    ...base,
    phone: base.phone.trim() || customer.phone?.trim() || "",
  };
}

function formatCustomerSecondary(customer: Customer): string {
  const parts: string[] = [];
  if (customer.email?.trim()) parts.push(customer.email.trim());
  if (customer.phone?.trim()) parts.push(customer.phone.trim());
  return parts.join(" | ");
}

function FulfillmentAttachedCustomerRow({
  customer,
  onRemove,
}: {
  customer: Customer;
  onRemove: () => void;
}) {
  const secondary = formatCustomerSecondary(customer);
  return (
    <div className="mb-2 w-full border-b border-[#f0f0f0] pb-6">
      <div className="flex w-full items-center gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#f0f0f0] text-[15px] font-medium leading-5 text-[#666]"
            aria-hidden
          >
            {getCustomerInitials(customer)}
          </div>
          <div className="min-w-0 flex-1 flex flex-col gap-0.5">
            <p className="text-[16px] font-medium leading-6 text-[#101010]">
              {customer.name}
            </p>
            {secondary ? (
              <p className="text-[14px] leading-[22px] text-[#666]">
                {secondary}
              </p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded-full bg-[#f0f0f0] px-4 py-2 text-[14px] font-medium leading-5 text-[#cc0023] active:bg-[#e5e5e5]"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

const phoneCountryAdornment = (
  <div className="flex shrink-0 items-center gap-1 border-r border-[#dadada] pr-3">
    <span className="text-[18px] leading-none" aria-hidden>
      🇺🇸
    </span>
    <ChevronDown className="h-4 w-4 shrink-0 text-[#101010]" aria-hidden />
  </div>
);

interface FulfillmentDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Current retail fulfillment id (`pickup` | `shipment`; in-store does not use this modal). */
  fulfillmentId: string;
  /** Header text (e.g. "Pickup", "Shipment"). */
  fulfillmentLabel: string;
  details: RetailOrderFulfillmentDetails;
  onSave: (next: RetailOrderFulfillmentDetails) => void;
  /** Retail: open add-customer flow. Omit on cafe/QSR variants to hide the CTA. */
  onOpenAddCustomer?: () => void;
  /** Cart customer, if any — shown as a summary row and used to pre-fill empty fields when the modal opens. */
  attachedCustomer?: Customer | null;
  onRemoveAttachedCustomer?: () => void;
  /** When set, the header back control runs this (e.g. close details and reopen fulfillment method picker) instead of only closing. */
  onBackToFulfillmentMethod?: () => void;
}

export function FulfillmentDetailsModal({
  open,
  onOpenChange,
  fulfillmentId,
  fulfillmentLabel,
  details,
  onSave,
  onOpenAddCustomer,
  attachedCustomer = null,
  onRemoveAttachedCustomer,
  onBackToFulfillmentMethod,
}: FulfillmentDetailsModalProps) {
  const [pickup, setPickup] = useState(details.pickup);
  const [shipment, setShipment] = useState(details.shipment);
  const attachedCustomerRef = useRef(attachedCustomer);
  attachedCustomerRef.current = attachedCustomer;

  useEffect(() => {
    if (!open) return;
    const customer = attachedCustomerRef.current;
    setPickup(mergePickupFromCustomer(details.pickup, customer));
    setShipment(mergeShipmentFromCustomer(details.shipment, customer));
  }, [open, details.pickup, details.shipment]);

  const handleDone = () => {
    onSave({ pickup, shipment });
    onOpenChange(false);
  };

  const handleBack = () => {
    if (onBackToFulfillmentMethod) {
      onBackToFulfillmentMethod();
    } else {
      onOpenChange(false);
    }
  };

  const isPickup = orderFulfillmentUsesPickupDetails(fulfillmentId);
  const isShipment = orderFulfillmentUsesShipmentDetails(fulfillmentId);

  const addCustomerBlock =
    onOpenAddCustomer != null ? (
      <button
        type="button"
        onClick={() => {
          onOpenChange(false);
          onOpenAddCustomer();
        }}
        className="w-full rounded-full bg-[#f0f0f0] py-3 text-center text-[14px] font-medium leading-[22px] text-[#101010] active:bg-[#e5e5e5]"
      >
        Add new or existing customer
      </button>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[85vh] w-[664px] max-w-[min(664px,calc(100vw-2rem))] flex-col gap-0 overflow-hidden rounded-xl border-0 p-0 shadow-xl sm:max-w-[min(664px,calc(100vw-2rem))] top-[68px] left-1/2 translate-x-[-50%] translate-y-0"
        showCloseButton={false}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-8 pb-8 pt-6">
          <div className="flex shrink-0 items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f0f0f0] active:bg-[#e5e5e5]"
              aria-label={
                onBackToFulfillmentMethod
                  ? "Back to fulfillment method"
                  : "Back"
              }
            >
              <ArrowLeft className="h-6 w-6 text-[#101010]" />
            </button>
            <button
              type="button"
              onClick={handleDone}
              className="shrink-0 rounded-full bg-[#101010] px-6 py-3 text-[16px] font-semibold leading-6 text-white active:bg-[#2a2a2a]"
            >
              Done
            </button>
          </div>

          <DialogTitle className="text-left text-[25px] font-semibold leading-8 text-[#101010]">
            {fulfillmentLabel}
          </DialogTitle>

          {isPickup && (
            <div className="flex flex-col gap-4">
              {attachedCustomer && onRemoveAttachedCustomer ? (
                <FulfillmentAttachedCustomerRow
                  customer={attachedCustomer}
                  onRemove={onRemoveAttachedCustomer}
                />
              ) : (
                addCustomerBlock
              )}

              <TextField
                label="Phone number"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                startAdornment={phoneCountryAdornment}
                value={pickup.phone}
                onChange={(e) =>
                  setPickup((p) => ({ ...p, phone: e.target.value }))
                }
                wrapperClassName={fieldShell}
              />

              <div className="grid grid-cols-2 gap-3">
                <TextField
                  label="First name"
                  autoComplete="given-name"
                  value={pickup.firstName}
                  onChange={(e) =>
                    setPickup((p) => ({ ...p, firstName: e.target.value }))
                  }
                  wrapperClassName={fieldShell}
                />
                <TextField
                  label="Last name"
                  autoComplete="family-name"
                  value={pickup.lastName}
                  onChange={(e) =>
                    setPickup((p) => ({ ...p, lastName: e.target.value }))
                  }
                  wrapperClassName={fieldShell}
                />
              </div>

              <TextField
                label="Guest identifier (not visible to customers)"
                value={pickup.guestIdentifier}
                onChange={(e) =>
                  setPickup((p) => ({ ...p, guestIdentifier: e.target.value }))
                }
                wrapperClassName={fieldShell}
              />

              <TextAreaField
                label="Add note (not visible to customers)"
                value={pickup.note}
                onChange={(e) =>
                  setPickup((p) => ({ ...p, note: e.target.value }))
                }
                rows={4}
                wrapperClassName={fieldShell}
              />
            </div>
          )}

          {isShipment && (
            <div className="flex flex-col gap-4">
              {attachedCustomer && onRemoveAttachedCustomer ? (
                <FulfillmentAttachedCustomerRow
                  customer={attachedCustomer}
                  onRemove={onRemoveAttachedCustomer}
                />
              ) : (
                addCustomerBlock
              )}

              <ShipmentAddressLine1SuggestInput
                wrapperClassName={fieldShell}
                value={shipment.addressLine1}
                onLine1Change={(line1) =>
                  setShipment((s) => ({ ...s, addressLine1: line1 }))
                }
                onApplySuggestion={(patch) =>
                  setShipment((s) => ({ ...s, ...patch }))
                }
              />
              <TextField
                label="Address line 2 (optional)"
                autoComplete="address-line2"
                value={shipment.addressLine2}
                onChange={(e) =>
                  setShipment((s) => ({ ...s, addressLine2: e.target.value }))
                }
                wrapperClassName={fieldShell}
              />
              <div className="grid grid-cols-2 gap-3">
                <TextField
                  label="City"
                  autoComplete="address-level2"
                  value={shipment.city}
                  onChange={(e) =>
                    setShipment((s) => ({ ...s, city: e.target.value }))
                  }
                  wrapperClassName={fieldShell}
                />
                <TextField
                  label="State / region"
                  autoComplete="address-level1"
                  value={shipment.region}
                  onChange={(e) =>
                    setShipment((s) => ({ ...s, region: e.target.value }))
                  }
                  wrapperClassName={fieldShell}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <TextField
                  label="Postal code"
                  autoComplete="postal-code"
                  value={shipment.postalCode}
                  onChange={(e) =>
                    setShipment((s) => ({ ...s, postalCode: e.target.value }))
                  }
                  wrapperClassName={fieldShell}
                />
                <TextField
                  label="Country"
                  autoComplete="country-name"
                  value={shipment.country}
                  onChange={(e) =>
                    setShipment((s) => ({ ...s, country: e.target.value }))
                  }
                  endAdornment={
                    <ChevronDown
                      className="h-4 w-4 text-[#101010]"
                      aria-hidden
                    />
                  }
                  wrapperClassName={fieldShell}
                />
              </div>

              <TextField
                label="Phone number"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                startAdornment={phoneCountryAdornment}
                value={shipment.phone}
                onChange={(e) =>
                  setShipment((s) => ({ ...s, phone: e.target.value }))
                }
                wrapperClassName={fieldShell}
              />

              <TextAreaField
                label="Delivery note (not visible to customers)"
                value={shipment.note}
                onChange={(e) =>
                  setShipment((s) => ({ ...s, note: e.target.value }))
                }
                rows={4}
                wrapperClassName={fieldShell}
              />
            </div>
          )}

          {!isPickup && !isShipment && (
            <p className="text-[14px] leading-[22px] text-[#666]">
              No additional fields for this fulfillment type.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
