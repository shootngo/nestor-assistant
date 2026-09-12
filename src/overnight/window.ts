import {
  OVERNIGHT_DIM_END_HOUR,
  OVERNIGHT_DIM_START_HOUR,
  OVERNIGHT_TTS_CAP,
  OVERNIGHT_TTS_SCALE,
} from '../config';
import { householdHour } from '../time';

function clampHour(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const hour = Math.trunc(value);
  if (hour < 0) {
    return 0;
  }
  if (hour > 23) {
    return 23;
  }
  return hour;
}

/**
 * Overnight window in household-local hours (0–23).
 * When start > end the range wraps midnight (kitchen default 22 → 6).
 * Equal start and end disables the window.
 */
export function isOvernightHour(
  hour: number,
  startHour = OVERNIGHT_DIM_START_HOUR,
  endHour = OVERNIGHT_DIM_END_HOUR,
): boolean {
  const start = clampHour(startHour);
  const end = clampHour(endHour);
  if (start === end) {
    return false;
  }
  const local = clampHour(hour);
  if (start < end) {
    return local >= start && local < end;
  }
  return local >= start || local < end;
}

export function isOvernightNow(
  now = new Date(),
  startHour = OVERNIGHT_DIM_START_HOUR,
  endHour = OVERNIGHT_DIM_END_HOUR,
): boolean {
  return isOvernightHour(householdHour(now), startHour, endHour);
}

/** Softer TTS while the kitchen is in the overnight window. Mute still wins. */
export function nightSpeakVolume(volume: number, quietNight: boolean): number {
  const level = Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 1;
  if (!quietNight) {
    return level;
  }
  return Math.max(0.08, Math.min(OVERNIGHT_TTS_CAP, level * OVERNIGHT_TTS_SCALE));
}
