import { Platform } from 'react-native';
import { BRANDING_SHOWPIECE_EVERY } from './config';
import { PREVIEW_ADDED, PREVIEW_ANSWER, PREVIEW_CALENDAR, PREVIEW_LIST } from './listen/copy';
import { parseClockLabel, type OvernightClock } from './overnight/clock';
import type { WakePhase } from './wake/types';

/**
 * Web-only query helpers for screenshots and kitchen-side preview.
 * Ignored on the Samsung Tab A APK.
 *
 *   ?start=branding          jump to the first house-in-the-nest card
 *   ?start=showpiece         jump to branding and force the hatch showpiece
 *   ?showpieceEvery=1        hatch on every branding slot (also ?showpiece=1)
 *   ?showpieceFrame=nest|egg|hatch|house   freeze one showpiece keyframe
 *     nest  = opening still (cracked egg) + Nestor / Home, held gently
 *     egg   = same opening still
 *     hatch = mid still (shell cracking, zoom)
 *     house = revealed cottage + large serif Nestor + greeting
 *   ?session=listen|exit|mic|talk|mute   Phase 4–5 preview (web)
 *   ?session=talk&demo=add|list|calendar   Phase 6 canned household replies
 *   ?session=talk&hold=1                   freeze the talking mouth open (Imagine still)
 *   ?wakeTap=1                           tap the dashboard to wake (web)
 *   ?night=1                             force overnight dim + faint clock (web)
 *   ?night=0                             force daytime (web)
 *   ?night=1&clock=10:42                 freeze the night clock
 *   ?session=listen&night=1              night wake (veil lifts, quiet TTS)
 */

export type ShowpieceFrame = 'nest' | 'egg' | 'hatch' | 'house';

function query(): URLSearchParams | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }
  try {
    return new URLSearchParams(window.location.search);
  } catch {
    return null;
  }
}

export function getShowpieceFrame(): ShowpieceFrame | null {
  const value = query()?.get('showpieceFrame');
  if (value === 'nest' || value === 'egg' || value === 'hatch' || value === 'house') {
    return value;
  }
  return null;
}

export function getBrandingShowpieceEvery(): number {
  const params = query();
  if (!params) {
    return BRANDING_SHOWPIECE_EVERY;
  }
  if (getShowpieceFrame() || params.get('start') === 'showpiece') {
    return 1;
  }
  const raw = params.get('showpieceEvery') ?? params.get('showpiece');
  if (raw == null || raw === '') {
    return BRANDING_SHOWPIECE_EVERY;
  }
  if (raw === 'true') {
    return 1;
  }
  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed >= 1) {
    return Math.floor(parsed);
  }
  return BRANDING_SHOWPIECE_EVERY;
}

export function getStartAtBranding(): boolean {
  const params = query();
  if (!params) {
    return false;
  }
  if (getShowpieceFrame()) {
    return true;
  }
  const start = params.get('start');
  return start === 'branding' || start === 'showpiece';
}

export function getForceShowpiece(): boolean {
  if (getShowpieceFrame()) {
    return true;
  }
  return query()?.get('start') === 'showpiece';
}

export function getPreviewSession(): WakePhase | null {
  const value = query()?.get('session');
  if (value === 'listen' || value === 'listening') {
    return 'listening';
  }
  if (value === 'talk' || value === 'talking' || value === 'answer' || value === 'mute' || value === 'muted') {
    return 'listening';
  }
  if (value === 'exit' || value === 'exiting') {
    return 'exiting';
  }
  if (value === 'mic' || value === 'mic-needed') {
    return 'mic-needed';
  }
  if (value === 'idle') {
    return 'idle';
  }
  return null;
}

export function getPreviewTalking(): boolean {
  const value = query()?.get('session');
  return value === 'talk' || value === 'talking' || value === 'answer' || value === 'mute' || value === 'muted';
}

export function getPreviewMuted(): boolean {
  const value = query()?.get('session');
  if (value === 'mute' || value === 'muted') {
    return true;
  }
  const raw = query()?.get('mute');
  return raw === '1' || raw === 'true';
}

export function getPreviewAnswer(): string {
  if (!getPreviewTalking() && !getPreviewMuted()) {
    return '';
  }
  const params = query();
  const demo = params?.get('demo') ?? params?.get('household');
  if (demo === 'add' || demo === 'shopping') {
    return PREVIEW_ADDED;
  }
  if (demo === 'list') {
    return PREVIEW_LIST;
  }
  if (demo === 'calendar') {
    return PREVIEW_CALENDAR;
  }
  return PREVIEW_ANSWER;
}

export function getHoldTalking(): boolean {
  return getPreviewTalking() && getHoldExit();
}

export function getHoldExit(): boolean {
  const raw = query()?.get('hold');
  return raw === '1' || raw === 'true';
}

export function getWakeTapEnabled(): boolean {
  const params = query();
  if (!params) {
    return false;
  }
  const raw = params.get('wakeTap') ?? params.get('wake');
  return raw === '1' || raw === 'true';
}

/** Web-only: true force night, false force day, null follow Chicago clock. */
export function getOvernightPreview(): boolean | null {
  const params = query();
  if (!params) {
    return null;
  }
  const raw = params.get('night') ?? params.get('overnight');
  if (raw === '1' || raw === 'true' || raw === 'dim') {
    return true;
  }
  if (raw === '0' || raw === 'false' || raw === 'day') {
    return false;
  }
  return null;
}

export function getPreviewClock(): OvernightClock | null {
  const params = query();
  if (!params) {
    return null;
  }
  const raw = params.get('clock') ?? params.get('nightClock');
  if (!raw) {
    return null;
  }
  const parsed = parseClockLabel(raw.replace('+', ' '));
  if (!parsed) {
    return null;
  }
  if (!parsed.period) {
    const period = (params.get('period') ?? '').toUpperCase();
    if (period === 'AM' || period === 'PM') {
      return { time: parsed.time, period };
    }
  }
  return parsed;
}
