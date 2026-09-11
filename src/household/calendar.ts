import { EMPTY_CALENDAR_TODAY_REPLY, EMPTY_CALENDAR_WEEK_REPLY } from './copy';
import {
  calendarBounds,
  normalizeCalendarRange,
  parseToolDate,
  ymdInRange,
  type CalendarRange,
} from './dates';
import { buildEventRecord, calendarConfirmation } from './records';
import type {
  Actor,
  CalendarItem,
  HouseholdStore,
  ToolResult,
  VehicleRecord,
} from './types';

/**
 * Voice calendar scope (same day-fill sources as the PWA, minus bills):
 * - events (titles + dates; this is what add_calendar_note writes)
 * - maintenance nextDue / lastCompleted (task name only)
 * - vehicleTasks nextDue / lastCompleted (vehicle label + task name)
 *
 * Not read by voice: bills, payments, amounts, private notes, passwords, safe, emergency.
 */
export const CALENDAR_VOICE_SCOPE = [
  'events',
  'maintenance',
  'vehicleTasks',
] as const;

function vehicleLabel(vehicle: VehicleRecord | undefined): string {
  if (!vehicle) {
    return 'Vehicle';
  }
  const name = String(vehicle.name || '').trim();
  if (name) {
    return name;
  }
  const bits = [vehicle.year, vehicle.make, vehicle.model]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' ');
  return bits || 'Vehicle';
}

function pushIfDue(
  items: CalendarItem[],
  date: string | undefined,
  start: string,
  end: string,
  title: string,
  kind: CalendarItem['kind'],
): void {
  const ymd = String(date || '').trim();
  if (!ymdInRange(ymd, start, end) || !title.trim()) {
    return;
  }
  items.push({ date: ymd, title: title.trim(), kind });
}

export async function collectCalendarItems(
  store: HouseholdStore,
  range: CalendarRange,
  now = new Date(),
): Promise<{ start: string; end: string; items: CalendarItem[] }> {
  const { start, end } = calendarBounds(range, now);
  const [events, maintenance, vehicles, vehicleTasks] = await Promise.all([
    store.listEvents(),
    store.listMaintenance(),
    store.listVehicles(),
    store.listVehicleTasks(),
  ]);

  const items: CalendarItem[] = [];
  for (const event of events) {
    pushIfDue(items, event.date, start, end, event.title, 'event');
  }
  for (const task of maintenance) {
    pushIfDue(items, task.nextDue, start, end, task.name, 'maintenance');
    if (task.lastCompleted && task.lastCompleted !== task.nextDue) {
      pushIfDue(items, task.lastCompleted, start, end, `${task.name} (done)`, 'maintenance');
    }
  }
  const vehicleById = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
  for (const task of vehicleTasks) {
    const title = `${vehicleLabel(vehicleById.get(task.vehicleId))} · ${task.name}`;
    pushIfDue(items, task.nextDue, start, end, title, 'vehicle');
    if (task.lastCompleted && task.lastCompleted !== task.nextDue) {
      pushIfDue(items, task.lastCompleted, start, end, `${title} (done)`, 'vehicle');
    }
  }

  items.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
  return { start, end, items };
}

export function speakCalendar(range: CalendarRange, items: CalendarItem[]): string {
  if (items.length === 0) {
    return range === 'this_week' ? EMPTY_CALENDAR_WEEK_REPLY : EMPTY_CALENDAR_TODAY_REPLY;
  }
  const lines = items.slice(0, 10).map((item) => `${item.date}: ${item.title}`);
  const extra = items.length > 10 ? `, and ${items.length - 10} more` : '';
  return `${lines.join('. ')}${extra}.`;
}

export async function getCalendar(
  store: HouseholdStore,
  rangeRaw: string | undefined,
  now = new Date(),
): Promise<ToolResult> {
  const range = normalizeCalendarRange(rangeRaw);
  const { start, end, items } = await collectCalendarItems(store, range, now);
  const spoken = speakCalendar(range, items);
  return {
    ok: true,
    spoken,
    data: {
      range,
      start,
      end,
      scope: [...CALENDAR_VOICE_SCOPE],
      items: items.map((item) => ({ date: item.date, title: item.title, kind: item.kind })),
    },
  };
}

export async function addCalendarNote(
  store: HouseholdStore,
  actor: Actor,
  text: string,
  dateRaw: string,
  now = new Date(),
): Promise<ToolResult> {
  const date = parseToolDate(dateRaw, now);
  if (!date) {
    return { ok: false, error: 'bad_date', spoken: 'I need a date for that calendar note.' };
  }
  const record = buildEventRecord(actor, text, date, now);
  if (!record) {
    return { ok: false, error: 'missing_text', spoken: 'What should I put on the calendar?' };
  }
  await store.addEvent(record);
  const spoken = calendarConfirmation(record);
  return {
    ok: true,
    spoken,
    data: { id: record.id, title: record.title, date: record.date, confirmation: spoken },
  };
}
