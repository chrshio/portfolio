"use client";

import {
  FulfillmentMethodModal as SharedFulfillmentMethodModal,
} from "@/components/pos/fulfillment-method-modal";
import { RETAIL_ORDER_FULFILLMENTS } from "@/lib/pos-types";

interface FulfillmentMethodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedId: string;
  onSelect: (fulfillmentId: string) => void;
}

/** Retail-specific fulfillment modal: uses RETAIL_ORDER_FULFILLMENTS (In store, Shipment, Pickup). */
export function FulfillmentMethodModal({
  open,
  onOpenChange,
  selectedId,
  onSelect,
}: FulfillmentMethodModalProps) {
  return (
    <SharedFulfillmentMethodModal
      open={open}
      onOpenChange={onOpenChange}
      selectedId={selectedId}
      onSelect={onSelect}
      options={RETAIL_ORDER_FULFILLMENTS}
    />
  );
}
