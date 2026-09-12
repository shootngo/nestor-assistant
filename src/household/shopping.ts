import { EMPTY_SHOPPING_REPLY } from './copy';
import { buildShoppingRecord, shoppingConfirmation } from './records';
import type { Actor, HouseholdStore, ShoppingRecord, ToolResult } from './types';

function aisleLabel(aisle: string): string {
  return aisle.trim() || 'Other';
}

export function sortOpenShopping(items: ShoppingRecord[]): ShoppingRecord[] {
  return items
    .filter((item) => !item.checked)
    .slice()
    .sort((a, b) => {
      const aisleA = aisleLabel(a.aisle).toLowerCase();
      const aisleB = aisleLabel(b.aisle).toLowerCase();
      if (aisleA !== aisleB) {
        if (aisleA === 'other') {
          return 1;
        }
        if (aisleB === 'other') {
          return -1;
        }
        return aisleA.localeCompare(aisleB);
      }
      return String(a.createdAt || '').localeCompare(String(b.createdAt || ''));
    });
}

export function speakShoppingList(items: ShoppingRecord[]): string {
  const open = sortOpenShopping(items);
  if (open.length === 0) {
    return EMPTY_SHOPPING_REPLY;
  }
  const names = open.map((item) => item.text);
  if (names.length === 1) {
    return names[0];
  }
  if (names.length <= 8) {
    const last = names[names.length - 1];
    return `${names.slice(0, -1).join(', ')}, and ${last}.`;
  }
  return `${names.slice(0, 8).join(', ')}, and ${names.length - 8} more.`;
}

export async function addShoppingItem(
  store: HouseholdStore,
  actor: Actor,
  item: string,
  aisle?: string,
): Promise<ToolResult> {
  const record = buildShoppingRecord(actor, item, aisle);
  if (!record) {
    return { ok: false, error: 'missing_item', spoken: 'What should I add to the list?' };
  }
  await store.addShopping(record);
  const spoken = shoppingConfirmation(record);
  return {
    ok: true,
    spoken,
    data: { id: record.id, text: record.text, aisle: record.aisle, confirmation: spoken },
  };
}

export async function getShoppingList(store: HouseholdStore): Promise<ToolResult> {
  const items = await store.listShopping();
  const open = sortOpenShopping(items);
  const spoken = speakShoppingList(items);
  return {
    ok: true,
    spoken,
    data: {
      count: open.length,
      items: open.map((item) => ({ text: item.text, aisle: item.aisle })),
    },
  };
}
