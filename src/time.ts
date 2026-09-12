import { HOUSEHOLD_TIMEZONE } from './config';

function part(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): string {
  return parts.find((entry) => entry.type === type)?.value ?? '';
}

function householdParts(
  now: Date,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: HOUSEHOLD_TIMEZONE,
    ...options,
  }).formatToParts(now);
}

/** Calendar date in the household timezone (Southaven / America/Chicago). */
export function householdDate(now = new Date()): { year: string; month: string; day: string } {
  const parts = householdParts(now, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return {
    year: part(parts, 'year'),
    month: part(parts, 'month'),
    day: part(parts, 'day'),
  };
}

/** Local hour 0–23 in America/Chicago. */
export function householdHour(now = new Date()): number {
  const hour = Number(
    part(householdParts(now, { hour: '2-digit', hourCycle: 'h23' }), 'hour'),
  );
  if (!Number.isFinite(hour)) {
    return 0;
  }
  return hour === 24 ? 0 : hour;
}

/** Clock parts for the faint overnight face. */
export function householdClockParts(now = new Date()): { time: string; period: string } {
  const parts = householdParts(now, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const hour = part(parts, 'hour') || '12';
  const minute = part(parts, 'minute') || '00';
  const period = part(parts, 'dayPeriod').toUpperCase();
  return { time: `${hour}:${minute}`, period };
}
