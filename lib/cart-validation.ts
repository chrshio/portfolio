import type { CartItem, MenuItem, ComboDefinition } from "@/lib/pos-types";
import { getModifierGroups, isGroupRequirementUnmet } from "@/lib/modifiers";

export interface CartValidationOptions {
  getComboDefinition?: (menuItemId: string) => ComboDefinition | null;
  getMenuItemById?: (id: string) => MenuItem | undefined;
  seatingEnabled?: boolean;
}

/** Returns true if the cart item has any unmet required selection (modifiers, combo slots, or seat). */
export function cartItemHasIncompleteRequirements(
  item: CartItem,
  opts: CartValidationOptions = {}
): boolean {
  const { getComboDefinition, getMenuItemById, seatingEnabled } = opts;

  const unmetGroups = getModifierGroups(item).filter((g) =>
    isGroupRequirementUnmet(g, item.modifiers ?? [])
  );
  if (unmetGroups.length > 0) return true;

  if (seatingEnabled && !item.seatId) return true;

  const comboDef =
    item.menuItemId && getComboDefinition
      ? getComboDefinition(item.menuItemId)
      : null;

  if (comboDef) {
    const unmetSlots = comboDef.slots.filter(
      (slot) =>
        slot.type === "category" &&
        !item.comboSelections?.[slot.slotId]?.itemId
    );
    if (unmetSlots.length > 0) return true;

    if (getMenuItemById && item.comboSelections) {
      for (const slot of comboDef.slots) {
        const sel = item.comboSelections[slot.slotId];
        if (!sel?.itemId) continue;
        const menuItem = getMenuItemById(sel.itemId);
        if (!menuItem) continue;
        const groups = getModifierGroups(menuItem);
        for (const group of groups) {
          if (isGroupRequirementUnmet(group, sel.modifiers ?? [])) return true;
        }
      }
    }
  }

  return false;
}

/** Returns true if any cart item has incomplete required selections. */
export function cartHasIncompleteItems(
  items: CartItem[],
  opts: CartValidationOptions = {}
): boolean {
  return items.some((item) => cartItemHasIncompleteRequirements(item, opts));
}
