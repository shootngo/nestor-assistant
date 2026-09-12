import { Platform } from 'react-native';
import {
  OVERNIGHT_DAY_WINDOW_BRIGHTNESS,
  OVERNIGHT_USE_WINDOW_BRIGHTNESS,
  OVERNIGHT_WINDOW_BRIGHTNESS,
} from '../config';

/**
 * Optional window brightness. Off by default — older Samsung Tabs flake
 * on this API. The dim overlay + faint clock are the night look.
 */
export async function applyOvernightBrightness(dimmed: boolean): Promise<void> {
  if (Platform.OS !== 'android' || !OVERNIGHT_USE_WINDOW_BRIGHTNESS) {
    return;
  }
  try {
    const Brightness = await import('expo-brightness');
    if (typeof Brightness.isAvailableAsync === 'function') {
      const available = await Brightness.isAvailableAsync();
      if (!available) {
        return;
      }
    }
    const level = dimmed ? OVERNIGHT_WINDOW_BRIGHTNESS : OVERNIGHT_DAY_WINDOW_BRIGHTNESS;
    await Brightness.setBrightnessAsync(level);
  } catch {
    // Overlay still dims. Do not prompt for WRITE_SETTINGS.
  }
}
