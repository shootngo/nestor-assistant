import { Platform } from 'react-native';
import { OVERNIGHT_DAY_WINDOW_BRIGHTNESS, OVERNIGHT_WINDOW_BRIGHTNESS } from '../config';

/**
 * Real Android activity-window brightness (Samsung Tab / Play Store).
 * Does not ask for WRITE_SETTINGS and does not write global system brightness.
 * The dim overlay still runs as the visual fallback (and the faint clock).
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
    const level = dimmed ? OVERNIGHT_WINDOW_BRIGHTNESS : OVERNIGHT_DAY_WINDOW_BRIGHTNESS;
    await Brightness.setBrightnessAsync(level);
  } catch {
    // Overlay still dims. Samsung usually honors this; Fire OS often does not.
  }
}
