import { Platform } from 'react-native';
import { BRANDING_SHOWPIECE_EVERY } from './config';

/**
 * Web-only query helpers for screenshots and kitchen-side preview.
 * Ignored on the Fire tablet APK.
 *
 *   ?start=branding          jump to the first house-in-the-nest card
 *   ?start=showpiece         jump to branding and force the hatch showpiece
 *   ?showpieceEvery=1        hatch on every branding slot (also ?showpiece=1)
 *   ?showpieceFrame=nest|egg|hatch|house   freeze one showpiece keyframe
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
