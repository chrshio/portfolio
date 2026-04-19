/**
 * Which order-level fulfillment IDs collect pickup-style vs shipment-style details.
 * Covers retail (`pickup`, `shipment`) and standard POS (`pick-up`, `to-go`, `delivery`).
 */
export function orderFulfillmentUsesPickupDetails(fulfillmentId: string): boolean {
  return (
    fulfillmentId === "pickup" ||
    fulfillmentId === "pick-up" ||
    fulfillmentId === "to-go"
  );
}

export function orderFulfillmentUsesShipmentDetails(fulfillmentId: string): boolean {
  return fulfillmentId === "shipment" || fulfillmentId === "delivery";
}

export function orderFulfillmentNeedsDetailsModal(fulfillmentId: string): boolean {
  return (
    orderFulfillmentUsesPickupDetails(fulfillmentId) ||
    orderFulfillmentUsesShipmentDetails(fulfillmentId)
  );
}
