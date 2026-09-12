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
  MaintenanceRecord,
  ToolResult,
  VehicleRecord,
  VehicleTaskRecord,
} from './types';

/**
 * Voice calendar:
 * - Main path: `events` titles + YYYY-MM-DD dates (what add_calendar_note writes)
 * - Optional: `maintenance` / `vehicleTasks` `nextDue` as short reminders, only if the title is clean
 * - Never: bills, payments, amounts, event notes, lastCompleted, private data
 */
export const CALENDAR_VOICE_SCOPE = ['events'] as const;

export const CALENDAR_REMINDER_SCOPE = ['maintenance', 'vehicleTasks'] as const;

const UNCLEAN_REMINDER =
  /\b(password|passcode|safe|combo|combination|emergency|bill|bills|payment|amount|secret|pin)\b/i;

function vehicleLabel(vehicle: VehicleRecord | undefined): string {
  if (!vehicle) {
    return '';
  }
  const name = String(vehicle.name || '').trim();
  if (name) {
    return name;
  }
  return [vehicle.year, vehicle.make, vehicle.model]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' ');
}

export function isCleanReminderTitle(title: string): boolean {
  const text = title.trim();
  if (!text || text.length > 80) {
    return false;
  }
  return !UNCLEAN_REMINDER.test(text);
}

function pushDated(
  items: CalendarItem[],
  date: string | undefined,
  start: string,
  end: string,
  title: string,
  kind: CalendarItem['kind'],
): void {
  const ymd = String(date || '').trim();
  const label = title.trim();
  if (!ymdInRange(ymd, start, end) || !label) {
    return;
  }
  if (kind === 'reminder' && !isCleanReminderTitle(label)) {
    return;
  }
  items.push({ date: ymd, title: label, kind });
}

async function settledList<T>(load: () => Promise<T[]>): Promise<T[]> {
  try {
    return await load();
  } catch {
    return [];
  }
}

function reminderTitle(task: MaintenanceRecord | VehicleTaskRecord, vehicles: VehicleRecord[]): string {
  if ('vehicleId' in task) {
    const vehicle = vehicles.find((entry) => entry.id === task.vehicleId);
    const label = vehicleLabel(vehicle);
    if (!label || !String(task.name || '').trim()) {
      return '';
    }
    return `${label} · ${task.name}`.trim();
  }
  return String(task.name || '').trim();
}

export async function collectCalendarItems(
  store: HouseholdStore,
  range: CalendarRange,
  now = new Date(),
): Promise<{ start: string; end: string; events: CalendarItem[]; reminders: CalendarItem[] }> {
  const { start, end } = calendarBounds(range, now);
  const eventsRaw = await store.listEvents();
  const events: CalendarItem[] = [];
  for (const event of eventsRaw) {
    pushDated(events, event.date, start, end, event.title, 'event');
  }
  events.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));

  const [maintenance, vehicles, vehicleTasks] = await Promise.all([
    settledList(() => store.listMaintenance()),
    settledList(() => store.listVehicles()),
    settledList(() => store.listVehicleTasks()),
  ]);
  const reminders: CalendarItem[] = [];
  for (const task of maintenance) {
    pushDated(reminders, task.nextDue, start, end, reminderTitle(task, vehicles), 'reminder');
  }
  for (const task of vehicleTasks) {
    pushDated(reminders, task.nextDue, start, end, reminderTitle(task, vehicles), 'reminder');
  }
  reminders.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));

  return { start, end, events, reminders };
}

export function speakCalendar(
  range: CalendarRange,
  events: CalendarItem[],
  reminders: CalendarItem[] = [],
): string {
  const eventLines = events.slice(0, 8).map((item) => `${item.date}: ${item.title}`);
  const reminderNames = reminders.slice(0, 6).map((item) => item.title);
  const parts: string[] = [];
  if (eventLines.length) {
    parts.push(eventLines.join('. ') + (events.length > 8 ? `, and ${events.length - 8} more` : ''));
  }
  if (reminderNames.length) {
    parts.push(`Reminders: ${reminderNames.join(', ')}`);
  }
  if (parts.length === 0) {
    return range === 'this_week' ? EMPTY_CALENDAR_WEEK_REPLY : EMPTY_CALENDAR_TODAY_REPLY;
  }
  return `${parts.join('. ')}.`;
}

export async function getCalendar(
  store: HouseholdStore,
  rangeRaw: string | undefined,
  now = new Date(),
): Promise<ToolResult> {
  const range = normalizeCalendarRange(rangeRaw);
  const { start, end, events, reminders } = await collectCalendarItems(store, range, now);
  const spoken = speakCalendar(range, events, reminders);
  return {
    ok: true,
    spoken,
    data: {
      range,
      start,
      end,
      scope: [...CALENDAR_VOICE_SCOPE],
      remindersScope: [...CALENDAR_REMINDER_SCOPE],
      items: events.map((item) => ({ date: item.date, title: item.title })),
      reminders: reminders.map((item) => ({ date: item.date, title: item.title })),
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
