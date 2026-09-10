import * as ScreenOrientation from 'expo-screen-orientation';
import * as SystemUI from 'expo-system-ui';
import { colors } from './theme';

export async function applyKioskChrome(): Promise<void> {
  try {
    await SystemUI.setBackgroundColorAsync(colors.charcoal);
  } catch {
    // Some runtimes (including web) do not expose this.
  }

  try {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
  } catch {
    // Orientation lock is best-effort outside a native Android build.
  }
}
