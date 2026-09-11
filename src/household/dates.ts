/** Keep in sync with `HOUSEHOLD_TIMEZONE` in src/config.ts (America/Chicago). */
const HOUSEHOLD_TIMEZONE = 'America/Chicago';

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((entry) => entry.type === type)?.value ?? '';
}

function chicagoParts(now = new Date()): { year: number; month: number; day: number; weekday: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: HOUSEHOLD_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long',
  }).formatToParts(now);
  return {
    year: Number(part(parts, 'year')),
    month: Number(part(parts, 'month')),
    day: Number(part(parts, 'day')),
    weekday: part(parts, 'weekday'),
  };
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function ymdFromParts(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function chicagoYmd(now = new Date()): string {
  const { year, month, day } = chicagoParts(now);
  return ymdFromParts(year, month, day);
}

export function chicagoLongDate(now = new Date()): string {
  const { weekday, year, month, day } = chicagoParts(now);
  const label = new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return `${weekday}, ${label}`;
}

function addDaysYmd(ymd: string, days: number): string {
  const [year, month, day] = ymd.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return ymdFromParts(utc.getUTCFullYear(), utc.getUTCMonth() + 1, utc.getUTCDate());
}

function weekdaySun0(ymd: string): number {
  const [year, month, day] = ymd.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export type CalendarRange = 'today' | 'this_week';

export function normalizeCalendarRange(raw: string | undefined): CalendarRange {
  const value = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ');
  if (value === 'this week' || value === 'week' || value === 'thisweek') {
    return 'this_week';
  }
  return 'today';
}

/** Sunday–Saturday of the current America/Chicago calendar week. */
export function calendarBounds(
  range: CalendarRange,
  now = new Date(),
): { start: string; end: string } {
  const today = chicagoYmd(now);
  if (range === 'today') {
    return { start: today, end: today };
  }
  const start = addDaysYmd(today, -weekdaySun0(today));
  return { start, end: addDaysYmd(start, 6) };
}

export function ymdInRange(date: string, start: string, end: string): boolean {
  return Boolean(date) && date >= start && date <= end;
}

const WEEKDAYS: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/** Accept YYYY-MM-DD, today/tomorrow, or a weekday name in America/Chicago. */
export function parseToolDate(raw: string, now = new Date()): string | null {
  const value = String(raw ?? '').trim().toLowerCase();
  if (!value) {
    return null;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const today = chicagoYmd(now);
  if (value === 'today') {
    return today;
  }
  if (value === 'tomorrow') {
    return addDaysYmd(today, 1);
  }
  const weekday = WEEKDAYS[value];
  if (weekday == null) {
    return null;
  }
  const delta = (weekday - weekdaySun0(today) + 7) % 7;
  return addDaysYmd(today, delta === 0 ? 0 : delta);
}
