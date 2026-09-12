import { addedCalendarLine, addedShoppingLine } from './copy';
import { stampNew, uid } from './ids';
import type { Actor, EventRecord, ShoppingRecord } from './types';

/** Exact `saveShopping` keys from shootngo/Nestor `js/store.js`. */
export const SHOPPING_FIELDS = [
  'id',
  'text',
  'aisle',
  'notes',
  'checked',
  'createdBy',
  'createdAt',
  'updatedBy',
  'updatedAt',
] as const;

/** Exact `saveEvent` keys from shootngo/Nestor `js/store.js`. */
export const EVENT_FIELDS = [
  'id',
  'title',
  'date',
  'notes',
  'billId',
  'createdBy',
  'createdAt',
  'updatedBy',
  'updatedAt',
] as const;

export function buildShoppingRecord(
  actor: Actor,
  item: string,
  aisle = '',
  at = new Date(),
): ShoppingRecord | null {
  const text = String(item ?? '').trim().slice(0, 120);
  if (!text) {
    return null;
  }
  return {
    id: uid(),
    text,
    aisle: String(aisle ?? '').trim().slice(0, 40),
    notes: '',
    checked: false,
    ...stampNew(actor, at.toISOString()),
  };
}

export function buildEventRecord(
  actor: Actor,
  title: string,
  date: string,
  at = new Date(),
): EventRecord | null {
  const trimmed = String(title ?? '').trim().slice(0, 80);
  if (!trimmed || !date) {
    return null;
  }
  return {
    id: uid(),
    title: trimmed,
    date,
    notes: '',
    billId: '',
    ...stampNew(actor, at.toISOString()),
  };
}

export function shoppingConfirmation(record: ShoppingRecord): string {
  return addedShoppingLine(record.text, record.aisle);
}

export function calendarConfirmation(record: EventRecord): string {
  return addedCalendarLine(record.title, record.date);
}
