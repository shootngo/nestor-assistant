import { getBrandingShowpieceEvery } from '../preview';

let brandingPass = 0;

/**
 * Call once each time a branding slot becomes the active card.
 * Returns showpiece on every Nth pass (`BRANDING_SHOWPIECE_EVERY`, overridable on web).
 */
export function consumeBrandingPass(): 'simple' | 'showpiece' {
  brandingPass += 1;
  const every = getBrandingShowpieceEvery();
  if (every <= 0) {
    return 'simple';
  }
  return brandingPass % every === 0 ? 'showpiece' : 'simple';
}

export function brandingPassCount(): number {
  return brandingPass;
}
