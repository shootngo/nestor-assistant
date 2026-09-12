import { Platform } from 'react-native';
import { OVERNIGHT_WINDOW_BRIGHTNESS } from '../config';

/**
 * Best-effort activity window brightness. Does not ask for WRITE_SETTINGS.
 * Fire OS often ignores this; the dim overlay is the reliable night veil.
 */
export async function applyOvernightBrightness(dimmed: boolean): Promise<void> {
  if (Platform.OS !== 'android') {
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
    if (dimmed) {
      await Brightness.setBrightnessAsync(OVERNIGHT_WINDOW_BRIGHTNESS);
      return;
    }
    if (typeof Brightness.restoreSystemBrightnessAsync === 'function') {
      await Brightness.restoreSystemBrightnessAsync();
      return;
    }
    await Brightness.setBrightnessAsync(1);
  } catch {
    // Missing native module, web, or Fire OS refusing the API.
  }
}
