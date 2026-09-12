import { householdClockParts } from '../time';

export type OvernightClock = {
  time: string;
  period: string;
};

const CLOCK_LINE = /^(\d{1,2}:\d{2})\s*(AM|PM)?$/i;

export function parseClockLabel(raw: string): OvernightClock | null {
  const match = raw.trim().match(CLOCK_LINE);
  if (!match) {
    return null;
  }
  return {
    time: match[1],
    period: (match[2] ?? '').toUpperCase(),
  };
}

export function formatHouseholdClock(now = new Date()): OvernightClock {
  return householdClockParts(now);
}

export function clockAccessibilityLabel(clock: OvernightClock): string {
  return clock.period ? `${clock.time} ${clock.period}` : clock.time;
}
